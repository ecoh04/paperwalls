"use client";

// Responsive SVG line/area chart with an optional period-over-period
// comparison overlay (Shopify-style): the previous period renders as a dashed
// muted line, a vertical guide tracks the cursor, and the tooltip shows this
// period vs previous with the % change. Reads container width via
// ResizeObserver so SVG coords match real pixels (accurate hit-testing).

import { useEffect, useRef, useState } from "react";

export type LinePoint = {
  /** ISO date string (YYYY-MM-DD) — used for X-axis tick labels + tooltip. */
  day:   string;
  value: number;
};

// Server components can't pass functions to client components, so format is a
// string discriminator rather than a formatY callback.
export type ChartFormat = "zar_cents" | "int" | "decimal";

type Props = {
  data:           LinePoint[];
  height?:        number;
  color?:         string;
  fill?:          string;
  format?:        ChartFormat;
  label?:         string;
  compact?:       boolean;
  /** Previous-period series, aligned by index, drawn as a dashed overlay. */
  compareData?:   LinePoint[];
  /** Label for the comparison line in the tooltip (e.g. "prev period"). */
  compareLabel?:  string;
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
  compareData,
  compareLabel = "previous",
}: Props) {
  const formatY = (n: number) => formatValue(n, format);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  const [hover, setHover] = useState<number | null>(null);
  const hasCompare = !compact && Array.isArray(compareData) && compareData.length > 0;

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

  if (data.length === 0) {
    return (
      <div ref={wrapRef} className="rounded-xl border border-stone-200 bg-white p-3" style={{ height }}>
        <div className="flex h-full items-center justify-center text-sm text-stone-500">
          No data in this period.
        </div>
      </div>
    );
  }

  const allZero = data.every((d) => Number(d.value) === 0)
    && (!hasCompare || compareData!.every((d) => Number(d.value) === 0));

  const padX        = compact ? 4   : 12;
  const padTop      = compact ? 6   : 14;
  const padBottom   = compact ? 16  : 28;
  const padLeftAxis = compact ? 0   : 56;

  if (width === 0) {
    return <div ref={wrapRef} className="rounded-xl border border-stone-200 bg-white p-3" style={{ height }} />;
  }

  const innerW = Math.max(1, width  - padX * 2 - padLeftAxis);
  const innerH = Math.max(1, height - padTop - padBottom);

  // Y range spans both series so the comparison line is never clipped.
  const maxY = allZero
    ? 1
    : Math.max(1, ...data.map((d) => Number(d.value)), ...(hasCompare ? compareData!.map((d) => Number(d.value)) : []));

  const xAt = (i: number) => padX + padLeftAxis + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yAt = (v: number) => padTop + innerH - (v / maxY) * innerH;

  const points = data.map((d, i) => ({ x: xAt(i), y: yAt(Number(d.value)), d, i }));
  const comparePoints = hasCompare
    ? compareData!.slice(0, data.length).map((d, i) => ({ x: xAt(i), y: yAt(Number(d.value)), d, i }))
    : [];

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const linePath = toPath(points);
  const fillPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padTop + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(padTop + innerH).toFixed(1)} Z`;
  const comparePath = comparePoints.length > 0 ? toPath(comparePoints) : "";

  const gridLines = allZero
    ? [{ pct: 0, y: padTop + innerH, label: formatY(0) }]
    : [0, 0.5, 1].map((pct) => ({ pct, y: padTop + innerH - pct * innerH, label: formatY(maxY * pct) }));

  const xTickStep = compact ? Math.max(1, Math.ceil(data.length / 3)) : Math.max(1, Math.ceil(data.length / 6));
  const xTicks = points.filter((_, i) => i % xTickStep === 0 || i === data.length - 1);

  const hoverCur  = hover != null ? Number(points[hover]?.d.value ?? 0) : 0;
  const hoverPrev = hover != null && hasCompare ? Number(comparePoints[hover]?.d.value ?? NaN) : NaN;
  const hoverDelta = hover != null && hasCompare && isFinite(hoverPrev) && hoverPrev > 0
    ? ((hoverCur - hoverPrev) / hoverPrev) * 100
    : null;

  return (
    <div ref={wrapRef} className="relative w-full overflow-visible rounded-xl border border-stone-200 bg-white p-3">
      {hasCompare && (
        <div className="mb-1 flex items-center justify-end gap-3 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-3.5 rounded" style={{ background: color }} />this period</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-0 w-3.5 border-t-2 border-dashed border-stone-400" />{compareLabel}</span>
        </div>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        onMouseLeave={() => setHover(null)}
      >
        {gridLines.map((g, gi) => (
          <g key={gi}>
            <line x1={padX + padLeftAxis} x2={width - padX} y1={g.y} y2={g.y} stroke="#E6DFD8" strokeWidth={1} strokeDasharray={g.pct === 0 ? "0" : "3 4"} />
            {!compact && <text x={padX + padLeftAxis - 6} y={g.y + 3} fontSize={10} fill="#8A8175" textAnchor="end">{g.label}</text>}
          </g>
        ))}

        {/* vertical hover guide */}
        {!compact && hover != null && points[hover] && (
          <line x1={points[hover].x} x2={points[hover].x} y1={padTop} y2={padTop + innerH} stroke="#C8BFB4" strokeWidth={1} strokeDasharray="2 3" />
        )}

        {/* previous-period dashed overlay (behind current) */}
        {comparePath && (
          <path d={comparePath} fill="none" stroke="#9C938799" strokeWidth={1.5} strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* current period: fill + line */}
        <path d={fillPath} fill={fill} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />

        {/* compare marker on hover */}
        {!compact && hover != null && comparePoints[hover] && (
          <circle cx={comparePoints[hover].x} cy={comparePoints[hover].y} r={3} fill="#fff" stroke="#9C9387" strokeWidth={1.5} />
        )}

        {/* points + invisible hover targets */}
        {!compact && points.map((p) => (
          <g key={p.i}>
            <circle cx={p.x} cy={p.y} r={hover === p.i ? 4.5 : 2.5} fill={color} stroke="#fff" strokeWidth={hover === p.i ? 2 : 1} />
            <rect x={p.x - 14} y={padTop} width={28} height={innerH} fill="transparent" onMouseEnter={() => setHover(p.i)} style={{ cursor: "default" }} />
          </g>
        ))}

        {!compact && xTicks.map((p) => (
          <text key={`xt-${p.i}`} x={p.x} y={height - 8} fontSize={10} fill="#8A8175" textAnchor="middle">
            {new Date(p.d.day).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
          </text>
        ))}
      </svg>

      {!compact && hover != null && points[hover] && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          style={{
            left: `${Math.min(width - 132, Math.max(0, points[hover].x - 60))}px`,
            top:  `${Math.max(0, points[hover].y - (hasCompare ? 64 : 48))}px`,
            width: 124,
          }}
        >
          <div className="truncate text-stone-300">
            {new Date(points[hover].d.day).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <div className="mt-0.5">
            {label && <span className="mr-1 text-stone-400">{label}</span>}
            {formatY(hoverCur)}
          </div>
          {hasCompare && (
            <div className="mt-0.5 flex items-center justify-between text-[11px] text-stone-400">
              <span>{compareLabel} {isFinite(hoverPrev) ? formatY(hoverPrev) : "—"}</span>
              {hoverDelta != null && (
                <span className={hoverDelta >= 0 ? "text-green-400" : "text-red-400"}>
                  {hoverDelta >= 0 ? "▲" : "▼"}{Math.abs(hoverDelta).toFixed(0)}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
