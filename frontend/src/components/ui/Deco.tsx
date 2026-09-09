import { cn } from "@/lib/utils";

/**
 * The two background motifs design.pen allows: concentric spotlight rings and a
 * fading dot grid. Both are pure vector, so they cost nothing to download.
 *
 * The file's own rule for them: they appear only in flat bands that would
 * otherwise be empty — page heroes, the countdown strip, CTA bands, the footer.
 * Never behind photography, never behind body copy or a form. If you notice the
 * motif before the headline it is too strong, so the strokes sit around 25%
 * alpha and the host section clips them.
 */

type Tone = "dark" | "light";

const RING_STROKE: Record<Tone, string> = {
  dark: "rgb(195 229 227 / 0.24)",
  light: "rgb(6 124 116 / 0.16)",
};
const CORE_FILL: Record<Tone, string> = {
  dark: "rgb(195 229 227 / 0.16)",
  light: "rgb(6 124 116 / 0.10)",
};

/** Concentric rings, two of them broken into arcs, around a soft core dot. */
export function DecoRings({
  tone = "dark",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const stroke = RING_STROKE[tone];
  return (
    <svg
      viewBox="0 0 560 560"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none absolute", className)}
    >
      <circle cx="280" cy="280" r="279.25" fill="none" stroke={stroke} strokeWidth="1.5" />
      {/* 250° arc, starting at 30° — the break keeps the motif from reading as a target */}
      <path
        d="M 470.53 435.53 A 220 220 0 1 1 470.53 124.47"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        transform="rotate(30 280 280)"
      />
      <circle cx="280" cy="280" r="159.25" fill="none" stroke={stroke} strokeWidth="1.5" />
      <path
        d="M 181.31 375.7 A 105 105 0 0 1 371.68 324.6"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
      />
      <circle cx="280" cy="280" r="59.25" fill="none" stroke={stroke} strokeWidth="1.5" />
      <circle cx="280" cy="280" r="16" fill={CORE_FILL[tone]} />
    </svg>
  );
}

/** 8×5 dot grid on a 56px pitch, fading in from the left. */
export function DecoDotGrid({
  tone = "dark",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const fill = tone === "dark" ? "#fef4d8" : "#067c74";
  const cols = 8;
  const rows = 5;
  const dots = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={c * 56 + 2.5}
          cy={r * 56 + 2.5}
          r="2.5"
          fill={fill}
          // Brightest at the far corner, so the grid reads as light falling off.
          opacity={(0.3 + c * 0.043 + r * 0.012) * (tone === "dark" ? 1 : 0.55)}
        />,
      );
    }
  }
  return (
    <svg
      viewBox="0 0 397 229"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none absolute", className)}
    >
      {dots}
    </svg>
  );
}
