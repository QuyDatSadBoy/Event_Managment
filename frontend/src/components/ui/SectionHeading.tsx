import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Button";

type Props = {
  /** The tracked orange label above every section title. */
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
 * The section entry point: an orange eyebrow over a heavy, tightly-tracked
 * title, with an optional "View all" control at the far end of the row.
 *
 * The eyebrow is what gives each section a point of entry for the eye. Without
 * it a long page of cards reads as one undifferentiated run, which is the
 * failure mode the redesign is correcting.
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
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        <Tag
          className={cn(
            "text-balance text-[clamp(1.625rem,1.15rem+1.9vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em]",
            dark ? "text-white" : "text-ink",
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
              : "border-brand-400 text-brand-700 hover:border-accent-500 hover:bg-accent-50",
          )}
        >
          {action.label}
          <ArrowRight className="h-[15px] w-[15px]" />
        </Link>
      )}
    </div>
  );
}
