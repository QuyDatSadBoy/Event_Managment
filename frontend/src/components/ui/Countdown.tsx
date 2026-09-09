"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };
type State = { mounted: boolean; parts: Parts | null };

function diff(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

const UNITS: Array<[keyof Parts, string]> = [
  ["days", "NGÀY"],
  ["hours", "GIỜ"],
  ["minutes", "PHÚT"],
  ["seconds", "GIÂY"],
];

/**
 * design.pen "Countdown": 88×88 units on #0A6A62 with a 1px #2A8B83 border,
 * radius 10, value in Roboto Mono 32/700 cream, unit label 10/600 tracked 1.4.
 *
 * The label colour is the one place this component departs from the file. The
 * drawing uses brand-secondary (#62B4AF), which is 2.67:1 on the unit's own
 * background — below the floor for any text, let alone 10px. brand-tint clears
 * it at 4.8:1 and stays inside the palette.
 */
export function Countdown({ target }: { target: string | null }) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const [state, setState] = useState<State>({ mounted: false, parts: null });

  useEffect(() => {
    if (Number.isNaN(targetMs)) return;
    const tick = () => setState({ mounted: true, parts: diff(targetMs) });
    // The first value comes from a frame callback, not the effect body, so the
    // server and the first client render agree.
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  const { mounted, parts } = state;

  if (mounted && parts === null) {
    return (
      <p className="inline-flex items-center gap-2.5 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-cream">
        <span className="h-2 w-2 rounded-full bg-cream" aria-hidden />
        Sự kiện đang diễn ra
      </p>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3" aria-live="off">
      {UNITS.map(([key, label]) => (
        <div
          key={key}
          className="flex h-[72px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] border border-[#2A8B83] bg-[#0A6A62] sm:h-22 sm:w-22 sm:flex-none"
        >
          <span className="font-mono text-[1.75rem] font-bold leading-none tabular-nums text-cream sm:text-[2rem]">
            {parts ? String(parts[key]).padStart(2, "0") : "––"}
          </span>
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-brand-200">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
