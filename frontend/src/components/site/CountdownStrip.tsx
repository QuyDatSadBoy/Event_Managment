import { CalendarDays, MapPin } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { Countdown } from "@/components/ui/Countdown";
import { DecoDotGrid } from "@/components/ui/Deco";

/**
 * design.pen D1/M1: the countdown strip sits directly under the hero on the
 * same brand-primary-dark ground, so the hero's bottom-right cut exposes it.
 */
export function CountdownStrip({ settings }: { settings: Settings }) {
  if (!settings.start_date) return null;

  return (
    <section className="relative overflow-hidden bg-brand-800">
      <DecoDotGrid tone="dark" className="-left-8 bottom-0 hidden w-[397px] opacity-60 lg:block" />

      <div className="container-page relative flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-200">
            Sự kiện khai mạc sau
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-brand-200">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent-500" aria-hidden />
              {formatDateRange(settings.start_date, settings.end_date)}
            </span>
            {settings.venue_name && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent-500" aria-hidden />
                {settings.venue_name}
              </span>
            )}
          </p>
        </div>

        <Countdown target={settings.start_date} />
      </div>
    </section>
  );
}
