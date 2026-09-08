import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider ring-1 ring-inset",
        className ?? "bg-ocean-50 text-ocean-700 ring-ocean-200",
      )}
    >
      {children}
    </span>
  );
}
