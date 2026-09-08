"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, CalendarDays, ArrowRight } from "lucide-react";
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

export function Header({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    // A reload part-way down the page must not start with a transparent header,
    // so seed the state from the next frame rather than the effect body.
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-ocean-600 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Bỏ qua tới nội dung chính
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled || open
            ? "border-b border-ocean-100 bg-white/85 backdrop-blur-xl shadow-[0_1px_20px_-8px_rgb(8_42_77/0.25)]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3" aria-label={settings.event_name}>
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-extrabold tracking-tighter transition-colors duration-500",
                scrolled || open
                  ? "bg-linear-135 from-ocean-600 to-cyan-glow text-white"
                  : "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md",
              )}
            >
              VHD
            </span>
            <span className="hidden sm:block">
              <span
                className={cn(
                  "block text-[0.9375rem] font-bold leading-tight tracking-tight transition-colors duration-500",
                  scrolled || open ? "text-ocean-950" : "text-white",
                )}
              >
                {settings.event_name}
              </span>
              <span
                className={cn(
                  "block text-[0.6875rem] font-medium leading-tight transition-colors duration-500",
                  scrolled || open ? "text-ocean-600" : "text-ocean-100/80",
                )}
              >
                {settings.event_tagline}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[0.875rem] font-medium transition-colors duration-300",
                  scrolled || open
                    ? isActive(item.href)
                      ? "text-ocean-700"
                      : "text-ocean-950/70 hover:text-ocean-700"
                    : isActive(item.href)
                      ? "text-white"
                      : "text-white/75 hover:text-white",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span
                    className={cn(
                      "absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full",
                      scrolled || open ? "bg-ocean-600" : "bg-cyan-glow",
                    )}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {settings.registration_open && (
              <Link
                href="/dang-ky"
                className={cn(
                  "hidden h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-300 sm:inline-flex",
                  scrolled || open
                    ? "bg-linear-to-r from-ocean-600 to-ocean-500 text-white shadow-[0_10px_26px_-12px_rgb(6_120_214/0.9)] hover:to-cyan-glow"
                    : "bg-white text-ocean-900 hover:bg-ocean-50",
                )}
              >
                Đăng ký
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full transition xl:hidden",
                scrolled || open
                  ? "bg-ocean-50 text-ocean-800 hover:bg-ocean-100"
                  : "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md",
              )}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 xl:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 bg-abyss/60 backdrop-blur-sm transition-opacity duration-400",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          className={cn(
            "absolute inset-x-0 top-[var(--header-h)] max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-b border-ocean-100 bg-white px-5 pb-8 pt-4 shadow-2xl transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
          )}
          aria-label="Điều hướng di động"
        >
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ transitionDelay: open ? `${i * 35}ms` : "0ms" }}
              className={cn(
                "flex items-center justify-between border-b border-ocean-50 py-3.5 text-base font-medium transition-all duration-300",
                open ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
                isActive(item.href) ? "text-ocean-700" : "text-ocean-950/75",
              )}
            >
              {item.label}
              <ArrowRight
                className={cn(
                  "h-4 w-4 transition",
                  isActive(item.href) ? "text-ocean-600" : "text-ocean-300",
                )}
              />
            </Link>
          ))}

          {settings.registration_open && (
            <Link
              href="/dang-ky"
              onClick={() => setOpen(false)}
              className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-linear-to-r from-ocean-600 to-ocean-500 text-[0.9375rem] font-semibold text-white shadow-[0_12px_30px_-12px_rgb(6_120_214/0.9)]"
            >
              Đăng ký tham dự
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {(settings.start_date || settings.venue_name) && (
            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ocean-950/50">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateRange(settings.start_date, settings.end_date)}
              {settings.venue_name && ` · ${settings.venue_name}`}
            </p>
          )}
        </nav>
      </div>
    </>
  );
}
