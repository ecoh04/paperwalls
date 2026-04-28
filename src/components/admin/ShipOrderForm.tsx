"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderShipped } from "@/app/admin/orders/actions";

const COURIERS = [
  "Pargo",
  "The Courier Guy",
  "Aramex",
  "Dawn Wing",
  "RAM",
  "PostNet",
  "Other",
] as const;

type Props = {
  orderId:        string;
  initialCourier: string | null;
  initialTracking: string | null;
  initialTrackingUrl: string | null;
  alreadyShipped: boolean;
};

export function ShipOrderForm({
  orderId,
  initialCourier,
  initialTracking,
  initialTrackingUrl,
  alreadyShipped,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [courier, setCourier]   = useState(initialCourier ?? "Pargo");
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [url, setUrl]           = useState(initialTrackingUrl ?? "");
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!tracking.trim()) {
      setError("Tracking number is required");
      return;
    }
    startTransition(async () => {
      const result = await markOrderShipped(orderId, {
        courier,
        trackingNumber: tracking.trim(),
        trackingUrl:    url.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        alreadyShipped
          ? "Tracking updated. Customer re-notified."
          : "Marked shipped. Customer notified."
      );
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {alreadyShipped ? "Update tracking" : "Ship & notify customer"}
        </h2>
        {alreadyShipped && (
          <span className="text-xs text-stone-500">already shipped</span>
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {alreadyShipped
          ? "Edit the tracking details and we'll re-send the shipped email with the corrected info."
          : "Capture tracking, set status to shipped, and email the customer in one step."}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Courier</span>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            {COURIERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">Tracking number</span>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            disabled={isPending}
            placeholder="e.g. PG12345678"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            required
          />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Tracking URL <span className="text-stone-400">· optional</span>
          </span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isPending}
            placeholder="https://www.thecourierguy.co.za/track?ref=…"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <span className="text-xs text-stone-500">
            If included, the customer email will link the tracking number directly.
          </span>
        </label>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {isPending
              ? "Working…"
              : alreadyShipped
                ? "Update & re-notify"
                : "Mark shipped & email customer"}
          </button>
          {error   && <span className="text-sm font-medium text-red-700">{error}</span>}
          {success && <span className="text-sm font-medium text-green-700">{success}</span>}
        </div>
      </form>
    </section>
  );
}
