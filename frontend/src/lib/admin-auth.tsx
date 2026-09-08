"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { ApiError, apiGet, apiPost } from "./api";
import type { User } from "./types";

const TOKEN_KEY = "vhd_admin_token";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // private mode / blocked storage
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Session survives in memory for this tab even when storage is unavailable.
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  // Restore the session on first mount and verify the token is still good.
  useEffect(() => {
    let alive = true;
    Promise.resolve(readToken())
      .then(async (saved) => {
        if (!saved) return;
        const me = await apiGet<User>("/auth/me", { token: saved });
        if (!alive) return;
        setToken(saved);
        setUser(me);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) writeToken(null);
        if (alive) setToken(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Anything under /admin except the login screen requires a session.
  useEffect(() => {
    if (loading) return;
    const isLogin = pathname === "/admin/login";
    if (!user && !isLogin) router.replace("/admin/login");
    if (user && isLogin) router.replace("/admin");
  }, [loading, user, pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiPost<{ token: string; user: User }>("/auth/login", { email, password });
    writeToken(res.token);
    setToken(res.token);
    setUser(res.user);
    router.replace("/admin");
  }, [router]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AdminAuthProvider");
  return ctx;
}

/**
 * Admin data helpers. Every call carries the bearer token and turns a 401 into
 * a logout, so an expired session never leaves the UI in a broken half-state.
 */
export function useApi() {
  const { token, logout } = useAuth();

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) logout();
        throw err;
      }
    },
    [logout],
  );

  return useMemo(
    () => ({
      token,
      get: <T,>(path: string) => guard(() => apiGet<T>(path, { token })),
      list: <T,>(path: string) =>
        guard(async () => {
          const { apiList } = await import("./api");
          return apiList<T>(path, { token });
        }),
      post: <T,>(path: string, body?: unknown) => guard(() => apiPost<T>(path, body, { token })),
      put: <T,>(path: string, body?: unknown) =>
        guard(async () => {
          const { apiPut } = await import("./api");
          return apiPut<T>(path, body, { token });
        }),
      patch: <T,>(path: string, body?: unknown) =>
        guard(async () => {
          const { apiPatch } = await import("./api");
          return apiPatch<T>(path, body, { token });
        }),
      del: <T,>(path: string) =>
        guard(async () => {
          const { apiDelete } = await import("./api");
          return apiDelete<T>(path, { token });
        }),
      upload: <T,>(path: string, file: File) =>
        guard(() => {
          const fd = new FormData();
          fd.append("file", file);
          return apiPost<T>(path, fd, { token });
        }),
    }),
    [token, guard],
  );
}
