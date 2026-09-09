import type { StatItem } from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

/**
 * Event scale as an editorial composition, not a row of KPI tiles.
 *
 * Four identically-sized boxes give every figure the same weight, which is a
 * dashboard's job — it has no opinion about which number matters. Here the
 * first stat is set large against a photograph of the room and the rest sit
 * under it as supporting evidence. The hierarchy is the design.
 *
 * Only figures already present in settings are rendered — no placeholder, no
 * invented number — so the composition has to survive one stat as readily as
 * five.
 *
 * Each figure is a `dt`/`dd` pair in that order, laid out with
 * `flex-col-reverse` so the number reads above its label without putting the
 * description list in the wrong order for a screen reader.
 */
export function StatsBand({
  stats,
  image,
  imageAlt,
}: {
  stats: StatItem[];
  /** Optional photograph of the event; the composition drops to type-only without it. */
  image?: string;
  imageAlt?: string;
}) {
  if (!stats?.length) return null;

  const [lead, ...rest] = stats;
  const withPhoto = Boolean(image);

  return (
    <div
      className={cn(
        "grid items-stretch gap-8 lg:gap-12",
        withPhoto && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
      )}
    >
      {withPhoto && (
        <div className="relative aspect-4/3 overflow-hidden rounded-panel shadow-panel lg:aspect-auto lg:min-h-[22rem]">
          <SafeImage
            src={image}
            alt={imageAlt ?? ""}
            sizes="(max-width: 1024px) 92vw, 40vw"
            quality={72}
          />
        </div>
      )}

      <dl className="flex flex-col justify-center">
        {/* Lead figure — oversized and alone, so the eye lands here first. */}
        <div className="flex flex-col-reverse">
          <dt className="mt-3 max-w-[28ch] text-pretty text-lg font-semibold leading-snug text-brand-700">
            {lead.label}
          </dt>
          <dd className="text-[clamp(3.5rem,2.2rem+4.5vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.045em] tabular-nums text-ink">
            <CountUp value={lead.value} suffix={lead.suffix ?? ""} />
          </dd>
        </div>

        {rest.length > 0 && (
          <>
            <span className="mt-8 h-0.5 w-16 rounded-full bg-accent-500" aria-hidden />
            <div
              className={cn(
                "mt-8 grid gap-x-8 gap-y-7",
                rest.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3",
              )}
            >
              {rest.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="mt-2 text-sm leading-snug text-ink-muted">{stat.label}</dt>
                  <dd className="text-[clamp(1.75rem,1.3rem+1.4vw,2.25rem)] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-brand-700">
                    <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
                  </dd>
                </div>
              ))}
            </div>
          </>
        )}
      </dl>
    </div>
  );
}
