import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** design.pen sets a tracked label above every section title. */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  /** Renders the "View all" control on the right of the heading row. */
  action?: { href: string; label: string };
  className?: string;
  as?: "h2" | "h3";
};

/**
 * design.pen "Section Heading": a two-line stack (eyebrow 12/700 tracked 1.8 in
 * brand-primary, then the title at 34/700) with an optional bordered "View all"
 * button pushed to the far end of the row.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  action,
  className,
  as: Tag = "h2",
}: Props) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        align === "center" && "sm:flex-col sm:items-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center text-center")}>
        {eyebrow && (
          <p
            className={cn(
              "text-xs font-bold uppercase leading-none tracking-[0.15em]",
              dark ? "text-brand-200" : "text-brand-600",
            )}
          >
            {eyebrow}
          </p>
        )}
        <Tag
          className={cn(
            "text-balance text-[clamp(1.5rem,1.1rem+1.6vw,2.125rem)] font-bold leading-[1.2] tracking-[-0.02em]",
            dark ? "text-white" : "text-brand-950",
          )}
        >
          {title}
        </Tag>
        {description && (
          <p
            className={cn(
              "mt-1 max-w-[58ch] text-pretty leading-relaxed",
              dark ? "text-brand-200" : "text-ink-muted",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-control border px-4 text-sm font-semibold",
            "transition-[background-color,border-color,color] duration-300",
            dark
              ? "border-white/25 text-white hover:bg-white/10"
              : "border-line text-brand-600 hover:border-brand-400 hover:bg-brand-50",
          )}
        >
          {action.label}
          <ArrowRight className="h-[15px] w-[15px]" />
        </Link>
      )}
    </div>
  );
}
