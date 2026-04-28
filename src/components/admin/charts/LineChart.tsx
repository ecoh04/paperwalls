"use client";

// Truly responsive SVG line chart. Reads the container width via
// ResizeObserver so SVG coordinates match real screen pixels — no
// preserveAspectRatio="none" stretching, no broken tooltip math.
//
// Generic over the value type: pass `formatY` to render axis labels and
// tooltip values. Used for revenue (cents → ZAR), session counts, and
// order counts without three near-duplicate components.

import { useEffect, useRef, useState } from "react";

export type LinePoint = {
  /** ISO date string (YYYY-MM-DD) — used for X-axis tick labels. */
  day:   string;
  value: number;
};

// Format discriminator. Server components cannot pass functions to client
// components (Next.js complains: "Functions cannot be passed directly to
// Client Components unless you explicitly expose it..."). So instead of a
// formatY function prop, accept a string and format internally.
export type ChartFormat = "zar_cents" | "int" | "decimal";

type Props = {
  data:           LinePoint[];
  height?:        number;
  /** Brand accent colour for the line. Defaults to ink. */
  color?:         string;
  /** Soft fill below the line. */
  fill?:          string;
  /** How to format Y-axis labels and tooltip values. */
  format?:        ChartFormat;
  /** Label shown next to the value in the tooltip. */
  label?:         string;
  /** Render compact (no tooltip, smaller text) — for small mini-charts. */
  compact?:       boolean;
};

function formatValue(n: number, format: ChartFormat): string {
  switch (format) {
    case "zar_cents":
      return new Intl.NumberFormat("en-ZA", {
        style: "currency", currency: "ZAR", minimumFractionDigits: 0,
      }).format(n / 100);
    case "decimal":
      return n.toFixed(2);
    case "int":
    default:
      return Math.round(n).toLocaleString("en-ZA");
  }
}

export function LineChart({
  data,
  height  = 220,
  color   = "#1A1714",
  fill    = "rgba(196, 98, 45, 0.10)",
  format  = "int",
  label   = "",
  compact = false,
}: Props) {
  const formatY = (n: number) => formatValue(n, format);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Empty / single-point state
  if (data.length === 0) {
    return (
      <div ref={wrapRef} className="rounded-xl border border-stone-200 bg-white p-3" style={{ height }}>
        <div className="flex h-full items-center justify-center text-sm text-stone-500">
          No data in this window.
        </div>
      </div>
    );
  }

  const allZero = data.every((d) => Number(d.value) === 0);

  // Layout
  const padX       = compact ? 4   : 12;
  const padTop     = compact ? 6   : 10;
  const padBottom  = compact ? 16  : 28;
  const padLeftAxis = compact ? 0  : 56;     // room for Y-axis labels

  if (width === 0) {
    return <div ref={wrapRef} className="rounded-xl border border-stone-200 bg-white p-3" style={{ height }} />;
  }

  const innerW = Math.max(1, width  - padX * 2 - padLeftAxis);
  const innerH = Math.max(1, height - padTop - padBottom);

  // Y range — when all zero, force a 0..1 range so the line sits at the bottom.
  const maxY = allZero ? 1 : Math.max(1, ...data.map((d) => Number(d.value)));

  const points = data.map((d, i) => {
    const x = padX + padLeftAxis + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padTop + innerH - (Number(d.value) / maxY) * innerH;
    return { x, y, d, i };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padTop + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(padTop + innerH).toFixed(1)} Z`;

  // Y-axis: 0/50/100% of max. Skip when all zero (just one "0" line).
  const gridLines = allZero
    ? [{ pct: 0, y: padTop + innerH, label: formatY(0) }]
    : [0, 0.5, 1].map((pct) => ({
        pct,
        y:    padTop + innerH - pct * innerH,
        label: formatY(maxY * pct),
      }));

  // X-axis ticks every ~6 entries
  const xTickStep = compact ? Math.max(1, Math.ceil(data.length / 3)) : Math.max(1, Math.ceil(data.length / 6));
  const xTicks = points.filter((_, i) => i % xTickStep === 0 || i === data.length - 1);

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible rounded-xl border border-stone-200 bg-white p-3">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines */}
        {gridLines.map((g, gi) => (
          <g key={gi}>
            <line
              x1={padX + padLeftAxis} x2={width - padX}
              y1={g.y} y2={g.y}
              stroke="#E6DFD8" strokeWidth={1}
              strokeDasharray={g.pct === 0 ? "0" : "3 4"}
            />
            {!compact && (
              <text x={padX + padLeftAxis - 6} y={g.y + 3} fontSize={10} fill="#8A8175" textAnchor="end">
                {g.label}
              </text>
            )}
          </g>
        ))}

        {/* fill + line */}
        <path d={fillPath} fill={fill} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />

        {/* points + invisible hover targets */}
        {!compact && points.map((p) => (
          <g key={p.i}>
            <circle
              cx={p.x} cy={p.y}
              r={hover === p.i ? 4.5 : 2.5}
              fill={color}
              stroke="#fff"
              strokeWidth={hover === p.i ? 2 : 1}
            />
            <rect
              x={p.x - 14} y={padTop}
              width={28} height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(p.i)}
              style={{ cursor: "default" }}
            />
          </g>
        ))}

        {/* x-axis labels */}
        {!compact && xTicks.map((p) => {
          const date = new Date(p.d.day);
          const lbl  = date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
          return (
            <text
              key={`xt-${p.i}`}
              x={p.x} y={height - 8}
              fontSize={10} fill="#8A8175"
              textAnchor="middle"
            >
              {lbl}
            </text>
          );
        })}
      </svg>

      {!compact && hover != null && points[hover] && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-stone-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{
            left:  `${Math.min(width - 110, Math.max(0, points[hover].x - 50))}px`,
            top:   `${Math.max(0, points[hover].y - 50)}px`,
            width: 100,
          }}
        >
          <div className="truncate">
            {new Date(points[hover].d.day).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <div className="text-stone-200">
            {label && <span className="mr-1 text-stone-400">{label}</span>}
            {formatY(Number(points[hover].d.value))}
          </div>
        </div>
      )}
    </div>
  );
}
