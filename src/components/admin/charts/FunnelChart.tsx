// Horizontal funnel bars. Each row shows stage label, count, and a bar
// scaled to the largest step in the funnel so the drop-off pattern is
// instantly visible. A stage whose own event hasn't recorded yet renders as
// "not tracked yet" instead of a phantom count inherited from a later stage.

type Stage = {
  rank:    number;
  stage:   string;
  sessions: number;
  /**
   * Sessions that actually fired THIS stage's own event. When it is 0 while
   * `sessions` (the monotonic rolled-up count) is > 0, the number is inherited
   * from a later stage, so we show "not tracked yet" rather than a phantom.
   */
  own?:    number;
};

const STAGE_LABELS: Record<string, string> = {
  pageview:           "Pageview",
  pdp_viewed:         "PDP viewed",
  config_started:     "Configurator opened",
  config_image:       "Image uploaded",
  add_to_cart:        "Added to cart",
  checkout_started:   "Started checkout",
  checkout_submitted: "Submitted checkout",
  order_paid:         "Order paid",
};

function pct(n: number): string {
  if (!isFinite(n)) return "—";
  if (n < 0.1) return n.toFixed(2) + "%";
  if (n < 10)  return n.toFixed(1) + "%";
  return Math.round(n).toString() + "%";
}

export function FunnelChart({ data }: { data: Stage[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
        No funnel data yet. Once visitors arrive, this will populate.
      </div>
    );
  }
  const top = Math.max(1, ...data.map((s) => Number(s.sessions)));

  return (
    <div className="space-y-2">
      {data
        .sort((a, b) => a.rank - b.rank)
        .map((s, i, arr) => {
          const n = Number(s.sessions);
          // Inherited (phantom) when this stage's own event never fired but the
          // monotonic rollup still credits it from a later stage.
          const notTracked = s.own === 0 && n > 0;
          const widthPct = (n / top) * 100;
          const dropFromPrev = i > 0 ? Number(arr[i - 1].sessions) : null;
          const dropPct = dropFromPrev && dropFromPrev > 0 ? ((dropFromPrev - n) / dropFromPrev) * 100 : null;
          const conversionFromTop = top > 0 ? (n / top) * 100 : 0;

          return (
            <div key={s.stage} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-stone-900">
                  {STAGE_LABELS[s.stage] ?? s.stage}
                </span>
                {notTracked ? (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400">
                    not tracked yet
                  </span>
                ) : (
                  <span className="text-sm tabular-nums text-stone-700">
                    {n.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded bg-stone-100">
                <div
                  className={`h-full rounded ${notTracked ? "bg-stone-200 opacity-60" : "bg-pw-accent"}`}
                  style={{ width: `${notTracked ? 100 : Math.max(2, widthPct)}%`, transition: "width 0.3s ease" }}
                />
              </div>
              <div className="mt-1 flex justify-between gap-2 text-xs text-stone-500">
                {notTracked ? (
                  <span className="text-stone-400">
                    This step&apos;s event hasn&apos;t recorded yet — count carried from a later step
                  </span>
                ) : (
                  <>
                    <span>{pct(conversionFromTop)} of pageviews</span>
                    {dropPct != null && (
                      <span className={dropPct > 70 ? "text-red-600" : "text-stone-500"}>
                        -{pct(dropPct)} from previous
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
