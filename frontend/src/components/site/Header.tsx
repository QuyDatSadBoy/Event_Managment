"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn, formatDateRange } from "@/lib/utils";
import type { Settings } from "@/lib/types";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/gioi-thieu", label: "Giới thiệu" },
  { href: "/chuong-trinh", label: "Chương trình" },
  { href: "/dien-gia", label: "Diễn giả" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/thu-vien", label: "Thư viện" },
  { href: "/doi-tac", label: "Đối tác" },
  { href: "/lien-he", label: "Liên hệ" },
];

/**
 * design.pen "Header Desktop" (1440×80) and "Header Mobile" (390×60): a solid
 * white bar with a bottom border, a 44px logo mark beside a two-line lockup,
 * nav at 15/500 with 30px gaps, and the register CTA on the right.
 *
 * It is opaque at every scroll position — the file draws it that way, and a
 * transparent header over the hero would put white nav labels on whatever
 * photograph the editor uploads.
 */
export function Header({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-control focus:bg-brand-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Bỏ qua tới nội dung chính
      </a>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white">
        <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label={settings.event_name}
            translate="no"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-brand-600 text-[0.8125rem] font-bold tracking-tight text-white">
              VHD
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[1.0625rem] font-bold tracking-tight text-brand-950">
                {settings.event_name}
              </span>
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
                {settings.venue_name || settings.event_tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-[30px] xl:flex" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 text-[0.9375rem] font-medium transition-colors duration-300",
                  isActive(item.href)
                    ? "text-brand-600"
                    : "text-brand-950 hover:text-brand-600",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {settings.registration_open && (
              <Link
                href="/dang-ky"
                className="inline-flex h-11 items-center gap-2 rounded-control bg-brand-600 px-4 text-[0.8125rem] font-bold text-white transition-colors duration-300 hover:bg-brand-800 sm:px-5 sm:text-sm"
              >
                Đăng ký
                <ArrowRight className="hidden h-3.5 w-3.5 sm:block" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center rounded-control bg-brand-100 text-brand-800 transition-colors duration-300 hover:bg-brand-200 xl:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn("fixed inset-0 z-40 xl:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-brand-950/55 transition-opacity duration-400",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          className={cn(
            "absolute inset-x-0 top-[var(--header-h)] max-h-[calc(100dvh-var(--header-h))] overflow-y-auto overscroll-contain",
            "border-b border-line bg-white px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2",
            "shadow-[0_24px_48px_-24px_rgb(12_43_41/0.35)]",
            "transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          )}
          aria-label="Điều hướng di động"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-11 items-center justify-between border-b border-line/70 py-3.5 text-base font-medium",
                isActive(item.href) ? "text-brand-600" : "text-brand-950",
              )}
            >
              {item.label}
              <ArrowRight
                className={cn("h-4 w-4", isActive(item.href) ? "text-brand-600" : "text-brand-300")}
              />
            </Link>
          ))}

          {(settings.start_date || settings.venue_name) && (
            <p className="mt-5 text-center text-caption text-ink-muted">
              {formatDateRange(settings.start_date, settings.end_date)}
              {settings.venue_name && ` · ${settings.venue_name}`}
            </p>
          )}
        </nav>
      </div>
    </>
  );
}
