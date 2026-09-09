import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Partner } from "@/lib/types";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * A logo band directly under the hero: the first credibility the visitor meets,
 * before the site makes any claim about itself.
 *
 * The label is set at body size with an accent rule under it, not as a 12px
 * eyebrow. At eyebrow size it lost to the logos beside it and read as a stray
 * caption — but this line is the one thing on the band that says what the logos
 * *are*, so it has to hold its own.
 *
 * Deliberately not the tiered wall from `/doi-tac`: one row, one logo size, no
 * tier labels, and only one link — through to the partner page — so nothing
 * here competes with the register CTA above it.
 */
export function PartnerStrip({ partners }: { partners: Partner[] }) {
  if (!partners?.length) return null;

  // Past about six the row wraps and stops reading as a band.
  const shown = partners.slice(0, 6);

  return (
    <section className="border-b border-line bg-white">
      <div className="container-page py-9 lg:py-11">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:gap-12">
          <div className="shrink-0 lg:w-52">
            <p className="text-base font-bold leading-snug tracking-[-0.01em] text-ink lg:text-lg">
              Đơn vị đồng hành
            </p>
            <span className="mt-2.5 block h-0.5 w-10 rounded-full bg-accent-500" aria-hidden />
            <Link
              href="/doi-tac"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-600 underline-offset-4 hover:text-accent-700 hover:underline lg:min-h-0"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ul className="grid flex-1 grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:flex lg:justify-between lg:gap-10">
            {shown.map((partner) => (
              <li
                key={partner.id}
                className="relative h-11 w-full lg:h-12 lg:w-auto lg:min-w-0 lg:flex-1"
              >
                <SafeImage
                  src={partner.logo}
                  alt={partner.name}
                  sizes="180px"
                  quality={75}
                  className="object-contain lg:object-left"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
