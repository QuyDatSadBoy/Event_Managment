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

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="relative isolate flex min-h-[min(100dvh,52rem)] items-center overflow-hidden pt-[var(--header-h)]">
      {/* Slideshow — each slide cross-fades with a slow Ken Burns drift. */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide, i) => (
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
                sizes="100vw"
                quality={82}
              />
            </div>
          </div>
        ))}
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

      <div className="container-page relative w-full py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ocean-100 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-glow opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-glow" />
            </span>
            {settings.event_tagline || "Diễn đàn thường niên"}
          </p>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.06] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
            {settings.hero_title || settings.event_name}
          </h1>

          {settings.hero_subtitle && (
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-ocean-100/80 sm:text-lg lg:text-xl">
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
          <div className="mt-14 flex items-center gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ảnh ${i + 1}${slide.caption ? `: ${slide.caption}` : ""}`}
                aria-current={i === index}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === index ? "w-12 bg-cyan-glow" : "w-6 bg-white/25 hover:bg-white/45",
                )}
              />
            ))}
            {slides[index]?.caption && (
              <span className="ml-3 hidden text-xs text-ocean-100/50 sm:block">
                {slides[index].caption}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
