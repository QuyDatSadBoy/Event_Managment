import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className,
}: Props) {
  const dark = tone === "dark";
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ring-1",
            dark
              ? "bg-white/10 text-ocean-100 ring-white/20"
              : "bg-ocean-50 text-ocean-700 ring-ocean-100",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-cyan-glow" : "bg-ocean-500")} />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "mt-4 text-balance text-3xl font-bold leading-[1.15] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]",
          dark ? "text-white" : "text-ocean-950",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-pretty text-base leading-relaxed sm:text-lg",
            dark ? "text-ocean-100/80" : "text-ocean-950/65",
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
