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
 * Homepage sections that correspond to a nav destination, in page order.
 *
 * The nav is a set of routes, not in-page anchors, so scroll position can only
 * be reflected by mapping each homepage section onto the route that covers the
 * same subject. Sections with no counterpart — the countdown, the scale
 * figures, the CTA band — are absent on purpose: they must not clear the
 * indicator as they pass.
 */
const HOME_SECTIONS: Array<{ id: string; href: string }> = [
  { id: "gioi-thieu", href: "/gioi-thieu" },
  { id: "chuong-trinh", href: "/chuong-trinh" },
  { id: "dien-gia", href: "/dien-gia" },
  { id: "thu-vien", href: "/thu-vien" },
  { id: "tin-tuc", href: "/tin-tuc" },
  { id: "doi-tac", href: "/doi-tac" },
];

/**
 * A navy bar carrying a white lockup, the nav at 15/500, and the register CTA
 * in the accent orange.
 *
 * Two states. At the top of the page it is transparent and sits *inside* the
 * navy hero, so the dark block at the top of the page reads as one surface.
 * Once scrolled it becomes an opaque compact bar — 64px instead of 80px — with
 * a hairline and a light blur behind it.
 *
 * The transparent state is only safe because the hero puts its photograph in
 * its own panel: the type, and now the nav, sit on flat navy at a known
 * contrast rather than over whatever image an editor uploads. It would have
 * been the wrong choice against a full-bleed photographic hero.
 *
 * The bar shrinks by animating its own inner height, not `--header-h`. Pages
 * reserve space with that variable, and shrinking it mid-scroll would drag the
 * whole document up under the header.
 */
export function Header({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // A little past the bar's own height, so the change never fires while the
    // header still overlaps the very top of the hero.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const onHome = pathname === "/";

  /**
   * Scroll spy, homepage only. The active nav item follows the section passing
   * under the header instead of staying pinned to "Trang chủ" for the whole
   * page.
   *
   * Measured against a line a little below the bar rather than with an
   * IntersectionObserver threshold: sections here are several screens tall, so
   * a ratio-based threshold never fires for the long ones and fires twice for
   * the short ones. "The last section whose top has crossed the line" is the
   * behaviour a reader expects, and it is exact.
   */
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    if (!onHome) {
      setSection(null);
      return;
    }
    const found = HOME_SECTIONS.map((s) => [s.href, document.getElementById(s.id)] as const)
      .filter((pair): pair is readonly [string, HTMLElement] => pair[1] !== null);
    if (found.length === 0) return;

    let frame = 0;
    const pick = () => {
      frame = 0;
      // The bar is 64px once scrolled; a little under it reads as "current".
      const line = 96;
      let current: string | null = null;
      for (const [href, el] of found) {
        if (el.getBoundingClientRect().top <= line) current = href;
      }
      setSection(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onHome]);

  const isActive = (href: string) => {
    // On the homepage the scrolled section wins; above the first of them the
    // indicator falls back to "Trang chủ".
    if (onHome) return section ? href === section : href === "/";
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-control focus:bg-accent-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-ink"
      >
        Bỏ qua tới nội dung chính
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          // The drawer needs an opaque bar behind it even at scroll position 0.
          scrolled || open
            ? "border-b border-white/10 bg-brand-900/95 shadow-[0_10px_30px_-18px_rgb(13_20_40/0.8)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div
          className={cn(
            "container-page flex items-center justify-between gap-4",
            "transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            // Compact whenever the bar is opaque, so the drawer below can rely
            // on a known offset. 60px matches the mobile --header-h exactly, so
            // opening the drawer on a phone moves nothing.
            scrolled || open ? "h-15 lg:h-16" : "h-[var(--header-h)]",
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label={settings.event_name}
            translate="no"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-accent-500 text-[0.8125rem] font-extrabold tracking-tight text-ink">
              VHD
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[1.0625rem] font-extrabold tracking-[-0.02em] text-white">
                {settings.event_name}
              </span>
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-brand-300">
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
                  isActive(item.href) ? "text-white" : "text-brand-200 hover:text-white",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-500" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {settings.registration_open && (
              <Link
                href="/dang-ky"
                className="inline-flex h-11 items-center gap-2 rounded-control bg-accent-500 px-4 text-[0.8125rem] font-bold text-ink transition-colors duration-300 hover:bg-accent-400 sm:px-5 sm:text-sm"
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
              className="grid h-11 w-11 place-items-center rounded-control bg-white/10 text-white transition-colors duration-300 hover:bg-white/20 xl:hidden"
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
            "absolute inset-0 bg-brand-950/70 transition-opacity duration-400",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          className={cn(
            "absolute inset-x-0 top-15 max-h-[calc(100dvh-3.75rem)] overflow-y-auto overscroll-contain",
            "lg:top-16 lg:max-h-[calc(100dvh-4rem)]",
            "border-b border-white/10 bg-brand-900 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2",
            "shadow-[0_24px_48px_-24px_rgb(13_20_40/0.7)]",
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
                "flex min-h-11 items-center justify-between border-b border-white/8 py-3.5 text-base font-medium",
                isActive(item.href) ? "text-white" : "text-brand-200",
              )}
            >
              {item.label}
              <ArrowRight
                className={cn("h-4 w-4", isActive(item.href) ? "text-accent-500" : "text-brand-500")}
              />
            </Link>
          ))}

          {(settings.start_date || settings.venue_name) && (
            <p className="mt-5 text-center text-caption text-brand-300">
              {formatDateRange(settings.start_date, settings.end_date)}
              {settings.venue_name && ` · ${settings.venue_name}`}
            </p>
          )}
        </nav>
      </div>
    </>
  );
}
