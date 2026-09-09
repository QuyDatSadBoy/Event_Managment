"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

/**
 * Image loader tuned for a small VPS.
 *
 * Next's built-in optimizer downloads and re-encodes every remote image on the
 * server. A page like /doi-tac shows seventeen partner logos at once, and doing
 * that work on a 2-core box spikes memory hard enough for pm2 to restart the
 * process — which the browser sees as a 502.
 *
 * So the expensive path is reserved for media we host ourselves (a handful per
 * page, and genuinely worth resizing). Anything already behind a CDN is handed
 * to the browser directly, with the CDN's own resize parameters where it
 * supports them, which yields a real responsive srcset at zero server cost.
 */
export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const q = quality ?? 75;

  // Our own uploads: resize on the server.
  if (src.startsWith("/uploads/") || src.startsWith("/")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
  }

  // Unsplash resizes from the URL — ask it for exactly the width we need.
  if (src.startsWith("https://images.unsplash.com/")) {
    try {
      const u = new URL(src);
      const prevW = Number(u.searchParams.get("w"));
      const prevH = Number(u.searchParams.get("h"));

      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      u.searchParams.set("q", String(q));
      u.searchParams.set("w", String(width));

      // A URL that pins both dimensions is asking for a specific crop ratio
      // (square portraits, for instance). Overriding only the width would ask
      // for a 36×600 sliver of the photo, so scale the height with it.
      if (prevW > 0 && prevH > 0) {
        u.searchParams.set("h", String(Math.max(1, Math.round((prevH / prevW) * width))));
      }
      return u.toString();
    } catch {
      return src;
    }
  }

  // Everything else (logos, YouTube posters) is already small and cached.
  return src;
}
