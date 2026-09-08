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

  return (
    <div className="flex items-stretch gap-2 sm:gap-3" aria-live="off">
      {started ? (
        <div className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur-md">
          <p className="text-lg font-bold text-white">Sự kiện đang diễn ra</p>
        </div>
      ) : (
        LABELS.map(([key, label]) => (
          <div
            key={key}
            className="min-w-[4.25rem] flex-1 rounded-2xl border border-white/15 bg-white/10 px-2 py-3 text-center backdrop-blur-md sm:min-w-[5rem] sm:px-3 sm:py-4"
          >
            <div className="font-mono text-2xl font-bold leading-none tabular-nums text-white sm:text-3xl lg:text-4xl">
              {parts ? String(parts[key]).padStart(2, "0") : "--"}
            </div>
            <div className="mt-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ocean-100/70 sm:text-[0.6875rem]">
              {label}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
