"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn, formatDateRange } from "@/lib/utils";
import type { Settings } from "@/lib/types";

/**
 * The mobile home screen carries a sticky bottom CTA bar.
 *
 * It stays out of the way until the hero's own register button has scrolled
 * past — showing both at once would be two primary actions competing on a
 * 390px screen.
 *
 * It also publishes its measured height to `--sticky-cta-h`, which globals.css
 * turns into padding on the body. A bar fixed to the bottom of the viewport
 * otherwise covers the last rows of the footer, and — the part that actually
 * breaks things — any control the keyboard focuses near the end of the page.
 * The height is measured rather than hardcoded because the safe-area inset and
 * the event name's line count both change it.
 */
export function MobileStickyCta({ settings }: { settings: Settings }) {
  const [show, setShow] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const open = settings.registration_open;

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.75);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  useEffect(() => {
    const el = barRef.current;
    if (!open || !el) return;

    // The bar is hidden above lg, where it must reserve nothing.
    const desktop = window.matchMedia("(min-width: 1024px)");

    const sync = () => {
      const h = desktop.matches ? 0 : el.offsetHeight;
      document.body.style.setProperty("--sticky-cta-h", `${h}px`);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    desktop.addEventListener("change", sync);

    return () => {
      ro.disconnect();
      desktop.removeEventListener("change", sync);
      document.body.style.removeProperty("--sticky-cta-h");
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={barRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden",
        "px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
        "transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-bold leading-tight text-ink">
            {settings.event_name}
          </p>
          <p className="truncate text-caption text-ink-muted">
            {formatDateRange(settings.start_date, settings.end_date)}
          </p>
        </div>
        <Link
          href="/dang-ky"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-accent-500 px-5 text-sm font-bold text-ink transition-colors duration-300 hover:bg-accent-400"
        >
          Đăng ký
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
