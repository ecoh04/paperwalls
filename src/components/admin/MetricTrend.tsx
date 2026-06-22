"use client";

import { useState } from "react";
import { LineChart, type LinePoint, type ChartFormat } from "@/components/admin/charts/LineChart";

// One hero trend chart with a metric switcher (Shopify-style). The server
// pre-computes each metric's daily series + the previous-period series and
// passes them as plain data; the client only swaps which one is shown.

export type TrendMetric = {
  key:     string;
  label:   string;
  total:   string;   // headline number for the selected period
  color:   string;
  fill:    string;
  format:  ChartFormat;
  data:        LinePoint[];
  compareData: LinePoint[];
  /** Optional small delta chip next to the total (e.g. "+32%"). */
  deltaPct?: number | null;
};

export function MetricTrend({ metrics }: { metrics: TrendMetric[] }) {
  const [active, setActive] = useState(metrics[0]?.key ?? "");
  const m = metrics.find((x) => x.key === active) ?? metrics[0];
  if (!m) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-lg border border-stone-200 bg-stone-50 p-0.5">
          {metrics.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setActive(x.key)}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                x.key === m.key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
              ].join(" ")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-2xl font-semibold tabular-nums text-stone-900">{m.total}</span>
            {m.deltaPct != null && isFinite(m.deltaPct) && (
              <span className={`text-xs font-medium ${m.deltaPct >= 0 ? "text-green-700" : "text-red-700"}`}>
                {m.deltaPct >= 0 ? "▲" : "▼"}{Math.abs(m.deltaPct).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="text-xs uppercase tracking-wider text-stone-500">{m.label}</div>
        </div>
      </div>
      <LineChart
        data={m.data}
        compareData={m.compareData}
        compareLabel="previous"
        height={300}
        color={m.color}
        fill={m.fill}
        format={m.format}
        label={m.label.toLowerCase()}
      />
    </div>
  );
}
