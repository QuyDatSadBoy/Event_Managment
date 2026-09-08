import type { PartnerTier, PostCategory, RegistrationStatus, SessionType, TicketType } from "./types";

/** Tiny classnames joiner — enough for this codebase, no dependency needed. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const VN_MONTHS = [
  "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
  "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12",
];

const VN_WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getDate()} ${VN_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function formatDateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${time} · ${formatDateShort(d)}`;
}

export function formatWeekday(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? VN_WEEKDAYS[d.getDay()] : "";
}

/** "20 – 21 tháng 8, 2026" — collapses shared month/year across the range. */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): string {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return "";
  if (!e) return formatDate(s);

  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    if (s.getDate() === e.getDate()) return formatDate(s);
    return `${s.getDate()} – ${e.getDate()} ${VN_MONTHS[s.getMonth()]}, ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} ${VN_MONTHS[s.getMonth()]} – ${e.getDate()} ${VN_MONTHS[e.getMonth()]}, ${s.getFullYear()}`;
  }
  return `${formatDate(s)} – ${formatDate(e)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** "3 ngày trước" for admin lists where the exact timestamp is noise. */
export function timeAgo(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDateShort(d);
}

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  session: "Chuyên đề",
  keynote: "Keynote",
  panel: "Toạ đàm",
  break: "Giải lao",
  networking: "Kết nối",
  workshop: "Workshop",
  ceremony: "Nghi thức",
};

export const SESSION_TYPE_STYLE: Record<SessionType, string> = {
  session: "bg-ocean-50 text-ocean-700 ring-ocean-200",
  keynote: "bg-ocean-600 text-white ring-ocean-600",
  panel: "bg-cyan-glow/15 text-ocean-800 ring-cyan-glow/40",
  break: "bg-slate-100 text-slate-600 ring-slate-200",
  networking: "bg-gold/15 text-[#8a5d00] ring-gold/40",
  workshop: "bg-ocean-100 text-ocean-800 ring-ocean-300",
  ceremony: "bg-ocean-900 text-white ring-ocean-900",
};

export const POST_CATEGORY_LABEL: Record<PostCategory, string> = {
  news: "Tin tức",
  speech: "Bài phát biểu",
  press: "Thông cáo báo chí",
  announcement: "Thông báo",
};

export const PARTNER_TIER_LABEL: Record<PartnerTier, string> = {
  diamond: "Kim cương",
  platinum: "Bạch kim",
  gold: "Vàng",
  silver: "Bạc",
  bronze: "Đồng",
  partner: "Đối tác",
  media: "Bảo trợ truyền thông",
};

export const TICKET_LABEL: Record<TicketType, string> = {
  visitor: "Khách tham quan",
  delegate: "Đại biểu",
  exhibitor: "Đơn vị trưng bày",
  press: "Báo chí",
  vip: "Khách mời VIP",
};

export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Chờ duyệt",
  confirmed: "Đã xác nhận",
  cancelled: "Đã huỷ",
  checked_in: "Đã check-in",
};

export const STATUS_STYLE: Record<RegistrationStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  checked_in: "bg-ocean-50 text-ocean-700 ring-ocean-200",
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** YouTube/Vimeo watch links -> embeddable src. Returns null for anything else. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * <input type="datetime-local"> works in wall-clock time with no offset.
 * These two helpers convert between that and the unambiguous instant the API
 * stores, so a post published "now" is not shifted by the server's timezone.
 */
export function toDateTimeInput(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeInput(value: string): string {
  if (!value.trim()) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/**
 * Poster frame for a video link. A watch URL is not an image, so passing it to
 * next/image yields a 400 — derive YouTube's thumbnail instead and fall back to
 * the placeholder when we cannot.
 */
export function videoThumbnail(url: string): string {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") ?? "";
      if (!id && u.pathname.startsWith("/embed/")) id = u.pathname.slice(7);
    } else if (u.hostname === "youtu.be") {
      id = u.pathname.slice(1);
    }
    if (/^[\w-]{6,20}$/.test(id)) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } catch {
    return "";
  }
  return "";
}

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
