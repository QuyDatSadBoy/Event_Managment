"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn, formatDateRange } from "@/lib/utils";
import type { Settings } from "@/lib/types";

/**
 * design.pen M1: the mobile home screen carries a sticky bottom CTA bar.
 *
 * It stays out of the way until the hero's own register button has scrolled
 * past — showing both at once would be two primary actions competing on a
 * 390px screen — and it reserves its own height on the body so it never covers
 * the end of the page.
 */
export function MobileStickyCta({ settings }: { settings: Settings }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.75);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!settings.registration_open) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden",
        "px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
        "transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-bold leading-tight text-brand-950">
            {settings.event_name}
          </p>
          <p className="truncate text-caption text-ink-muted">
            {formatDateRange(settings.start_date, settings.end_date)}
          </p>
        </div>
        <Link
          href="/dang-ky"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-brand-600 px-5 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-800"
        >
          Đăng ký
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
