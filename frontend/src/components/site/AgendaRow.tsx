import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { AgendaSession } from "@/lib/types";
import { SESSION_TYPE_LABEL, cn, initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * One session on an editorial timeline: time in a fixed left column, a node on
 * a vertical rail, then the session itself.
 *
 * The rail is drawn once by the list (see `AgendaTimeline` below) rather than
 * by each row, so it is continuous instead of a stack of abutting segments.
 * The row only contributes its node, offset half its own width so it sits
 * centred on the rail.
 *
 * Rows are hairline-separated rather than boxed. A day of eight bordered cards
 * reads as eight unrelated things; the point of a schedule is that it is one
 * sequence.
 */
export function AgendaRow({
  session,
  className,
}: {
  session: AgendaSession;
  className?: string;
}) {
  const keynote = session.type === "keynote";

  return (
    <article
      className={cn(
        "group grid gap-y-2.5 border-b border-line pb-5",
        "lg:grid-cols-[5.5rem_1.5rem_minmax(0,1fr)] lg:items-start lg:gap-y-0 lg:border-0 lg:pb-0",
        className,
      )}
    >
      {/* Time. Start and end stack on desktop so the column stays narrow. */}
      <div className="lg:pt-0.5">
        <p className="font-mono text-sm font-bold leading-tight tabular-nums text-brand-800">
          {session.start_time}
        </p>
        {session.end_time && (
          <p className="font-mono text-xs leading-tight tabular-nums text-ink-muted lg:mt-0.5">
            {session.end_time}
          </p>
        )}
      </div>

      {/* Node on the rail. Keynotes take the accent; everything else stays navy
          so the accent still means "the one to notice". */}
      <div className="hidden lg:flex lg:pt-1.5" aria-hidden>
        <span
          className={cn(
            "h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-white",
            keynote ? "bg-accent-500" : "bg-brand-400",
          )}
        />
      </div>

      <div className="min-w-0 lg:pb-9">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-[0.6875rem] font-bold leading-none text-brand-700">
          {session.track
            ? `${session.track} · ${SESSION_TYPE_LABEL[session.type]}`
            : SESSION_TYPE_LABEL[session.type]}
        </span>

        <h4
          className={cn(
            "mt-2.5 text-balance leading-[1.3] tracking-[-0.015em] text-ink",
            keynote ? "text-card font-bold" : "text-[1.0625rem] font-semibold",
          )}
        >
          {session.title}
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted">
          {session.room && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {session.room}
            </span>
          )}
          {session.speakers?.length > 0 && (
            <span className="inline-flex items-center gap-1.5 lg:hidden">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {session.speakers.length} diễn giả
            </span>
          )}
        </div>

        {session.speakers?.length > 0 && (
          <ul className="mt-3 hidden flex-wrap items-center gap-x-4 gap-y-2 lg:flex">
            {session.speakers.slice(0, 3).map((sp) => (
              <li key={sp.id}>
                <Link
                  href={`/dien-gia/${sp.slug}`}
                  className="group/sp inline-flex items-center gap-2.5"
                >
                  <span className="relative block h-8 w-8 overflow-hidden rounded-full ring-1 ring-line">
                    <SafeImage
                      src={sp.photo}
                      alt=""
                      fallbackLabel={initials(sp.name)}
                      sizes="32px"
                    />
                  </span>
                  <span className="text-xs font-semibold text-brand-700 underline-offset-2 group-hover/sp:underline">
                    {sp.name}
                  </span>
                </Link>
              </li>
            ))}
            {session.speakers.length > 3 && (
              <li className="text-xs text-ink-muted">
                +{session.speakers.length - 3} diễn giả
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

/**
 * The list that owns the rail. Anything rendering a run of `AgendaRow` should
 * go through this so the line and the nodes line up.
 */
export function AgendaTimeline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ol className={cn("relative space-y-5 lg:space-y-0", className)}>
      {/* The rail. Inset top and bottom so it does not dangle past the first
          and last node. */}
      <span
        className="absolute left-[5.5rem] top-3 bottom-3 hidden w-px bg-line lg:block"
        aria-hidden
      />
      {children}
    </ol>
  );
}
