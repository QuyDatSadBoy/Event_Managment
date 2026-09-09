import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Speaker } from "@/lib/types";
import { initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * A speaker as a portrait, not a row in a directory.
 *
 * The previous card boxed a square thumbnail inside a bordered white panel,
 * which gave the border and the padding as much presence as the person. Here
 * the photograph is a 4:5 portrait carrying the card's whole width, and the
 * text sits under it with no box at all — the image is the card.
 *
 * The arrow only appears on hover and is decorative: the whole card is already
 * one link via the pseudo-element on the name, so there is nothing extra for a
 * keyboard or a screen reader to step through.
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
    <article className="group relative">
      <div className="relative aspect-4/5 overflow-hidden rounded-panel bg-ph-bg">
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
          <SafeImage
            src={speaker.photo}
            alt={speaker.name}
            fallbackLabel={initials(speaker.name)}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
            quality={72}
          />
        </div>

        {/* A short scrim at the foot of the portrait, so the badge and the
            arrow stay legible over whatever the photograph happens to be. */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-950/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />

        {speaker.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-accent-500 px-2.5 py-1 text-[0.625rem] font-bold uppercase leading-none tracking-wider text-ink">
            Nổi bật
          </span>
        )}

        <span
          className="absolute bottom-4 right-4 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-accent-500 text-ink opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <Heading className="text-card font-bold leading-[1.25] tracking-[-0.02em] text-ink">
          <Link
            href={`/dien-gia/${speaker.slug}`}
            className="before:absolute before:inset-0 before:content-['']"
          >
            {speaker.name}
          </Link>
        </Heading>
        {speaker.title && (
          <p className="line-clamp-2 text-sm leading-snug text-ink-muted">{speaker.title}</p>
        )}
        {speaker.company && (
          <p className="line-clamp-1 text-caption font-semibold leading-snug text-brand-600">
            {speaker.company}
          </p>
        )}
      </div>
    </article>
  );
}
