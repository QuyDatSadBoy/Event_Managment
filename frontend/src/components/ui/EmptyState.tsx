import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-500 shadow-sm ring-1 ring-brand-100">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
