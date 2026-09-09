import Link from "next/link";
import type { Speaker } from "@/lib/types";
import { initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * design.pen "Speaker Card": a white card, radius 12, 1px border, with a square
 * portrait above the text — not a dark photo with the name burned over it. The
 * body is name 17/700, role 14/400 muted, organisation 13/600 in brand-primary.
 */
export function SpeakerCard({
  speaker,
  headingLevel: Heading = "h3",
}: {
  speaker: Speaker;
  /** h2 on the speakers index, h3 under a section heading elsewhere. */
  headingLevel?: "h2" | "h3";
}) {
  return (
    <article className="group relative overflow-hidden rounded-card border border-line bg-white card-hover">
      <div className="relative aspect-square overflow-hidden bg-ph-bg">
        <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <SafeImage
            src={speaker.photo}
            alt={speaker.name}
            fallbackLabel={initials(speaker.name)}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
            quality={68}
          />
        </div>
        {speaker.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-cream px-2.5 py-1 text-[0.625rem] font-bold uppercase leading-none tracking-wider text-brand-800">
            Nổi bật
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-5 pb-5 pt-[18px]">
        <Heading className="text-[1.0625rem] font-bold leading-[1.3] tracking-tight text-brand-950">
          <Link
            href={`/dien-gia/${speaker.slug}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {speaker.name}
          </Link>
        </Heading>
        {speaker.title && (
          <p className="line-clamp-2 text-sm leading-[1.45] text-ink-muted">{speaker.title}</p>
        )}
        {speaker.company && (
          <p className="line-clamp-1 text-caption font-semibold leading-[1.45] text-brand-600">
            {speaker.company}
          </p>
        )}
      </div>
    </article>
  );
}
