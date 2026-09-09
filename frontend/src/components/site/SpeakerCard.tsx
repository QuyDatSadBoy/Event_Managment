import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Speaker } from "@/lib/types";
import { initials } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

export function SpeakerCard({
  speaker,
  headingLevel: Heading = "h3",
}: {
  speaker: Speaker;
  /** h2 on the speakers index, h3 under a section heading elsewhere. */
  headingLevel?: "h2" | "h3";
}) {
  return (
    <Link
      href={`/dien-gia/${speaker.slug}`}
      className="group relative block overflow-hidden rounded-3xl bg-ocean-950 card-hover"
    >
      <div className="relative aspect-4/5 overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108">
          <SafeImage
            src={speaker.photo}
            alt={speaker.name}
            fallbackLabel={initials(speaker.name)}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
            quality={68}
          />
        </div>

        <div
          className="absolute inset-0 bg-linear-to-t from-abyss via-abyss/70 to-transparent transition-opacity duration-500"
          aria-hidden
        />

        {speaker.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-cyan-glow/95 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-abyss">
            Nổi bật
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5">
          {speaker.country && (
            <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-cyan-soft">
              {speaker.country}
            </p>
          )}
          <Heading className="text-lg font-bold leading-tight tracking-tight text-white">
            {speaker.name}
          </Heading>
          {speaker.title && (
            <p className="mt-1 line-clamp-1 text-sm text-ocean-100/90">{speaker.title}</p>
          )}
          {speaker.company && (
            <p className="line-clamp-1 text-sm font-medium text-ocean-100/75">{speaker.company}</p>
          )}

          {/* Topics slide in on hover; hidden from the flow until then so the
              card height never shifts. */}
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 pt-3">
                {speaker.topics?.slice(0, 2).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-white/12 px-2.5 py-1 text-[0.6875rem] font-medium text-ocean-100 ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <span className="absolute right-4 top-4 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white/15 text-white opacity-0 ring-1 ring-white/20 backdrop-blur-md transition-[transform,opacity] duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
