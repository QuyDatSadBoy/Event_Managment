"use client";

import { useId, useState } from "react";
import { formatDateShort } from "@/lib/utils";

type Point = { date: string; count: number };

/**
 * Inline SVG area chart. Small enough to hand-roll, and it avoids pulling a
 * charting library into the admin bundle for a single sparkline.
 */
export function TrendChart({ data, height = 180 }: { data: Point[]; height?: number }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ocean-950/45">Chưa có dữ liệu.</p>;
  }

  const W = 640;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`Biểu đồ đăng ký ${data.length} ngày gần nhất, cao nhất ${max} lượt`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-ocean-500)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-ocean-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal guides at 0, 50%, 100% of the max. */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(max * f)}
            y2={y(max * f)}
            stroke="var(--color-ocean-100)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ocean-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => (
          <g key={d.date}>
            {/* Wide invisible target so hovering is easy on a dense series. */}
            <rect
              x={x(i) - innerW / data.length / 2}
              y={PAD.top}
              width={innerW / data.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            <circle
              cx={x(i)}
              cy={y(d.count)}
              r={hover === i ? 5 : 3}
              fill="white"
              stroke="var(--color-ocean-600)"
              strokeWidth="2.5"
              className="transition-all duration-200"
            />
          </g>
        ))}

        {data.map((d, i) =>
          i % Math.ceil(data.length / 7) === 0 ? (
            <text
              key={`label-${d.date}`}
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className="fill-[color:var(--color-ocean-950)]/40 text-[11px]"
            >
              {formatDateShort(d.date).slice(0, 5)}
            </text>
          ) : null,
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ocean-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{
            left: `${(x(hover!) / W) * 100}%`,
            top: `${(y(active.count) / H) * 100}%`,
            marginTop: "-8px",
          }}
        >
          <span className="tabular-nums">{active.count}</span> lượt ·{" "}
          {formatDateShort(active.date)}
        </div>
      )}
    </div>
  );
}
