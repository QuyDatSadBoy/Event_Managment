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
 * An editorial list, not a card grid. Four identical icon-heading-text cards is
 * the default container for "here are our four things" and says nothing; a
 * hairline-separated list puts the weight on the titles, reads in one column on
 * a phone without four boxes of chrome, and lets the ocean rule on the left
 * carry the only decoration.
 */
export function HighlightGrid({ highlights }: { highlights: Highlight[] }) {
  if (!highlights?.length) return null;

  return (
    <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-ocean-100 sm:grid-cols-2">
      {highlights.map((item) => {
        const Icon = ICONS[item.icon ?? ""] ?? Lightbulb;
        return (
          <li key={item.title} className="group relative bg-white p-6 sm:p-7 lg:p-8">
            <span
              className="absolute left-0 top-6 h-8 w-px bg-ocean-400 transition-[height,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-[calc(100%-3rem)] group-hover:bg-cyan-glow sm:top-7 lg:top-8"
              aria-hidden
            />
            <h3 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ocean-950">
              <Icon className="h-5 w-5 shrink-0 text-ocean-500" aria-hidden />
              {item.title}
            </h3>
            <p className="mt-2.5 max-w-[46ch] text-pretty text-[0.9375rem] leading-relaxed text-ocean-950/62">
              {item.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
