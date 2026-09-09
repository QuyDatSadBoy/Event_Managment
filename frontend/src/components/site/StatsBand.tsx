import type { StatItem } from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";

/**
 * The numbers are the visual — no icon, no card per figure. Four stacked cards
 * cost roughly 700px of scroll on a phone to deliver four short facts; a
 * two-column grid of hairline-separated cells says the same thing in a quarter
 * of the space and reads as one object rather than four.
 */
export function StatsBand({ stats }: { stats: StatItem[] }) {
  if (!stats?.length) return null;

  return (
    <section className="relative z-10 -mt-10 sm:-mt-14">
      <div className="container-page">
        <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-ocean-100 bg-white/95 shadow-[0_24px_60px_-30px_rgb(8_42_77/0.45)] backdrop-blur-xl lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                "px-4 py-6 text-center sm:px-6 sm:py-7",
                // Hairlines between cells, never around the outside.
                i % 2 === 1 ? "border-l border-ocean-100" : "",
                i >= 2 ? "border-t border-ocean-100" : "",
                "lg:border-t-0",
                i > 0 ? "lg:border-l lg:border-ocean-100" : "lg:border-l-0",
              ].join(" ")}
            >
              <dd className="text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-ocean-800">
                <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
              </dd>
              <dt className="mt-2 text-[0.8125rem] font-medium leading-snug text-ocean-950/55 sm:text-sm">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
