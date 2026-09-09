import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  /** Builds the href for a given page, so each page keeps its own filters. */
  hrefFor: (page: number) => string;
};

/** Compact page list: 1 … 4 5 6 … 20 */
function pageWindow(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i += 1) out.push(i);
  if (to < total - 1) out.push("gap");
  out.push(total);
  return out;
}

export function Pagination({ page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);

  const arrow =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-ocean-200 text-ocean-700 transition-[border-color,background-color] duration-300 hover:border-ocean-400 hover:bg-ocean-50";
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Phân trang">
      <Link
        href={hrefFor(page - 1)}
        aria-label="Trang trước"
        className={cn(arrow, page <= 1 && disabled)}
        aria-disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ocean-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-300",
              item === page
                ? "bg-ocean-600 text-white shadow-[0_8px_20px_-8px_rgb(6_120_214/0.8)]"
                : "border border-ocean-200 text-ocean-700 hover:border-ocean-400 hover:bg-ocean-50",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        href={hrefFor(page + 1)}
        aria-label="Trang sau"
        className={cn(arrow, page >= totalPages && disabled)}
        aria-disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
