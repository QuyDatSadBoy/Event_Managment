"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, ArrowRight, CalendarRange, Pause, Play } from "lucide-react";
import type { Settings } from "@/lib/types";
import { cn, formatDateRange } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";

/**
 * The hero splits: the promise on the left over navy, the proof on the right as
 * one large rounded photograph.
 *
 * The previous hero ran the photograph full-bleed under an 82% overlay, which
 * meant the only picture of the event on the page was 18% visible. Giving the
 * photograph its own panel is what buys the trust the copy is asking for — the
 * audience, the room, the people. It also lets the type sit on flat navy, where
 * white is 16.9:1 instead of whatever the uploaded image happens to allow.
 *
 * The block cuts bottom-right onto the strip below, so that strip reads as
 * sliding underneath it; the wrapper is painted that strip's colour, because
 * that is what the corner exposes.
 */
/**
 * Slideshow timing, in one place so it can be tuned without hunting through
 * the markup.
 *
 * `HOLD` is how long a slide stays put; `FADE` is the crossfade. They interact:
 * the still time a visitor actually gets is HOLD − FADE, so at 3000 / 600 the
 * photograph is fully settled for 2.4s. The fade was cut from the original
 * 1000ms when the hold came down from 6000 — at a short hold a long crossfade
 * means the image is almost always mid-dissolve.
 *
 * Below about 2s the run stops reading as a slideshow and starts reading as
 * flicker, and the eye never settles long enough to see what is in the frame.
 * The pause control and the reduced-motion guard below are what make any
 * self-starting interval acceptable at all.
 */
const HOLD_MS = 3000;
const FADE_MS = 600;
/**
 * When the next slide starts downloading. It has to be comfortably before the
 * first advance or the crossfade runs against an image that has not arrived —
 * at the old 2500ms this sat *after* a 2000ms hold and the second slide would
 * have flashed in blank.
 */
const PRELOAD_MS = Math.max(400, HOLD_MS - 1200);

