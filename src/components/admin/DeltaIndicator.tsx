// Tiny vs-previous-period delta indicator. Used on stat cards to give
// context: "is today good or bad?" without having to remember what
// last week looked like.

type Props = {
  current:  number;
  previous: number;
  /** Higher is better (default true). For metrics like refund rate, set false. */
  goodIfUp?: boolean;
  /** Suffix label, e.g. "vs prior 7 days". */
  label?:   string;
};

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) < 0.1) return n.toFixed(2) + "%";
  if (Math.abs(n) < 10)  return n.toFixed(1) + "%";
  return Math.round(n).toString() + "%";
}

export function DeltaIndicator({ current, previous, goodIfUp = true, label }: Props) {
  if (previous === 0 && current === 0) {
    return (
      <span className="text-xs text-stone-400">{label ?? "—"}</span>
    );
  }
  if (previous === 0) {
    return (
      <span className="text-xs font-medium text-green-700">
        first {label ? label.replace(/^vs\s+/, "") : "period"}
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const up  = pct > 0;
  const flat = Math.abs(pct) < 1;
  const good = flat ? null : up === goodIfUp;

  const colorCls = flat
    ? "text-stone-500"
    : good
      ? "text-green-700"
      : "text-red-700";

  const arrow = flat ? "·" : up ? "↑" : "↓";

  return (
    <span className={`inline-flex items-baseline gap-1 text-xs font-medium ${colorCls}`}>
      <span aria-hidden>{arrow}</span>
      <span className="tabular-nums">{fmtPct(Math.abs(pct))}</span>
      {label && <span className="font-normal text-stone-500">{label}</span>}
    </span>
  );
}
