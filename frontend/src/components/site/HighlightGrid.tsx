import {
  Presentation, Handshake, Sparkles, Award, Lightbulb, type LucideIcon,
} from "lucide-react";
import type { Highlight } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  presentation: Presentation,
  handshake: Handshake,
  sparkles: Sparkles,
  award: Award,
};

/**
 * The reference's signature block: large soft-tinted panels carrying a faint
 * hexagon field, alternating between the cool surface and the warm one so a row
 * of them has a rhythm instead of reading as four identical boxes.
 *
 * The tint alternates on a diagonal (index 0 and 3 cool, 1 and 2 warm) so a
 * two-column grid never puts the same colour side by side or directly above
 * itself. Both tints are light enough that ink sits at 13.6:1 or better on
 * them, so the watermark can stay purely decorative.
 */
export function HighlightGrid({ highlights }: { highlights: Highlight[] }) {
  if (!highlights?.length) return null;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:gap-6">
      {highlights.map((item, i) => {
        const Icon = ICONS[item.icon ?? ""] ?? Lightbulb;
        const warm = i % 4 === 1 || i % 4 === 2;
        return (
          <li
            key={item.title}
            className={cn(
              "group relative isolate overflow-hidden rounded-panel p-6 lg:p-8",
              warm ? "bg-peach" : "bg-surface",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 -z-10 opacity-70",
                warm ? "hex-field-warm" : "hex-field",
              )}
              aria-hidden
            />

            <span
              className={cn(
                "grid h-11 w-11 place-items-center rounded-control transition-transform duration-500 group-hover:scale-110",
                warm ? "bg-accent-500 text-ink" : "bg-brand-900 text-white",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>

            <h3 className="mt-5 text-card font-bold leading-[1.3] tracking-[-0.015em] text-ink">
              {item.title}
            </h3>
            <p className="mt-2 max-w-[46ch] text-pretty text-sm leading-relaxed text-ink-muted">
              {item.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
