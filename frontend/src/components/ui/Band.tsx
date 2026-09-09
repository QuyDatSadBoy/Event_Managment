import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Corner = "br" | "tl" | "bl" | "tr";

/**
 * A colour band with one large asymmetric corner, so each block reads as a card
 * sliding over the next one.
 *
 * design.pen calls for two elements, and the reason matters: the *wrapper* is
 * painted the colour of the adjacent section that the cut exposes, and the
 * inner band carries the radius. Without the wrapper the page's white shows
 * through the corner, which is exactly what the pattern is trying to avoid.
 *
 * Direction alternates down the page — heroes cut bottom-right, CTA bands cut
 * top-left. Footers stay square.
 */
export function Band({
  children,
  corner = "br",
  /** The colour revealed in the cut: whatever section sits against that corner. */
  behind = "bg-white",
  className,
  innerClassName,
  as: Tag = "section",
}: {
  children: ReactNode;
  corner?: Corner;
  behind?: string;
  className?: string;
  innerClassName?: string;
  as?: "section" | "div" | "header" | "footer";
}) {
  const radius: Record<Corner, string> = {
    br: "band-br",
    tl: "band-tl",
    bl: "band-bl",
    tr: "band-tr",
  };

  return (
    <Tag className={cn("relative", behind, className)}>
      <div className={cn("band", radius[corner], innerClassName)}>{children}</div>
    </Tag>
  );
}
