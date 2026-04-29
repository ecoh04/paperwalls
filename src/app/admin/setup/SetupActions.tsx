"use client";

import { useState, useTransition } from "react";

// Test buttons for the Setup page. Standalone client component so the
// page itself stays SSR (good for live env-var checks).

export function SendTestEmailButton() {
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function fire() {
    setBusy(true);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/test-email", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setResult({ ok: true, msg: `Sent to ${data.to}. Check your inbox (and spam).` });
        } else {
          setResult({ ok: false, msg: `${data.error ?? "Failed"}${data.hint ? ` — ${data.hint}` : ""}` });
        }
      } catch (err) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Network error" });
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={fire}
        disabled={busy}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send test email"}
      </button>
      {result && (
        <p className={`text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}>
          {result.ok ? "✓ " : "✗ "}{result.msg}
        </p>
      )}
    </div>
  );
}

export function CopyableCommand({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2">
      <code className="flex-1 break-all font-mono text-xs text-stone-800">{value}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
