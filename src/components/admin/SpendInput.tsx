"use client";

import { useState, useTransition } from "react";
import { setDailySpend } from "@/app/admin/analytics/actions";

// In-dashboard ad-spend input. Saves the spend for one SAST day via a server
// action; the page re-renders with MER / ROAS / CAC / net-profit lit up. Amber
// ring when unset so the founder is nudged to enter it before reading profit.

export function SpendInput({ spendDate, label, initialCents }: { spendDate: string; label: string; initialCents: number }) {
  const [rands, setRands] = useState(initialCents > 0 ? String(Math.round(initialCents / 100)) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => {
    const cents = Math.round((parseFloat(rands) || 0) * 100);
    if (cents === initialCents) return;
    start(async () => {
      await setDailySpend(spendDate, cents);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  };

  const unset = initialCents <= 0 && !rands;
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${unset ? "border-amber-300 bg-amber-50" : "border-stone-300 bg-white"}`}>
      <span className="whitespace-nowrap text-xs text-stone-500">{label} ad spend</span>
      <span className="text-sm text-stone-400">R</span>
      <input
        value={rands}
        onChange={(e) => setRands(e.target.value.replace(/[^\d.]/g, ""))}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder="0"
        inputMode="decimal"
        aria-label={`${label} ad spend in rands`}
        className="w-16 bg-transparent text-sm tabular-nums text-stone-900 focus:outline-none"
      />
      {pending ? <span className="text-xs text-stone-400">…</span> : saved ? <span aria-hidden className="text-xs text-green-600">✓</span> : null}
    </div>
  );
}
