import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import type { AgendaDay } from "@/lib/types";
import { SESSION_TYPE_LABEL, SESSION_TYPE_STYLE, cn, formatDate, initials } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { SafeImage } from "@/components/ui/SafeImage";

export function AgendaPreview({ days }: { days: AgendaDay[] }) {
  const day = days?.[0];
  if (!day || day.sessions.length === 0) return null;

  return (
    <div className="mt-14">
      <Reveal className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-ocean-600">
            {day.label}
          </span>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-ocean-950">
            {day.title || formatDate(day.date)}
          </h3>
        </div>
        <span className="text-sm text-ocean-950/50">{formatDate(day.date)}</span>
      </Reveal>

      <ol className="relative space-y-3 before:absolute before:left-[5.75rem] before:top-3 before:bottom-3 before:hidden before:w-px before:bg-ocean-100 lg:before:block">
        {day.sessions.map((session, i) => (
          <Reveal key={session.id} delay={i * 60} as="li">
            <div className="group relative flex flex-col gap-4 rounded-2xl border border-ocean-100 bg-white p-5 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ocean-300 hover:shadow-[0_16px_36px_-20px_rgb(8_42_77/0.35)] lg:flex-row lg:items-center lg:gap-7 lg:p-6">
              <div className="flex shrink-0 items-center gap-3 lg:w-24 lg:flex-col lg:items-start lg:gap-1">
                <span className="font-mono text-lg font-bold tabular-nums text-ocean-800">
                  {session.start_time}
                </span>
                {session.end_time && (
                  <span className="font-mono text-xs tabular-nums text-ocean-950/40">
                    {session.end_time}
                  </span>
                )}
              </div>

              {/* Timeline node, aligned to the rail drawn on the list. */}
              <span
                className="absolute left-[5.75rem] hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-ocean-300 ring-4 ring-white transition-colors duration-300 group-hover:bg-cyan-glow lg:block"
                aria-hidden
              />

              <div className="min-w-0 flex-1 lg:pl-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ring-1 ring-inset",
                      SESSION_TYPE_STYLE[session.type],
                    )}
                  >
                    {SESSION_TYPE_LABEL[session.type]}
                  </span>
                  {session.track && (
                    <span className="text-[0.6875rem] font-medium text-ocean-950/45">
                      {session.track}
                    </span>
                  )}
                </div>

                <h4 className="mt-2 text-balance text-base font-bold leading-snug tracking-tight text-ocean-950 lg:text-lg">
                  {session.title}
                </h4>

                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ocean-950/50">
                  {session.room && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {session.room}
                    </span>
                  )}
                  {session.end_time && (
                    <span className="inline-flex items-center gap-1.5 lg:hidden">
                      <Clock className="h-3.5 w-3.5" />
                      {session.start_time} – {session.end_time}
                    </span>
                  )}
                </div>
              </div>

              {session.speakers?.length > 0 && (
                <div className="flex shrink-0 -space-x-2.5">
                  {session.speakers.slice(0, 4).map((speaker) => (
                    <span
                      key={speaker.id}
                      title={speaker.name}
                      className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white"
                    >
                      <SafeImage
                        src={speaker.photo}
                        alt={speaker.name}
                        fallbackLabel={initials(speaker.name)}
                        sizes="36px"
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-9 text-center">
        <Link
          href="/chuong-trinh"
          className="inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-white px-6 py-3 text-sm font-semibold text-ocean-800 transition duration-300 hover:border-ocean-400 hover:bg-ocean-50"
        >
          Xem toàn bộ chương trình
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  );
}
