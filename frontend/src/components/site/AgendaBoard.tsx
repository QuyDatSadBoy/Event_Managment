"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, MapPin, Users } from "lucide-react";
import type { AgendaDay, SessionType } from "@/lib/types";
import { SESSION_TYPE_LABEL, cn, formatDate, formatWeekday, initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * design.pen D2/M2: filter bar (day tabs + track chips) → day header → session
 * list. Desktop uses the horizontal Agenda Row; mobile swaps to the stacked
 * Agenda Card, and the track chips scroll sideways instead of wrapping.
 */
export function AgendaBoard({ days }: { days: AgendaDay[] }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [track, setTrack] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const day = days[dayIndex];

  const tracks = useMemo(() => {
    const set = new Set<string>();
    day?.sessions.forEach((s) => s.track && set.add(s.track));
    return Array.from(set).sort();
  }, [day]);

  const sessions = useMemo(
    () =>
      track === "all"
        ? (day?.sessions ?? [])
        : (day?.sessions ?? []).filter((s) => s.track === track),
    [day, track],
  );

  if (!day) return null;

  return (
    <div>
      {/* Day tabs */}
      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Chọn ngày">
        {days.map((d, i) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={i === dayIndex}
            onClick={() => {
              setDayIndex(i);
              setTrack("all");
            }}
            className={cn(
              "min-w-[13rem] flex-1 rounded-card border px-5 py-4 text-left",
              "transition-[background-color,border-color,color,box-shadow] duration-300",
              i === dayIndex
                ? "border-brand-800 bg-brand-800 text-white shadow-card"
                : "border-line bg-white text-brand-950 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            <span
              className={cn(
                "block text-[0.6875rem] font-bold uppercase tracking-[0.15em]",
                i === dayIndex ? "text-brand-200" : "text-brand-600",
              )}
            >
              {d.label}
            </span>
            <span className="mt-1 block text-[1.0625rem] font-semibold leading-tight tracking-tight">
              {d.title || formatDate(d.date)}
            </span>
            <span
              className={cn("mt-1 block text-caption", i === dayIndex ? "text-brand-200" : "text-ink-muted")}
            >
              {formatWeekday(d.date)}, {formatDate(d.date)} · {d.sessions.length} phiên
            </span>
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="mt-9">
        <h2 className="text-[clamp(1.375rem,1.1rem+1vw,1.75rem)] font-bold tracking-tight text-brand-950">
          {day.label}
          {day.title && <span className="text-ink-muted"> · {day.title}</span>}
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          {formatWeekday(day.date)}, {formatDate(day.date)} · {day.sessions.length} phiên
        </p>
      </div>

      {/* Track chips — a sideways scroller on mobile, per design.pen M2. */}
      {tracks.length > 0 && (
        <div className="mt-5 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
            {["all", ...tracks].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(t)}
                aria-pressed={track === t}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium sm:min-h-9",
                  "transition-[background-color,color] duration-300",
                  track === t
                    ? "bg-brand-800 text-white"
                    : "bg-brand-100 text-brand-800 hover:bg-brand-200",
                )}
              >
                {t === "all" ? "Tất cả" : t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Clock}
            title="Không có phiên nào thuộc chủ đề này"
            description="Thử chọn chủ đề khác hoặc xem toàn bộ chương trình trong ngày."
          />
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {sessions.map((session) => {
            const open = expanded === session.id;
            const hasDetail = Boolean(session.description) || session.speakers.length > 0;
            const time = session.end_time
              ? `${session.start_time} – ${session.end_time}`
              : session.start_time;

            return (
              <li key={session.id}>
                <div
                  className={cn(
                    "rounded-row border bg-white transition-[border-color,box-shadow] duration-300",
                    open ? "border-brand-400 shadow-card" : "border-line hover:border-brand-300",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => hasDetail && setExpanded(open ? null : session.id)}
                    aria-expanded={hasDetail ? open : undefined}
                    disabled={!hasDetail}
                    className={cn(
                      "flex w-full flex-col gap-3 p-5 text-left lg:flex-row lg:items-center lg:gap-6 lg:px-[26px] lg:py-[22px]",
                      hasDetail ? "cursor-pointer" : "cursor-default",
                    )}
                  >
                    <div className="shrink-0 lg:w-[120px]">
                      <p className="font-mono text-sm font-bold leading-tight text-brand-800">
                        {time}
                      </p>
                      {session.room && (
                        <p className="mt-0.5 text-xs text-ink-muted">{session.room}</p>
                      )}
                    </div>

                    <span className="hidden h-13 w-px shrink-0 bg-line lg:block" aria-hidden />

                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center rounded-full bg-brand-200 px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-brand-800">
                        {session.track
                          ? `${session.track} · ${SESSION_TYPE_LABEL[session.type as SessionType]}`
                          : SESSION_TYPE_LABEL[session.type as SessionType]}
                      </span>

                      <h3 className="mt-2 text-balance text-[1.0625rem] font-semibold leading-[1.3] tracking-tight text-brand-950">
                        {session.title}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted lg:hidden">
                        {session.room && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {session.room}
                          </span>
                        )}
                        {session.speakers.length > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            {session.speakers.length} diễn giả
                          </span>
                        )}
                      </div>
                    </div>

                    {session.speakers.length > 0 && (
                      <div className="flex shrink-0 -space-x-2">
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
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-[0.625rem] font-bold text-brand-800 ring-2 ring-white">
                            +{session.speakers.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {hasDetail && (
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-control border border-line px-3.5 py-2 text-xs font-semibold text-brand-600 lg:inline-flex",
                        )}
                      >
                        {open ? "Thu gọn" : "Chi tiết"}
                      </span>
                    )}
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-line px-5 py-5 lg:px-[26px] lg:pl-[9.5rem]">
                        {session.description && (
                          <p className="text-pretty text-sm leading-relaxed text-ink-muted">
                            {session.description}
                          </p>
                        )}

                        {session.speakers.length > 0 && (
                          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                            {session.speakers.map((sp) => (
                              <li key={sp.id}>
                                <Link
                                  href={`/dien-gia/${sp.slug}`}
                                  className="flex items-center gap-3 rounded-card border border-line bg-brand-50 p-3 transition-[border-color,background-color] duration-300 hover:border-brand-300 hover:bg-white"
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
                                    <span className="block truncate text-sm font-semibold text-brand-950">
                                      {sp.name}
                                    </span>
                                    <span className="block truncate text-xs text-ink-muted">
                                      {[sp.title, sp.company].filter(Boolean).join(" · ")}
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
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
