import type { Partner, PartnerTier } from "@/lib/types";
import { PARTNER_TIER_LABEL, cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

const TIER_ORDER: PartnerTier[] = [
  "diamond", "platinum", "gold", "silver", "bronze", "partner", "media",
];

/**
 * Tile size by tier. Every tile keeps a 5:2 box so logos are scaled by the
 * same rule at every level, and the tier is expressed by how much room it
 * gets. Mobile is always two-up: at 350px of content width a "bigger" tier
 * cannot be bigger than the column.
 */
const TIER_TILE: Record<PartnerTier, string> = {
  diamond: "w-[calc(50%-0.5rem)] sm:h-24 sm:w-60 lg:h-28 lg:w-70",
  platinum: "w-[calc(50%-0.5rem)] sm:h-20 sm:w-50 lg:h-24 lg:w-60",
  gold: "w-[calc(50%-0.5rem)] sm:h-18 sm:w-44 lg:h-20 lg:w-50",
  silver: "w-[calc(50%-0.5rem)] sm:h-16 sm:w-40 lg:h-18 lg:w-44",
  bronze: "w-[calc(50%-0.5rem)] sm:h-16 sm:w-40 lg:h-18 lg:w-44",
  partner: "w-[calc(50%-0.5rem)] sm:h-16 sm:w-40 lg:h-18 lg:w-44",
  media: "w-[calc(50%-0.5rem)] sm:h-16 sm:w-40 lg:h-18 lg:w-44",
};

/**
 * Two presentations, because the two places this appears want different things.
 *
 * **Tiered** (`/doi-tac`): one hairline-separated band per tier, the tier name
 * in a fixed left column and the logos flowing left-to-right beside it. The
 * previous version centred wrapping tiles whose width changed per tier, which
 * with two or three partners in each of seven tiers stacked into a ragged
 * pyramid — every row a different width, centred on nothing.
 *
 * **Flat** (homepage): one even grid at a single tile size. Without tier
 * labels, tiles of seven different sizes read as accidental rather than as a
 * hierarchy, so the homepage gets uniformity and `/doi-tac` gets the ranking.
 */
export function PartnerWall({
  partners,
  showTierLabels = true,
}: {
  partners: Partner[];
  showTierLabels?: boolean;
}) {
  if (!partners?.length) return null;

  if (!showTierLabels) {
    const ordered = TIER_ORDER.flatMap((tier) => partners.filter((p) => p.tier === tier));
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {ordered.map((partner) => (
          <li key={partner.id} className="h-20 lg:h-24">
            <PartnerTile partner={partner} />
          </li>
        ))}
      </ul>
    );
  }

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: partners.filter((p) => p.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="divide-y divide-line">
      {grouped.map((group) => (
        <section
          key={group.tier}
          className="grid gap-4 py-7 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start lg:gap-10 lg:py-9"
        >
          <h3 className="text-eyebrow font-extrabold uppercase text-accent-700 lg:pt-3">
            {PARTNER_TIER_LABEL[group.tier]}
          </h3>

          <ul className="flex flex-wrap items-center gap-3 sm:gap-4">
            {group.items.map((partner) => (
              <li key={partner.id} className={cn("h-20", TIER_TILE[group.tier])}>
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
        quality={75}
        className="object-contain"
      />
    </div>
  );

  const shell =
    "group flex h-full items-center justify-center rounded-card border border-line bg-white p-4 " +
    "transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
    "hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card";

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
