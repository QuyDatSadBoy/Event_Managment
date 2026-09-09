import type { AgendaDay } from "@/lib/types";
import { formatDate, formatWeekday } from "@/lib/utils";
import { AgendaRow } from "./AgendaRow";

/** The first day's opening sessions, as a taste of the full programme. */
export function AgendaPreview({ days }: { days: AgendaDay[] }) {
  const day = days?.[0];
  if (!day || day.sessions.length === 0) return null;

  return (
    <div className="mt-9">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-card font-semibold tracking-tight text-brand-950">
          {day.label}
          {day.title && <span className="text-ink-muted"> · {day.title}</span>}
        </h3>
        <p className="text-caption text-ink-muted">
          {formatWeekday(day.date)}, {formatDate(day.date)}
        </p>
      </div>

      <ol className="space-y-3">
        {day.sessions.slice(0, 5).map((session) => (
          <li key={session.id}>
            <AgendaRow session={session} />
          </li>
        ))}
      </ol>
    </div>
  );
}
