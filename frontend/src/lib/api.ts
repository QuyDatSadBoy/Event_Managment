import type { Meta } from "./types";

/**
 * Server components hit the Go service directly (no hop through nginx);
 * the browser hits the public origin so there is only ever one host in play.
 */
const SERVER_BASE =
  process.env.API_INTERNAL_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8090";

const BROWSER_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const apiBase = () => (typeof window === "undefined" ? SERVER_BASE : BROWSER_BASE);

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type Envelope<T> = { data: T; meta?: Meta; error?: string; fields?: Record<string, string> };

export type RequestOptions = RequestInit & {
  /** ISR window in seconds for server-side GETs. 0 disables caching. */
  revalidate?: number;
  token?: string | null;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<Envelope<T>> {
  const { revalidate, token, headers, ...init } = opts;
  const url = `${apiBase()}/api${path}`;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };
  if (init.body && !(init.body instanceof FormData) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const cacheOpts: RequestInit =
    typeof window === "undefined" && revalidate !== undefined
      ? revalidate === 0
        ? { cache: "no-store" }
        : ({ next: { revalidate } } as RequestInit)
      : {};

  let res: Response;
  try {
    res = await fetch(url, { ...init, ...cacheOpts, headers: finalHeaders });
  } catch {
    throw new ApiError("Không kết nối được máy chủ. Vui lòng thử lại.", 0);
  }

  if (res.status === 204) return { data: undefined as T };

  const text = await res.text();
  let body: Envelope<T>;
  try {
    body = text ? JSON.parse(text) : ({} as Envelope<T>);
  } catch {
    throw new ApiError("Máy chủ trả về dữ liệu không hợp lệ", res.status);
  }

  if (!res.ok) {
    throw new ApiError(body?.error ?? `Lỗi ${res.status}`, res.status, body?.fields ?? {});
  }
  return body;
}

/** Unwraps `{ data }` for endpoints that return a single object or plain list. */
export async function apiGet<T>(path: string, opts?: RequestOptions): Promise<T> {
  return (await request<T>(path, { method: "GET", ...opts })).data;
}

/** Keeps `meta` alongside `data` for paginated endpoints. */
export async function apiList<T>(
  path: string,
  opts?: RequestOptions,
): Promise<{ data: T[]; meta: Meta }> {
  const res = await request<T[]>(path, { method: "GET", ...opts });
  return {
    data: res.data ?? [],
    meta: res.meta ?? { page: 1, per_page: 0, total: 0, total_pages: 0 },
  };
}

export async function apiPost<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return (
    await request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      ...opts,
    })
  ).data;
}

export async function apiPut<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return (await request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}), ...opts })).data;
}

export async function apiPatch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return (await request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}), ...opts }))
    .data;
}

export async function apiDelete<T>(path: string, opts?: RequestOptions): Promise<T> {
  return (await request<T>(path, { method: "DELETE", ...opts })).data;
}

/**
 * Public pages must render even when the API is briefly unreachable, so every
 * server-side read goes through this and falls back instead of throwing a 500.
 */
export async function safeGet<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    return await apiGet<T>(path, { revalidate });
  } catch {
    return fallback;
  }
}

export async function safeList<T>(
  path: string,
  revalidate = 60,
): Promise<{ data: T[]; meta: Meta }> {
  try {
    return await apiList<T>(path, { revalidate });
  } catch {
    return { data: [], meta: { page: 1, per_page: 0, total: 0, total_pages: 0 } };
  }
}
