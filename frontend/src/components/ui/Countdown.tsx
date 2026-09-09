"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

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

const LABELS: Array<[keyof Parts, string]> = [
  ["days", "Ngày"],
  ["hours", "Giờ"],
  ["minutes", "Phút"],
  ["seconds", "Giây"],
];

type State = { mounted: boolean; parts: Parts | null };

export function Countdown({ target }: { target: string | null }) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  // Start empty so the server and the first client render agree; the first
  // animation frame after mount fills it in, then the interval keeps it fresh.
  const [state, setState] = useState<State>({ mounted: false, parts: null });

  useEffect(() => {
    if (Number.isNaN(targetMs)) return;
    const tick = () => setState({ mounted: true, parts: diff(targetMs) });
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  const { mounted, parts } = state;
  const started = mounted && parts === null;

  if (started) {
    return (
      <p className="inline-flex items-center gap-2.5 rounded-full border border-cyan-soft/40 bg-abyss/50 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-cyan-soft" aria-hidden />
        Sự kiện đang diễn ra
      </p>
    );
  }

  return (
    <div
      className="flex max-w-md items-stretch divide-x divide-white/20 border-y border-white/20"
      aria-live="off"
    >
      {LABELS.map(([key, label]) => (
        <div key={key} className="flex-1 px-3 py-3.5 first:pl-0 sm:px-5 sm:py-4">
          <div className="text-[clamp(1.5rem,1rem+1.8vw,2.25rem)] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-white">
            {parts ? String(parts[key]).padStart(2, "0") : "––"}
          </div>
          <div className="mt-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ocean-100/70">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
