"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays, Users, Newspaper, Images, Handshake, ClipboardList,
  MessageSquare, Settings, LayoutDashboard, LogOut, Menu, X, ExternalLink, ChevronDown,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/chuong-trinh", label: "Chương trình", icon: CalendarDays },
  { href: "/admin/dien-gia", label: "Diễn giả", icon: Users },
  { href: "/admin/tin-tuc", label: "Tin tức & Bài viết", icon: Newspaper },
  { href: "/admin/thu-vien", label: "Thư viện", icon: Images },
  { href: "/admin/doi-tac", label: "Đối tác", icon: Handshake },
];

const NAV_SECONDARY = [
  { href: "/admin/dang-ky", label: "Đăng ký", icon: ClipboardList },
  { href: "/admin/lien-he", label: "Liên hệ", icon: MessageSquare },
  { href: "/admin/cai-dat", label: "Cấu hình sự kiện", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const renderNav = (items: typeof NAV) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href, item.exact);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300",
            active
              ? "bg-white/12 text-white"
              : "text-ocean-100/60 hover:bg-white/6 hover:text-white",
          )}
        >
          {active && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cyan-glow" />
          )}
          <Icon className={cn("h-4.5 w-4.5 shrink-0", active && "text-cyan-glow")} />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="min-h-dvh bg-ocean-50/40">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={cn(
          "surface-deep fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden />

        <div className="relative flex h-16 shrink-0 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-linear-135 from-ocean-500 to-cyan-glow text-sm font-extrabold tracking-tighter text-white">
              VHD
            </span>
            <span className="text-sm font-bold text-white">Quản trị sự kiện</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
            className="grid h-8 w-8 place-items-center rounded-full text-ocean-100/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {renderNav(NAV)}

          <p className="px-3.5 pb-2 pt-6 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ocean-100/35">
            Vận hành
          </p>
          {renderNav(NAV_SECONDARY)}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ocean-100/60 transition hover:bg-white/6 hover:text-white"
          >
            <ExternalLink className="h-4.5 w-4.5" />
            Xem trang công khai
          </Link>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-abyss/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* ---------- Main ---------- */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ocean-100 bg-white/85 px-5 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
            className="grid h-10 w-10 place-items-center rounded-full text-ocean-700 transition hover:bg-ocean-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition hover:bg-ocean-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-135 from-ocean-600 to-cyan-glow text-xs font-bold text-white">
                {initials(user?.name || user?.email || "?")}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-ocean-950">
                  {user?.name || "Quản trị viên"}
                </span>
                <span className="block text-xs leading-tight text-ocean-950/45">
                  {user?.email}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-ocean-400 transition-transform duration-300",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-ocean-100 bg-white py-1.5 shadow-[0_20px_50px_-20px_rgb(8_42_77/0.4)]">
                  <div className="border-b border-ocean-50 px-4 py-3 sm:hidden">
                    <p className="text-sm font-semibold text-ocean-950">{user?.name}</p>
                    <p className="text-xs text-ocean-950/45">{user?.email}</p>
                  </div>
                  <Link
                    href="/admin/cai-dat"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ocean-800 transition hover:bg-ocean-50"
                  >
                    <Settings className="h-4 w-4" />
                    Cấu hình sự kiện
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="px-5 py-7 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

/** Consistent page title block for every admin screen. */
export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ocean-950">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ocean-950/55">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex flex-wrap gap-2.5">{action}</div>}
    </div>
  );
}
