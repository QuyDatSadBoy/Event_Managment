import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { AgendaSession } from "@/lib/types";
import { SESSION_TYPE_LABEL, cn, initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * design.pen "Agenda Row" (desktop) and "Agenda Card Mobile".
 *
 * Desktop is one horizontal row: a fixed 120px time block in Roboto Mono, a
 * hairline divider, then the session. Mobile drops the divider and stacks,
 * because a 120px column plus a title does not fit 350px of content width.
 */
export function AgendaRow({
  session,
  className,
}: {
  session: AgendaSession;
  className?: string;
}) {
  const time = session.end_time
    ? `${session.start_time} – ${session.end_time}`
    : session.start_time;

  return (
    <article
      className={cn(
        "rounded-row border border-line bg-white p-5 lg:px-[26px] lg:py-[22px]",
        "transition-[border-color,box-shadow] duration-300 hover:border-brand-300 hover:shadow-card",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div className="shrink-0 lg:w-[120px]">
          <p className="font-mono text-sm font-bold leading-tight text-brand-800">{time}</p>
          {session.room && <p className="mt-0.5 text-xs text-ink-muted">{session.room}</p>}
        </div>

        <span className="hidden h-13 w-px shrink-0 bg-line lg:block" aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-200 px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-brand-800">
              {session.track
                ? `${session.track} · ${SESSION_TYPE_LABEL[session.type]}`
                : SESSION_TYPE_LABEL[session.type]}
            </span>
          </div>

          <h4 className="mt-2 text-balance text-[1.0625rem] font-semibold leading-[1.3] tracking-tight text-brand-950">
            {session.title}
          </h4>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted lg:hidden">
            {session.room && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {session.room}
              </span>
            )}
            {session.speakers?.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {session.speakers.length} diễn giả
              </span>
            )}
          </div>
        </div>

        {session.speakers?.length > 0 && (
          <ul className="flex shrink-0 -space-x-2">
            {session.speakers.slice(0, 4).map((sp) => (
              <li key={sp.id}>
                <Link
                  href={`/dien-gia/${sp.slug}`}
                  title={sp.name}
                  className="relative block h-9 w-9 overflow-hidden rounded-full ring-2 ring-white"
                >
                  <SafeImage
                    src={sp.photo}
                    alt={sp.name}
                    fallbackLabel={initials(sp.name)}
                    sizes="36px"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
