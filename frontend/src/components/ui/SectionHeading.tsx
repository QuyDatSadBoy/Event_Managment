import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  /** Renders as h1 on pages where this is the page's own title. */
  as?: "h2" | "h3";
};

/**
 * A section title carries its own weight. There is deliberately no eyebrow or
 * kicker above it — a small label announcing what the heading is about to say
 * adds a line to read and takes emphasis away from the heading itself.
 */
export function SectionHeading({
  title,
  description,
  align = "center",
  tone = "light",
  className,
  as: Tag = "h2",
}: Props) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <Tag
        className={cn(
          "text-balance text-[clamp(1.75rem,1.2rem+2.2vw,2.875rem)] font-extrabold leading-[1.08] tracking-[-0.035em]",
          dark ? "text-white" : "text-ocean-950",
        )}
      >
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            "mt-4 text-pretty text-[0.9375rem] leading-relaxed sm:text-lg",
            dark ? "text-ocean-100/75" : "text-ocean-950/62",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
