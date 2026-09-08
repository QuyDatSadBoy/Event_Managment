import {
  Presentation, Handshake, Sparkles, Award, Lightbulb, type LucideIcon,
} from "lucide-react";
import type { Highlight } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";

const ICONS: Record<string, LucideIcon> = {
  presentation: Presentation,
  handshake: Handshake,
  sparkles: Sparkles,
  award: Award,
};

export function HighlightGrid({ highlights }: { highlights: Highlight[] }) {
  if (!highlights?.length) return null;

  return (
    <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {highlights.map((item, i) => {
        const Icon = ICONS[item.icon ?? ""] ?? Lightbulb;
        return (
          <Reveal key={item.title} delay={i * 90}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-ocean-100 bg-white p-7 card-hover">
              {/* Accent wash that fades in on hover, behind the content. */}
              <div
                className="absolute inset-0 bg-linear-135 from-ocean-50 to-cyan-glow/8 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative">
                <span className="grid h-13 w-13 place-items-center rounded-2xl bg-linear-135 from-ocean-600 to-cyan-glow text-white shadow-[0_10px_24px_-10px_rgb(6_120_214/0.8)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-ocean-950">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-pretty text-sm leading-relaxed text-ocean-950/60">
                  {item.description}
                </p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
