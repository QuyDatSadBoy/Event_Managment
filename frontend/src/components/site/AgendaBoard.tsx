"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, MapPin, Users, ChevronDown } from "lucide-react";
import type { AgendaDay, SessionType } from "@/lib/types";
import {
  SESSION_TYPE_LABEL, SESSION_TYPE_STYLE, cn, formatDate, formatWeekday, initials,
} from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { EmptyState } from "@/components/ui/EmptyState";

export function AgendaBoard({ days }: { days: AgendaDay[] }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [track, setTrack] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const day = days[dayIndex];

  const tracks = useMemo(() => {
    const set = new Set<string>();
    day?.sessions.forEach((s) => s.track && set.add(s.track));
    return Array.from(set).sort();
  }, [day]);

  const sessions = useMemo(
    () => (track === "all" ? day?.sessions ?? [] : (day?.sessions ?? []).filter((s) => s.track === track)),
    [day, track],
  );

  if (!day) return null;

  return (
    <div>
      {/* Day switcher */}
      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Chọn ngày">
        {days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setDayIndex(i);
              setTrack("all");
            }}
            role="tab"
            aria-selected={i === dayIndex}
            className={cn(
              "group relative flex-1 min-w-[13rem] overflow-hidden rounded-2xl border px-5 py-4 text-left transition-[background-color,border-color,box-shadow,color] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
              i === dayIndex
                ? "border-transparent bg-linear-135 from-ocean-950 to-ocean-800 text-white shadow-[0_16px_36px_-18px_rgb(8_42_77/0.55)]"
                : "border-ocean-200 bg-white text-ocean-950 hover:border-ocean-400 hover:bg-ocean-50",
            )}
          >
            <span
              className={cn(
                "block text-[0.6875rem] font-bold uppercase tracking-[0.16em]",
                i === dayIndex ? "text-cyan-soft" : "text-ocean-700",
              )}
            >
              {d.label}
            </span>
            <span className="mt-1 block text-base font-bold leading-tight tracking-tight">
              {d.title || formatDate(d.date)}
            </span>
            <span
              className={cn(
                "mt-1 block text-xs",
                i === dayIndex ? "text-ocean-100/85" : "text-ocean-950/55",
              )}
            >
              {formatWeekday(d.date)}, {formatDate(d.date)} · {d.sessions.length} phiên
            </span>
          </button>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold tracking-tight text-ocean-950 sm:text-2xl">
        {day.label}
        {day.title && <span className="text-ocean-950/55"> · {day.title}</span>}
      </h2>
      <p className="mt-1 text-sm text-ocean-950/50">
        {formatWeekday(day.date)}, {formatDate(day.date)} · {day.sessions.length} phiên
      </p>

      {/* Track filter */}
      {tracks.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-ocean-950/45">
            Chủ đề
          </span>
          {["all", ...tracks].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrack(t)}
              aria-pressed={track === t}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium sm:min-h-9",
                "transition-[background-color,color] duration-300",
                track === t
                  ? "bg-ocean-950 text-white"
                  : "bg-ocean-50 text-ocean-800 hover:bg-ocean-100",
              )}
            >
              {t === "all" ? "Tất cả" : t}
            </button>
          ))}
        </div>
      )}

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Clock}
            title="Không có phiên nào thuộc chủ đề này"
            description="Thử chọn chủ đề khác hoặc xem toàn bộ chương trình trong ngày."
          />
        </div>
      ) : (
        <ol className="relative mt-10 space-y-3 lg:pl-0">
          <span
            className="absolute left-[6.5rem] top-4 bottom-4 hidden w-px bg-linear-to-b from-ocean-200 via-ocean-200 to-transparent lg:block"
            aria-hidden
          />

          {sessions.map((session) => {
            const open = expanded === session.id;
            const hasDetail = Boolean(session.description) || session.speakers.length > 0;

            return (
              <li key={session.id} className="relative">
                <div
                  className={cn(
                    "group rounded-2xl border bg-white transition-[border-color,box-shadow] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open
                      ? "border-ocean-400 shadow-[0_20px_44px_-22px_rgb(8_42_77/0.4)]"
                      : "border-ocean-100 hover:border-ocean-300 hover:shadow-[0_16px_36px_-22px_rgb(8_42_77/0.32)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => hasDetail && setExpanded(open ? null : session.id)}
                    aria-expanded={hasDetail ? open : undefined}
                    disabled={!hasDetail}
                    className={cn(
                      "flex w-full flex-col gap-4 p-5 text-left lg:flex-row lg:items-center lg:gap-6 lg:p-6",
                      hasDetail ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <div className="flex shrink-0 items-baseline gap-2 lg:w-24 lg:flex-col lg:items-start lg:gap-0.5">
                      <span className="font-mono text-lg font-bold tabular-nums text-ocean-800 lg:text-xl">
                        {session.start_time}
                      </span>
                      {session.end_time && (
                        <span className="font-mono text-xs tabular-nums text-ocean-950/40">
                          {session.end_time}
                        </span>
                      )}
                    </div>

                    <span
                      className={cn(
                        "absolute left-[6.5rem] top-8 hidden h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white transition-colors duration-300 lg:block",
                        open ? "bg-cyan-glow" : "bg-ocean-300 group-hover:bg-ocean-500",
                      )}
                      aria-hidden
                    />

                    <div className="min-w-0 flex-1 lg:pl-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ring-1 ring-inset",
                            SESSION_TYPE_STYLE[session.type as SessionType],
                          )}
                        >
                          {SESSION_TYPE_LABEL[session.type as SessionType]}
                        </span>
                        {session.track && (
                          <span className="text-[0.6875rem] font-medium text-ocean-950/45">
                            {session.track}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 text-balance text-base font-bold leading-snug tracking-tight text-ocean-950 lg:text-lg">
                        {session.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ocean-950/50">
                        {session.room && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {session.room}
                          </span>
                        )}
                        {session.speakers.length > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {session.speakers.length} diễn giả
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {session.speakers.length > 0 && (
                        <div className="flex -space-x-2.5">
                          {session.speakers.slice(0, 3).map((sp) => (
                            <span
                              key={sp.id}
                              title={sp.name}
                              className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white"
                            >
                              <SafeImage
                                src={sp.photo}
                                alt={sp.name}
                                fallbackLabel={initials(sp.name)}
                                sizes="36px"
                              />
                            </span>
                          ))}
                          {session.speakers.length > 3 && (
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-ocean-100 text-[0.625rem] font-bold text-ocean-700 ring-2 ring-white">
                              +{session.speakers.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {hasDetail && (
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 shrink-0 text-ocean-400 transition-transform duration-400",
                            open && "rotate-180",
                          )}
                        />
                      )}
                    </div>
                  </button>

                  {/* Grid-rows trick animates height without measuring it. */}
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-ocean-100 px-5 py-5 lg:px-6 lg:pl-[9.5rem]">
                        {session.description && (
                          <p className="text-pretty text-sm leading-relaxed text-ocean-950/65">
                            {session.description}
                          </p>
                        )}

                        {session.speakers.length > 0 && (
                          <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {session.speakers.map((sp) => (
                              <Link
                                key={sp.id}
                                href={`/dien-gia/${sp.slug}`}
                                className="flex items-center gap-3 rounded-xl border border-ocean-100 bg-ocean-50/50 p-3 transition duration-300 hover:border-ocean-300 hover:bg-white"
                              >
                                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                                  <SafeImage
                                    src={sp.photo}
                                    alt={sp.name}
                                    fallbackLabel={initials(sp.name)}
                                    sizes="44px"
                                  />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-ocean-950">
                                    {sp.name}
                                  </span>
                                  <span className="block truncate text-xs text-ocean-950/50">
                                    {[sp.title, sp.company].filter(Boolean).join(" · ")}
                                  </span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
