"use client";

import type { ReactNode } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LucideIcon } from "lucide-react";

export function AdminCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(12_43_41/0.04),0_12px_28px_-20px_rgb(12_43_41/0.25)]",
        padded && "p-5 lg:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-brand-200 bg-white pl-10 pr-9 text-sm text-brand-950 outline-hidden transition placeholder:text-brand-950/32 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xoá tìm kiếm"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-400 transition hover:bg-brand-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition duration-300",
            value === opt.value
              ? "bg-brand-950 text-white"
              : "bg-brand-50 text-brand-800 hover:bg-brand-100",
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={cn(
                "rounded px-1 text-[0.6875rem] tabular-nums",
                value === opt.value ? "bg-white/15" : "bg-white",
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** One place that decides between spinner, empty state and content. */
export function AsyncState({
  loading,
  error,
  empty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: string;
  empty: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid place-items-center rounded-2xl border border-brand-100 bg-white py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        <p className="mt-3 text-sm text-brand-950/45">Đang tải dữ liệu…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 h-10 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-[0_1px_2px_rgb(12_43_41/0.04),0_12px_28px_-20px_rgb(12_43_41/0.25)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-brand-100 bg-brand-50/60 px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-950/50",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-brand-50 px-4 py-3.5 align-middle", className)}>{children}</td>;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "neutral",
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg transition duration-300 disabled:opacity-40",
        tone === "danger"
          ? "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
          : "text-brand-500 hover:bg-brand-50 hover:text-brand-800",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function StatusPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className ?? "bg-brand-50 text-brand-700 ring-brand-200",
      )}
    >
      {children}
    </span>
  );
}
