import { Users, Mic, Building2, Globe, Sparkles, type LucideIcon } from "lucide-react";
import type { StatItem } from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  mic: Mic,
  building: Building2,
  globe: Globe,
};

export function StatsBand({ stats }: { stats: StatItem[] }) {
  if (!stats?.length) return null;

  return (
    <section className="relative -mt-16 z-10">
      <div className="container-page">
        <Reveal className="overflow-hidden rounded-[1.75rem] border border-ocean-100 bg-white/95 shadow-[0_24px_60px_-28px_rgb(8_42_77/0.4)] backdrop-blur-xl">
          <dl className="grid divide-y divide-ocean-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 sm:[&>div:nth-child(-n+2)]:border-b sm:[&>div:nth-child(-n+2)]:border-ocean-100 lg:[&>div]:border-b-0 [&>div+div]:sm:border-l [&>div+div]:sm:border-ocean-100 lg:[&>div:nth-child(3)]:border-l">
            {stats.map((stat) => {
              const Icon = ICONS[stat.icon ?? ""] ?? Sparkles;
              return (
                <div key={stat.label} className="group px-6 py-8 text-center lg:px-8 lg:py-9">
                  <Icon className="mx-auto h-6 w-6 text-ocean-400 transition-colors duration-300 group-hover:text-cyan-glow" />
                  <dd className="mt-4 text-3xl font-extrabold tracking-tight text-ocean-950 lg:text-4xl">
                    <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
                  </dd>
                  <dt className="mt-2 text-sm font-medium text-ocean-950/55">{stat.label}</dt>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