export function Hero({ settings }: { settings: Settings }) {
  const slides =
    settings.hero_slides?.length > 0
      ? settings.hero_slides
      : settings.hero_image
        ? [{ image: settings.hero_image, caption: "" }]
        : [];

  const [index, setIndex] = useState(0);
  // Only the slide on screen and the one after it are mounted. Loading every
  // slide up front costs the hero photograph — the LCP element — the bandwidth
  // it needs first, and the later ones are not on screen yet.
  const [warm, setWarm] = useState(false);

  // Moving content that starts on its own has to be stoppable, and it has to
  // stop by itself in three cases: the visitor asked for reduced motion, the
  // keyboard is inside the carousel (otherwise the thing being read moves out
  // from under the reader), or the tab is in the background.
  const [userPaused, setUserPaused] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // The second slide is prefetched even when autoplay never runs, so a manual
  // advance does not start from a blank panel.
  useEffect(() => {
    if (slides.length < 2) return;
    const start = setTimeout(() => setWarm(true), PRELOAD_MS);
    return () => clearTimeout(start);
  }, [slides.length]);

  const autoplay =
    slides.length > 1 && !userPaused && !focusWithin && !reduced && !tabHidden;

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), HOLD_MS);
    return () => clearInterval(id);
  }, [autoplay, slides.length]);

  const mounted = (i: number) =>
    i === 0 || i === index || (warm && i === (index + 1) % slides.length);

  return (
    <section className="bg-brand-800">
      <div className="band band-br relative isolate bg-brand-900 pt-[var(--header-h)]">
        {/* Decoration, all of it inert and none of it load-bearing: a 96px
            rule grid in the decorative blue, a single open polygon tracing the
            photograph's shoulder, and one warm glow. The grid is quieter than
            the hexagon field, which matters here because it sits under the
            largest type on the site. */}
        <div className="line-grid absolute inset-0 -z-10 opacity-60" aria-hidden />
        <svg
          className="absolute -right-24 top-8 -z-10 hidden h-[30rem] w-[30rem] lg:block"
          viewBox="0 0 480 480"
          fill="none"
          aria-hidden
          focusable="false"
        >
          <path
            d="M240 8 L448 128 L448 352 L240 472 L32 352 L32 128 Z"
            stroke="var(--color-deco)"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <path
            d="M240 88 L378 168 L378 312 L240 392"
            stroke="var(--color-deco)"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
        </svg>
        <div
          className="absolute -right-40 -top-24 -z-10 h-[36rem] w-[36rem] rounded-full bg-accent-500/12 blur-3xl"
          aria-hidden
        />

        <div className="container-page relative py-12 lg:py-20">
          {/* With no photograph uploaded the second column would leave a hole
              the width of the panel, so the grid collapses to one column and
              the copy is allowed to run wider. */}
          <div
            className={cn(
              "grid items-center gap-10 lg:gap-14",
              slides.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)]",
            )}
          >
            {/* ---- Promise ---- */}
            <div className={cn(slides.length > 0 ? "max-w-2xl" : "max-w-3xl")}>
              {settings.event_tagline && (
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-caption font-medium text-brand-200 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
                  {settings.event_tagline}
                </p>
              )}

              <h1 className="mt-6 text-balance text-[clamp(2.125rem,1.3rem+3.2vw,3.25rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-white">
                {settings.hero_title || settings.event_name}
              </h1>

              {settings.hero_subtitle && (
                <p className="mt-5 max-w-[52ch] text-pretty leading-relaxed text-brand-200 lg:text-lg">
                  {settings.hero_subtitle}
                </p>
              )}

              {/* Guarded as a whole: with neither a date nor a venue set, the
                  unguarded version still emitted an empty <dl>, which is a
                  description list that describes nothing. */}
              {(settings.start_date || settings.venue_name) && (
              <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white">
                {settings.start_date && (
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-[18px] w-[18px] text-accent-500" aria-hidden />
                    <dt className="sr-only">Thời gian</dt>
                    <dd className="font-medium">
                      {formatDateRange(settings.start_date, settings.end_date)}
                    </dd>
                  </div>
                )}
                {settings.venue_name && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-[18px] w-[18px] text-accent-500" aria-hidden />
                    <dt className="sr-only">Địa điểm</dt>
                    <dd className="font-medium">{settings.venue_name}</dd>
                  </div>
                )}
              </dl>
              )}

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
            </div>

            {/* ---- Proof ---- */}
            {slides.length > 0 && (
              <div
                className="relative"
                // Focus anywhere inside the carousel — a dot, the pause control
                // — holds the rotation still until focus leaves again.
                onFocusCapture={() => setFocusWithin(true)}
                onBlurCapture={() => setFocusWithin(false)}
                {...(slides.length > 1
                  ? { role: "group" as const, "aria-roledescription": "Trình chiếu ảnh" }
                  : {})}
              >
                <div className="relative aspect-4/3 overflow-hidden rounded-panel shadow-panel ring-1 ring-white/12 lg:aspect-5/4">
                  {slides.map((slide, i) =>
                    !mounted(i) ? null : (
                      <div
                        key={`${slide.image}-${i}`}
                        // Inline, not a `duration-*` class: the value comes from
                        // FADE_MS so the two timings stay in one place.
                        style={{ transitionDuration: `${FADE_MS}ms` }}
                        className={cn(
                          "absolute inset-0 transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)]",
                          i === index ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <SafeImage
                          src={slide.image}
                          alt={slide.caption || settings.event_name}
                          priority={i === 0}
                          fetchPriority={i === 0 ? "high" : "low"}
                          loading={i === 0 ? undefined : "lazy"}
                          // No overlay sits on this image any more, so it is
                          // asked for at a quality a viewer will actually see —
                          // but only at panel width, not the full viewport.
                          sizes="(max-width: 1024px) 92vw, 29rem"
                          quality={72}
                        />
                      </div>
                    ),
                  )}
                </div>

                {slides.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-1 lg:justify-start">
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
                              ? "w-10 bg-accent-500"
                              : "w-5 bg-white/35 group-hover:bg-white/60",
                          )}
                        />
                      </button>
                    ))}

                    {/* Reduced motion already stops the rotation, so the
                        control would be a switch that does nothing — the dots
                        remain as the manual way through. */}
                    {!reduced && (
                      <button
                        type="button"
                        onClick={() => setUserPaused((v) => !v)}
                        aria-pressed={userPaused}
                        aria-label={
                          userPaused ? "Tiếp tục trình chiếu ảnh" : "Tạm dừng trình chiếu ảnh"
                        }
                        className="ml-2 grid h-11 w-11 place-items-center rounded-full text-brand-200 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                      >
                        {userPaused ? (
                          <Play className="h-3.5 w-3.5" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
