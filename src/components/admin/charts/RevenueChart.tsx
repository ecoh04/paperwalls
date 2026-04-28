// 30-day daily-revenue line chart. Hand-rolled SVG, responsive width via
// `viewBox` + a 100% width container. No external dependencies.
//
// Receives an array of { day: 'YYYY-MM-DD', revenue_cents: number } sorted
// ascending. Renders a single line + soft fill, with date axis ticks and
// tooltips on hover.

"use client";

import { useState } from "react";

type Point = {
  day:           string;
  revenue_cents: number;
};

type Props = {
  data:   Point[];
  height?: number;
};

const ZAR = (cents: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(cents / 100);

export function RevenueChart({ data, height = 240 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const padX = 12;
  const padTop = 10;
  const padBottom = 28;
  const width = 800; // viewBox width; container scales

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500"
        style={{ height }}
      >
        No revenue in the selected window.
      </div>
    );
  }

  const maxY = Math.max(1, ...data.map((d) => d.revenue_cents));
  const innerW = width  - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padTop + innerH - (d.revenue_cents / maxY) * innerH;
    return { x, y, d, i };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const fillPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padTop + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(padTop + innerH).toFixed(1)} Z`;

  // Y-axis gridlines at 0/50/100% of max
  const gridLines = [0, 0.5, 1].map((pct) => ({
    pct,
    y:    padTop + innerH - pct * innerH,
    label: ZAR(maxY * pct),
  }));

  // Tick every ~7 days for the X axis to keep it readable
  const xTickStep = Math.max(1, Math.ceil(data.length / 6));
  const xTicks = points.filter((_, i) => i % xTickStep === 0 || i === data.length - 1);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-stone-200 bg-white p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines */}
        {gridLines.map((g) => (
          <g key={g.pct}>
            <line x1={padX} x2={width - padX} y1={g.y} y2={g.y} stroke="#E6DFD8" strokeWidth={1} strokeDasharray={g.pct === 0 ? "0" : "3 4"} />
            <text x={padX} y={g.y - 4} fontSize={11} fill="#8A8175">
              {g.label}
            </text>
          </g>
        ))}

        {/* fill + line */}
        <path d={fillPath} fill="rgba(196, 98, 45, 0.10)" stroke="none" />
        <path d={linePath} fill="none" stroke="#C4622D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />

        {/* points + invisible hover targets */}
        {points.map((p) => (
          <g key={p.i}>
            <circle
              cx={p.x} cy={p.y}
              r={hover === p.i ? 4.5 : 2.5}
              fill="#C4622D"
              stroke="#fff"
              strokeWidth={hover === p.i ? 2 : 1}
            />
            <rect
              x={p.x - 8} y={padTop}
              width={16} height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(p.i)}
              style={{ cursor: "default" }}
            />
          </g>
        ))}

        {/* x-axis labels */}
        {xTicks.map((p) => {
          const date = new Date(p.d.day);
          const label = date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
          return (
            <text
              key={`xt-${p.i}`}
              x={p.x} y={height - 10}
              fontSize={11} fill="#8A8175"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {hover != null && points[hover] && (
        <div
          className="pointer-events-none absolute rounded-md bg-stone-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{
            left:  `calc(${(points[hover].x / width) * 100}% - 50px)`,
            top:   `${(points[hover].y / height) * 100}%`,
          }}
        >
          <div>{new Date(points[hover].d.day).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}</div>
          <div className="text-stone-200">{ZAR(points[hover].d.revenue_cents)}</div>
        </div>
      )}
    </div>
  );
}
