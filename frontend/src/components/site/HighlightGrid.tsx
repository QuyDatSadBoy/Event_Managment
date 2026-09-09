import {
  Presentation, Handshake, Sparkles, Award, Lightbulb, type LucideIcon,
} from "lucide-react";
import type { Highlight } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  presentation: Presentation,
  handshake: Handshake,
  sparkles: Sparkles,
  award: Award,
};

/**
 * A hairline-separated list rather than four identical boxes. On a phone the
 * card version costs about a thousand pixels of scroll for four short
 * statements; this says the same thing in a third of the space and keeps the
 * weight on the titles.
 */
export function HighlightGrid({ highlights }: { highlights: Highlight[] }) {
  if (!highlights?.length) return null;

  return (
    <ul className="grid gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
      {highlights.map((item) => {
        const Icon = ICONS[item.icon ?? ""] ?? Lightbulb;
        return (
          <li key={item.title} className="group relative bg-white p-6 lg:p-7">
            <span
              className="absolute left-0 top-6 h-8 w-0.5 bg-brand-400 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-[calc(100%-3rem)] lg:top-7"
              aria-hidden
            />
            <h3 className="flex items-center gap-2.5 text-card font-semibold leading-[1.3] tracking-tight text-brand-950">
              <Icon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
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
