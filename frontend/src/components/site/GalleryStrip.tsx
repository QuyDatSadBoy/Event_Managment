import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

/**
 * Seven photographs and the "see all" tile, in two rows of four.
 *
 * A double-height lead tile looked better in isolation but left a hole: with
 * four columns it needs exactly nine tiles to close, and the API returns eight.
 * A uniform grid always fills, whatever the gallery holds.
 */
export function GalleryStrip({ items }: { items: GalleryItem[] }) {
  if (!items?.length) return null;

  return (
    <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.slice(0, 7).map((item) => (
        <Link
          key={item.id}
          href="/thu-vien"
          className={cn(
            "group relative block aspect-4/3 overflow-hidden rounded-card bg-ph-bg",
          )}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
            <SafeImage
              src={item.thumbnail || (item.type === "image" ? item.url : "")}
              alt={item.title || "Ảnh sự kiện"}
              sizes="(max-width: 640px) 46vw, 320px"
              quality={65}
            />
          </div>
          <div
            className="absolute inset-0 bg-linear-to-t from-brand-950/85 via-brand-950/10 to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100"
            aria-hidden
          />
          {item.title && (
            <p className="absolute inset-x-4 bottom-4 translate-y-1.5 text-sm font-semibold text-white opacity-0 transition-[transform,opacity] duration-400 group-hover:translate-y-0 group-hover:opacity-100">
              {item.title}
            </p>
          )}
        </Link>
      ))}

      <Link
        href="/thu-vien"
        className="group flex aspect-4/3 flex-col items-center justify-center gap-2.5 rounded-card bg-brand-600 text-center text-white transition-colors duration-300 hover:bg-brand-800"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 transition-transform duration-400 group-hover:scale-110">
          <ArrowUpRight className="h-5 w-5" />
        </span>
        <span className="text-sm font-bold">Xem thư viện</span>
      </Link>
    </div>
  );
}
