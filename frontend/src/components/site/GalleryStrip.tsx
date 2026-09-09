import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

/**
 * A photograph collage rather than a row of equal thumbnails: the first image
 * takes a 2×2 block and the rest fall in around it.
 *
 * The earlier version used a uniform 4:3 grid, on the reasoning that a mixed
 * grid leaves holes when the item count does not divide evenly. That is true
 * of ordinary grid flow — the fix is `grid-auto-flow: dense`, which back-fills
 * the smaller tiles into whatever the lead block leaves behind. Any remaining
 * gap lands at the end of the last row, where it reads as the edge of the
 * collage rather than as a hole in it.
 *
 * Fixed row heights rather than per-tile aspect ratios, because tiles that
 * span two rows have to agree with tiles that span one.
 */
export function GalleryStrip({ items }: { items: GalleryItem[] }) {
  if (!items?.length) return null;

  return (
    <div
      className={cn(
        "mt-9 grid auto-rows-[7rem] grid-cols-2 gap-3",
        "sm:auto-rows-[8.5rem] sm:grid-cols-4 sm:gap-4",
        "[grid-auto-flow:dense]",
      )}
    >
      {items.slice(0, 7).map((item, i) => (
        <Link
          key={item.id}
          href="/thu-vien"
          className={cn(
            "group relative block overflow-hidden rounded-card bg-ph-bg",
            // The lead block. On a phone it stays 2×2 as well — at two columns
            // that is the full width, which is the right emphasis there too.
            i === 0 ? "col-span-2 row-span-2" : "row-span-1",
          )}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
            <SafeImage
              src={item.thumbnail || (item.type === "image" ? item.url : "")}
              alt={item.title || "Ảnh sự kiện"}
              sizes={i === 0 ? "(max-width: 640px) 92vw, 560px" : "(max-width: 640px) 46vw, 300px"}
              quality={65}
            />
          </div>
          <div
            className="absolute inset-0 bg-linear-to-t from-brand-950/85 via-brand-950/10 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100"
            aria-hidden
          />
          {item.title && (
            <p
              className={cn(
                "absolute inset-x-4 bottom-4 translate-y-1.5 font-semibold text-white opacity-0",
                "transition-[transform,opacity] duration-400 group-hover:translate-y-0 group-hover:opacity-100",
                i === 0 ? "text-base" : "text-sm",
              )}
            >
              {item.title}
            </p>
          )}
        </Link>
      ))}

      <Link
        href="/thu-vien"
        className="group flex flex-col items-center justify-center gap-2.5 rounded-card bg-brand-900 text-center text-white transition-colors duration-300 hover:bg-brand-800"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 transition-transform duration-400 group-hover:scale-110">
          <ArrowUpRight className="h-5 w-5" />
        </span>
        <span className="text-sm font-bold">Xem thư viện</span>
      </Link>
    </div>
  );
}
