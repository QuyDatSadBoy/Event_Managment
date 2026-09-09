import type { StatItem } from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";

/**
 * design.pen D1 "About + stats": the figures sit as one bordered strip beside
 * the about copy, not as a card each. Two columns on a phone rather than four
 * stacked rows — four rows costs most of a screen to deliver four short facts.
 */
export function StatsBand({ stats }: { stats: StatItem[] }) {
  if (!stats?.length) return null;

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-card border border-line bg-white lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={[
            "px-5 py-6 text-center lg:px-6 lg:py-7",
            i % 2 === 1 ? "border-l border-line" : "",
            i >= 2 ? "border-t border-line" : "",
            "lg:border-t-0",
            i > 0 ? "lg:border-l lg:border-line" : "lg:border-l-0",
          ].join(" ")}
        >
          <dd className="text-[clamp(1.625rem,1.2rem+1.6vw,2.25rem)] font-bold leading-none tracking-[-0.02em] tabular-nums text-brand-600">
            <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
          </dd>
          <dt className="mt-2 text-caption font-medium leading-snug text-ink-muted">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
