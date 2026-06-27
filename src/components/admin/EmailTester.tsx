"use client";

import { useState, useTransition } from "react";
import { sendTestEmail } from "@/app/admin/emails/actions";

// Founder-facing QA panel: pick an optional alternate recipient, then fire any
// template to that inbox. Mirrors SpendInput's useTransition + saved/✓ + error
// feedback. Per-row pending and result state so several rows can be fired in
// sequence without the feedback bleeding across rows.

type Template = { kind: string; label: string; note: string };

const TEMPLATES: Template[] = [
  { kind: "order_confirmed",          label: "Order confirmed",        note: "Customer · order has gone to print" },
  { kind: "order_shipped",            label: "Order shipped",          note: "Customer · courier and tracking" },
  { kind: "order_delivered",          label: "Order delivered",        note: "Customer · arrived, reprint offer" },
  { kind: "admin_new_order",          label: "Admin: new order",       note: "You · new paid order alert" },
  { kind: "abandoned_cart_wallpaper", label: "Abandoned cart: wallpaper", note: "Customer · saved design with hero image" },
  { kind: "abandoned_cart_sample",    label: "Abandoned cart: sample", note: "Customer · sample pack reminder" },
];

type RowState = { tone: "ok" | "error"; msg: string } | null;

export function EmailTester({ defaultEmail }: { defaultEmail: string }) {
  const [override, setOverride] = useState("");
  const [pending, start] = useTransition();
  const [activeKind, setActiveKind] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RowState>>({});

  const recipient = override.trim() || defaultEmail;

  const send = (kind: string) => {
    setActiveKind(kind);
    setResults((r) => ({ ...r, [kind]: null }));
    start(async () => {
      const res = await sendTestEmail(kind, override.trim() || undefined);
      setResults((r) => ({
        ...r,
        [kind]: res.ok
          ? { tone: "ok", msg: `Sent to ${recipient}. Check your inbox and spam.` }
          : { tone: "error", msg: res.error || "Send failed" },
      }));
      setActiveKind(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Recipient */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <label htmlFor="email-override" className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
          Send to a different address
        </label>
        <p className="mt-1 text-sm text-stone-600">
          Leave blank to send to <span className="font-medium text-stone-900">{defaultEmail}</span>.
        </p>
        <input
          id="email-override"
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          placeholder={defaultEmail}
          inputMode="email"
          autoComplete="off"
          className="mt-3 w-full max-w-md rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
      </div>

      {/* Template grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => {
          const res = results[t.kind];
          const busy = pending && activeKind === t.kind;
          return (
            <div key={t.kind} className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{t.label}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{t.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => send(t.kind)}
                  disabled={pending}
                  className="shrink-0 rounded-lg bg-[#c4622d] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#a9531f] disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Send to me"}
                </button>
              </div>
              {res && (
                <p className={`mt-3 text-xs ${res.tone === "ok" ? "text-green-700" : "text-red-700"}`}>
                  {res.tone === "ok" ? "✓ " : "✗ "}{res.msg}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
