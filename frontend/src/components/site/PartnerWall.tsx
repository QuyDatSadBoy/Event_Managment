import type { Partner, PartnerTier } from "@/lib/types";
import { PARTNER_TIER_LABEL, cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

const TIER_ORDER: PartnerTier[] = [
  "diamond", "platinum", "gold", "silver", "bronze", "partner", "media",
];

/**
 * Logo tile width by tier — higher tiers get more room, so the wall reads as a
 * hierarchy without needing a label on every logo.
 */
const TIER_TILE: Record<PartnerTier, string> = {
  diamond: "w-[calc(50%-0.5rem)] sm:w-[280px] h-28 lg:h-32",
  platinum: "w-[calc(50%-0.5rem)] sm:w-[240px] h-24 lg:h-28",
  gold: "w-[calc(50%-0.5rem)] sm:w-[196px] h-20 lg:h-24",
  silver: "w-[calc(50%-0.5rem)] sm:w-[172px] h-20",
  bronze: "w-[calc(50%-0.5rem)] sm:w-[156px] h-[72px]",
  partner: "w-[calc(50%-0.5rem)] sm:w-[156px] h-[72px]",
  media: "w-[calc(50%-0.5rem)] sm:w-[156px] h-[72px]",
};

/**
 * Tiles are laid out with wrapping flex rather than a fixed column grid.
 *
 * A grid gives every tier the same column count, so a tier with fewer logos
 * than columns — two platinum in a six-column grid — leaves its row hanging off
 * to the left. Wrapping flex with `justify-center` centres whatever a row
 * actually holds, which is what the wall needs when tier sizes differ.
 */
export function PartnerWall({
  partners,
  showTierLabels = true,
}: {
  partners: Partner[];
  showTierLabels?: boolean;
}) {
  if (!partners?.length) return null;

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: partners.filter((p) => p.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {grouped.map((group) => (
        <section key={group.tier}>
          {showTierLabels && (
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px flex-1 bg-line" aria-hidden />
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-ink-muted">
                {PARTNER_TIER_LABEL[group.tier]}
              </h2>
              <span className="h-px flex-1 bg-line" aria-hidden />
            </div>
          )}

          <ul className="flex flex-wrap items-stretch justify-center gap-4">
            {group.items.map((partner) => (
              <li key={partner.id} className={cn("min-w-0", TIER_TILE[group.tier])}>
                <PartnerTile partner={partner} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PartnerTile({ partner }: { partner: Partner }) {
  const inner = (
    <div className="relative h-full w-full">
      <SafeImage
        src={partner.logo}
        alt={partner.name}
        sizes="280px"
        quality={65}
        className="object-contain"
      />
    </div>
  );

  const shell =
    "group flex h-full items-center justify-center rounded-card border border-line bg-white p-4 " +
    "transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
    "hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card";

  if (partner.website) {
    return (
      <a
        href={partner.website}
        target="_blank"
        rel="noreferrer noopener"
        title={partner.name}
        className={shell}
      >
        {inner}
      </a>
    );
  }
  return (
    <div title={partner.name} className={shell}>
      {inner}
    </div>
  );
}
