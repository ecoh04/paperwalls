// Horizontal funnel. Each row is scaled to the top stage (pageviews) so the
// taper shows the journey. The single WORST drop-off step is emphasised in
// terracotta with a "Biggest leak" tag, the volume lost at each step renders
// as a faint trailing segment, and a stage whose own event hasn't recorded yet
// shows as a ghost row (never a phantom full-width bar).

type Stage = {
  rank:     number;
  stage:    string;
  sessions: number;
  /** Sessions that actually fired THIS stage's event (0 while inherited). */
  own?:     number;
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
  const sorted = [...data].sort((a, b) => a.rank - b.rank);
  const top = Math.max(1, ...sorted.map((s) => Number(s.sessions)));

  // Worst drop INTO a stage (the destination of the biggest leak), among
  // tracked stages that have a real prior step.
  let worstTo = -1, worstDrop = 0;
  for (let i = 1; i < sorted.length; i++) {
    const cur = Number(sorted[i].sessions);
    const notTracked = sorted[i].own === 0 && cur > 0;
    const prev = Number(sorted[i - 1].sessions);
    if (!notTracked && prev > 0) {
      const d = (prev - cur) / prev;
      if (d > worstDrop) { worstDrop = d; worstTo = i; }
    }
  }

  return (
    <div className="space-y-2">
      {sorted.map((s, i) => {
        const n = Number(s.sessions);
        const label = STAGE_LABELS[s.stage] ?? s.stage;
        const notTracked = s.own === 0 && n > 0;

        if (notTracked) {
          return (
            <div key={s.stage} className="rounded-lg border border-dashed border-stone-200 bg-white p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-stone-400">{label}</span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-400">not tracked yet</span>
              </div>
              <div className="mt-2 h-2 w-full rounded bg-stone-100" />
              <div className="mt-1 text-xs text-stone-400">This step&apos;s event isn&apos;t recording yet</div>
            </div>
          );
        }

        const prev = i > 0 ? Number(sorted[i - 1].sessions) : n;
        const continuedW = (n / top) * 100;
        const lostW = i > 0 ? (Math.max(0, prev - n) / top) * 100 : 0;
        const dropPct = i > 0 && prev > 0 ? ((prev - n) / prev) * 100 : null;
        const lostCount = i > 0 ? Math.max(0, prev - n) : 0;
        const convFromTop = top > 0 ? (n / top) * 100 : 0;
        const isWorst = i === worstTo;

        return (
          <div key={s.stage} className={`rounded-lg border p-3 ${isWorst ? "border-pw-accent/40 bg-pw-accent-soft/50" : "border-stone-200 bg-white"}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-stone-900">
                {label}
                {isWorst && <span className="rounded-full bg-pw-accent-soft px-2 py-0.5 text-[11px] font-medium text-pw-accent">Biggest leak</span>}
              </span>
              <span className="text-sm tabular-nums text-stone-700">{n.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded bg-stone-100">
              <div className={isWorst ? "bg-pw-accent" : "bg-stone-400"} style={{ width: `${Math.max(1, continuedW)}%`, transition: "width 0.3s ease" }} />
              {lostW > 0.4 && <div className="bg-stone-200" style={{ width: `${lostW}%` }} title="dropped at this step" />}
            </div>
            <div className="mt-1 flex justify-between gap-2 text-xs text-stone-500">
              <span>{pct(convFromTop)} of pageviews</span>
              {dropPct != null && (
                <span className={isWorst ? "font-medium text-pw-accent" : dropPct > 70 ? "text-stone-700" : "text-stone-500"}>
                  −{pct(dropPct)} · {lostCount.toLocaleString()} dropped
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
