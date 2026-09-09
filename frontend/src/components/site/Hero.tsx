"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, ArrowRight, CalendarRange } from "lucide-react";
import type { Settings } from "@/lib/types";
import { cn, formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { DecoRings } from "@/components/ui/Deco";

/**
 * design.pen D1/M1 "Hero banner": a background photograph under an 82%
 * brand-primary-dark overlay, cutting bottom-right so the countdown strip below
 * reads as sliding underneath it.
 *
 * The wrapper is painted the colour of that countdown strip — that is what the
 * corner exposes, and leaving it white would show the page through the cut.
 */
export function Hero({ settings }: { settings: Settings }) {
  const slides =
    settings.hero_slides?.length > 0
      ? settings.hero_slides
      : settings.hero_image
        ? [{ image: settings.hero_image, caption: "" }]
        : [];

  const [index, setIndex] = useState(0);
  // Only the slide on screen and the one after it are mounted. Loading all four
  // at once costs the hero photograph — the LCP element — its bandwidth, and
  // three of them are not visible for at least six seconds.
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    if (slides.length < 2) return;
    const start = setTimeout(() => setWarm(true), 2500);
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [slides.length]);

  const mounted = (i: number) =>
    i === 0 || i === index || (warm && i === (index + 1) % slides.length);

  return (
    <section className="bg-brand-800">
      <div className="band band-br relative isolate flex min-h-[32rem] items-end bg-brand-800 pt-[var(--header-h)] lg:min-h-[38rem]">
        {/* Photograph */}
        <div className="absolute inset-0 -z-20">
          {slides.map((slide, i) =>
            !mounted(i) ? null : (
              <div
                key={`${slide.image}-${i}`}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              >
                <SafeImage
                  src={slide.image}
                  alt={slide.caption || settings.event_name}
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading={i === 0 ? undefined : "lazy"}
                  // The photograph sits under an 82% overlay, so most of its
                  // detail never reaches the screen. At full width and q72 it
                  // was the LCP element at 2.6s on a throttled phone; this is
                  // visually identical and roughly a third of the bytes.
                  sizes="100vw"
                  quality={50}
                />
              </div>
            ),
          )}
        </div>

        {/* design.pen: #04564F at 82% over the image. */}
        <div className="absolute inset-0 -z-10 bg-brand-800/82" aria-hidden />
        <DecoRings tone="dark" className="-right-32 -top-40 hidden h-[560px] w-[560px] lg:block" />

        <div className="container-page relative w-full pb-14 pt-16 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <h1 className="text-balance text-[clamp(2rem,1.3rem+2.6vw,3rem)] font-bold leading-[1.15] tracking-[-0.02em] text-white">
              {settings.hero_title || settings.event_name}
            </h1>

            {settings.hero_subtitle && (
              <p className="mt-5 max-w-[52ch] text-pretty leading-relaxed text-brand-200 lg:text-lg">
                {settings.hero_subtitle}
              </p>
            )}

            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
              {settings.start_date && (
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="h-[18px] w-[18px] text-brand-400" aria-hidden />
                  <dt className="sr-only">Thời gian</dt>
                  <dd className="font-medium">
                    {formatDateRange(settings.start_date, settings.end_date)}
                  </dd>
                </div>
              )}
              {settings.venue_name && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-[18px] w-[18px] text-brand-400" aria-hidden />
                  <dt className="sr-only">Địa điểm</dt>
                  <dd className="font-medium">{settings.venue_name}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {settings.registration_open ? (
                <ButtonLink href="/dang-ky" size="lg">
                  Đăng ký tham dự
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              ) : (
                <span className="inline-flex h-13 items-center rounded-control bg-white/10 px-7 text-sm font-bold text-white">
                  Cổng đăng ký đã đóng
                </span>
              )}
              <ButtonLink
                href="/chuong-trinh"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:bg-white/10"
              >
                <CalendarRange className="h-[18px] w-[18px]" />
                Xem chương trình
              </ButtonLink>
            </div>

            {slides.length > 1 && (
              <div className="mt-10 flex items-center gap-1">
                {slides.map((slide, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ảnh ${i + 1}${slide.caption ? `: ${slide.caption}` : ""}`}
                    aria-current={i === index}
                    className="group grid h-11 min-w-11 place-items-center"
                  >
                    <span
                      className={cn(
                        "block h-1 rounded-full transition-[width,background-color] duration-500",
                        i === index ? "w-10 bg-cream" : "w-5 bg-white/35 group-hover:bg-white/60",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
