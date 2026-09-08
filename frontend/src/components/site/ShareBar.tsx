"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { FacebookIcon, LinkedinIcon } from "@/components/ui/BrandIcons";

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const currentUrl = () => (typeof window === "undefined" ? "" : window.location.href);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some browsers/contexts; the share links still work.
    }
  };

  const open = (build: (url: string) => string) => {
    const url = currentUrl();
    if (url) window.open(build(url), "_blank", "noopener,noreferrer,width=640,height=560");
  };

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-ocean-200 text-ocean-700 transition duration-300 hover:border-ocean-400 hover:bg-ocean-50";

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-ocean-100 pt-8">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-950/60">
        <Share2 className="h-4 w-4" />
        Chia sẻ bài viết
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Chia sẻ lên Facebook"
          onClick={() => open((u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`)}
          className={btn}
        >
          <FacebookIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Chia sẻ lên LinkedIn"
          onClick={() =>
            open(
              (u) =>
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(title)}`,
            )
          }
          className={btn}
        >
          <LinkedinIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label="Sao chép đường dẫn"
          className={btn}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
        </button>
      </div>

      {copied && <span className="text-xs font-medium text-emerald-600">Đã sao chép đường dẫn</span>}
    </div>
  );
}
