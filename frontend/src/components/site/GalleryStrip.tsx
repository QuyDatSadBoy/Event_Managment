import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { SafeImage } from "@/components/ui/SafeImage";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Mosaic: the first tile spans 2x2 so the strip is not a flat row of squares. */
export function GalleryStrip({ items }: { items: GalleryItem[] }) {
  if (!items?.length) return null;

  return (
    <div className="mt-14">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {items.slice(0, 7).map((item, i) => (
          <Reveal
            key={item.id}
            delay={i * 60}
            className={cn(i === 0 && "col-span-2 row-span-2 sm:col-span-2")}
          >
            <Link
              href="/thu-vien"
              className={cn(
                "group relative block overflow-hidden rounded-2xl bg-ocean-100",
                i === 0 ? "aspect-square" : "aspect-4/3",
              )}
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108">
                <SafeImage
                  src={item.thumbnail || (item.type === "image" ? item.url : "")}
                  alt={item.title || "Ảnh sự kiện"}
                  sizes={i === 0 ? "(max-width: 640px) 92vw, 50vw" : "(max-width: 640px) 46vw, 25vw"}
                />
              </div>
              <div
                className="absolute inset-0 bg-linear-to-t from-abyss/85 via-abyss/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
              />
              {item.title && (
                <p className="absolute inset-x-4 bottom-4 translate-y-2 text-sm font-semibold text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.title}
                </p>
              )}
            </Link>
          </Reveal>
        ))}

        <Reveal delay={420}>
          <Link
            href="/thu-vien"
            className="group flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ocean-300 bg-ocean-50/60 text-center transition duration-400 hover:border-ocean-500 hover:bg-ocean-50"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-ocean-600 shadow-sm transition-transform duration-400 group-hover:scale-110">
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-ocean-800">Xem thư viện</span>
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
