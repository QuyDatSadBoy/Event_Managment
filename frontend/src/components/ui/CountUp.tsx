"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

/**
 * Counts up to `value` when the figure scrolls into view.
 *
 * The number itself is never owned by the animation. It renders at its real
 * value on the server and stays there unless three things are all true: the
 * client has hydrated, the visitor has not asked for reduced motion, and the
 * figure is still below the fold. Only then does it drop to zero and climb —
 * a change nobody can see, because the element is off screen when it happens.
 *
 * The earlier version started at 0 and waited for an IntersectionObserver at
 * a 0.4 threshold. That made the count-up load-bearing: with JavaScript
 * broken, or with a figure taller than the viewport (a large display number
 * on a short screen never reaches 40% visibility), the page sat there
 * claiming the event had "0+" attendees. A statistic that can render as false
 * is worse than one that does not animate.
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1600,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Truth first; the animation may borrow it, never define it.
  const [display, setDisplay] = useState(value);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (done.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen: the run-up would have to start mid-flight, so skip it
    // and leave the real number in place.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      done.current = true;
      return;
    }

    setDisplay(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutExpo — fast start, gentle landing on the final number.
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(Math.round(value * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      // Any sliver of the figure is enough. A tall display number may never
      // reach a fractional threshold at all.
      { threshold: 0 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      // Unmounting mid-flight must not leave a zero behind.
      if (!done.current) setDisplay(value);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
