"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  /** Shown when src is missing or the request fails — usually initials. */
  fallbackLabel?: string;
  className?: string;
  wrapperClassName?: string;
};

/**
 * Every image on the site is user-supplied through the admin, so any of them can
 * be missing or dead. This renders a branded gradient placeholder instead of a
 * broken-image icon, and never leaves a layout hole.
 */
export function SafeImage({
  src,
  alt,
  fallbackLabel,
  className,
  wrapperClassName,
  fill = true,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);
  const usable = src && src.trim().length > 0 && !failed;

  if (!usable) {
    return (
      <div
        aria-hidden={!fallbackLabel}
        role={fallbackLabel ? "img" : undefined}
        aria-label={fallbackLabel ? alt : undefined}
        className={cn(
          "absolute inset-0 grid place-items-center bg-linear-135 from-brand-100 via-brand-200 to-brand-300",
          wrapperClassName,
        )}
      >
        {fallbackLabel ? (
          <span className="text-2xl font-bold tracking-tight text-brand-700/70 select-none">
            {fallbackLabel}
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-brand-500/50" fill="currentColor">
            <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm3 3a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 7 8Zm11 9-4.5-6-3.2 4.2-2.1-2.6L6 17h12Z" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
      {...rest}
    />
  );
}
