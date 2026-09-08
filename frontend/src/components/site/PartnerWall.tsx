import Link from "next/link";
import type { Partner, PartnerTier } from "@/lib/types";
import { PARTNER_TIER_LABEL, cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { Reveal } from "@/components/ui/Reveal";

const TIER_ORDER: PartnerTier[] = [
  "diamond", "platinum", "gold", "silver", "bronze", "partner", "media",
];

/** Higher tiers get bigger tiles — the wall reads as a hierarchy at a glance. */
const TIER_TILE: Record<PartnerTier, string> = {
  diamond: "sm:col-span-2 lg:col-span-2 h-32 lg:h-40",
  platinum: "sm:col-span-2 lg:col-span-2 h-28 lg:h-32",
  gold: "h-24 lg:h-28",
  silver: "h-22 lg:h-24",
  bronze: "h-20 lg:h-22",
  partner: "h-20",
  media: "h-20",
};

const TIER_ACCENT: Record<PartnerTier, string> = {
  diamond: "from-cyan-glow/60 to-ocean-400/60",
  platinum: "from-ocean-300/60 to-ocean-200/60",
  gold: "from-gold/60 to-amber-200/60",
  silver: "from-slate-300/60 to-slate-200/60",
  bronze: "from-orange-300/50 to-orange-200/50",
  partner: "from-ocean-200/50 to-ocean-100/50",
  media: "from-ocean-200/50 to-ocean-100/50",
};

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
    <div className="space-y-12">
      {grouped.map((group, gi) => (
        <div key={group.tier}>
          {showTierLabels && (
            <Reveal className="mb-6 flex items-center gap-4">
              <span
                className={cn(
                  "h-px flex-1 bg-linear-to-r to-transparent",
                  TIER_ACCENT[group.tier],
                )}
              />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-ocean-950/45">
                {PARTNER_TIER_LABEL[group.tier]}
              </span>
              <span
                className={cn(
                  "h-px flex-1 bg-linear-to-l to-transparent",
                  TIER_ACCENT[group.tier],
                )}
              />
            </Reveal>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {group.items.map((partner, i) => {
              const Wrapper = partner.website ? "a" : "div";
              return (
                <Reveal key={partner.id} delay={Math.min(i * 60 + gi * 40, 400)}
                  className={cn(TIER_TILE[group.tier], "min-w-0")}>
                  <Wrapper
                    {...(partner.website
                      ? { href: partner.website, target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                    title={partner.name}
                    className="group relative flex h-full items-center justify-center overflow-hidden rounded-2xl border border-ocean-100 bg-white p-5 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-ocean-300 hover:shadow-[0_16px_36px_-18px_rgb(8_42_77/0.35)]"
                  >
                    <div className="relative h-full w-full">
                      <SafeImage
                        src={partner.logo}
                        alt={partner.name}
                        sizes="(max-width: 640px) 45vw, 200px"
                        className="object-contain opacity-70 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                      />
                    </div>
                  </Wrapper>
                </Reveal>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PartnerWallLink() {
  return (
    <Link
      href="/doi-tac"
      className="text-sm font-semibold text-ocean-700 underline-offset-4 hover:underline"
    >
      Xem tất cả đối tác
    </Link>
  );
}
