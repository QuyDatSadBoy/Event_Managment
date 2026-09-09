"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, ArrowRight, PlayCircle } from "lucide-react";
import type { Settings } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { Countdown } from "@/components/ui/Countdown";
import { SafeImage } from "@/components/ui/SafeImage";

export function Hero({ settings }: { settings: Settings }) {
  const slides =
    settings.hero_slides?.length > 0
      ? settings.hero_slides
      : settings.hero_image
        ? [{ image: settings.hero_image, caption: "" }]
        : [];

  const [index, setIndex] = useState(0);
  // The follow-up slides are decorative until the carousel advances; loading
  // all four at 1920px on first paint costs the LCP image its bandwidth.
  const [mountRest, setMountRest] = useState(false);

  useEffect(() => {
    if (slides.length < 2) return;
    const warm = setTimeout(() => setMountRest(true), 1200);
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => {
      clearTimeout(warm);
      clearInterval(id);
    };
  }, [slides.length]);

  return (
    <section className="relative isolate flex min-h-[min(100dvh,52rem)] items-center overflow-hidden pt-[var(--header-h)]">
      {/* Slideshow — each slide cross-fades with a slow Ken Burns drift. */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide, i) =>
          i > 0 && !mountRest ? null : (
          <div
            key={`${slide.image}-${i}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-1500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 scale-105",
                i === index && "animate-[float_18s_ease-in-out_infinite]",
              )}
            >
              <SafeImage
                src={slide.image}
                alt={slide.caption || settings.event_name}
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
                loading={i === 0 ? undefined : "lazy"}
                sizes="100vw"
                quality={75}
              />
            </div>
          </div>
          ),
        )}
        {slides.length === 0 && <div className="surface-deep absolute inset-0" />}
      </div>

      {/* Scrim: dark enough for AA text contrast over any photo. */}
      <div
        className="absolute inset-0 -z-10 bg-linear-to-br from-abyss/92 via-abyss/78 to-ocean-900/70"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_500px_at_20%_0%,rgb(34_211_238/0.18),transparent_60%)]"
        aria-hidden
      />
      <div className="grid-overlay absolute inset-0 -z-10 opacity-40" aria-hidden />

      <div className="container-page relative w-full section-y">
        <div className="max-w-3xl">
          <h1 className="text-balance text-[clamp(2.25rem,1.2rem+4.4vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-0.04em] text-white">
            {settings.hero_title || settings.event_name}
          </h1>

          {settings.hero_subtitle && (
            <p className="mt-6 max-w-[52ch] text-pretty text-base leading-relaxed text-ocean-100/85 sm:text-lg lg:text-xl">
              {settings.hero_subtitle}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ocean-100/85">
            {settings.start_date && (
              <span className="inline-flex items-center gap-2.5">
                <CalendarDays className="h-4.5 w-4.5 text-cyan-glow" />
                <span className="font-medium">
                  {formatDateRange(settings.start_date, settings.end_date)}
                </span>
              </span>
            )}
            {settings.venue_name && (
              <span className="inline-flex items-center gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-cyan-glow" />
                <span className="font-medium">{settings.venue_name}</span>
              </span>
            )}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {settings.registration_open ? (
              <ButtonLink href="/dang-ky" size="lg">
                Đăng ký tham dự
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            ) : (
              <span className="inline-flex h-13 items-center rounded-full border border-white/20 bg-white/8 px-7 text-sm font-semibold text-ocean-100 backdrop-blur-md">
                Cổng đăng ký đã đóng
              </span>
            )}
            <ButtonLink
              href="/chuong-trinh"
              size="lg"
              variant="ghost"
              className="border border-white/20 bg-white/8 text-white backdrop-blur-md hover:bg-white/15"
            >
              <PlayCircle className="h-4.5 w-4.5" />
              Xem chương trình
            </ButtonLink>
          </div>

          {settings.start_date && (
            <div className="mt-12">
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ocean-100/55">
                Sự kiện khai mạc sau
              </p>
              <Countdown target={settings.start_date} />
            </div>
          )}
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
                    i === index
                      ? "w-12 bg-cyan-glow"
                      : "w-6 bg-white/30 group-hover:bg-white/55",
                  )}
                />
              </button>
            ))}
            {slides[index]?.caption && (
              <span className="ml-3 hidden text-xs text-ocean-100/75 sm:block">
                {slides[index].caption}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
