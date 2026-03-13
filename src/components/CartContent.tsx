"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatZar } from "@/lib/pricing";

function fmtM(m: number) {
  return `${(m * 100).toFixed(0)} cm`;
}

export function CartContent() {
  const { items, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-pw-card border border-pw-stone bg-pw-bg p-8 text-center">
        <p className="text-pw-muted">Your cart is empty.</p>
        <Link
          href="/config"
          className="mt-4 inline-block text-sm font-medium text-pw-ink underline hover:no-underline"
        >
          Design your wallpaper
        </Link>
      </div>
    );
  }

  const totalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);

  return (
    <div className="mt-8 space-y-6">
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-pw-card border border-pw-stone bg-pw-surface p-4"
          >
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded border border-pw-stone bg-pw-bg">
              <img
                src={item.imageDataUrls?.[0] ?? item.imageDataUrl}
                alt="Wallpaper preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-pw-ink">Custom wallpaper</p>
              <p className="text-sm text-pw-muted">
                {item.walls?.length
                  ? item.walls.map((w, i) => `Wall ${i + 1}: ${fmtM(w.widthM)} × ${fmtM(w.heightM)}`).join(" · ")
                  : `${fmtM(item.widthM)} × ${fmtM(item.heightM)}${item.wallCount > 1 ? ` × ${item.wallCount} walls` : ""}`}
                {" "}· {item.totalSqm.toFixed(1)} m²
              </p>
              <p className="text-sm text-pw-muted capitalize">
                {item.style} · {item.application.replace("_", " ")}
              </p>
            </div>
            <div className="flex flex-col items-end justify-between">
              <p className="font-semibold text-pw-ink">{formatZar(item.subtotalCents)}</p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-sm text-pw-muted hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-pw-stone bg-pw-surface/95 pb-4 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:static sm:rounded-pw-card sm:border sm:bg-pw-bg sm:py-6 sm:shadow-none">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-1 sm:px-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-pw-muted">Subtotal (excl. shipping)</p>
            <p className="text-lg font-semibold text-pw-ink">{formatZar(totalCents)}</p>
            <p className="mt-0.5 text-xs text-pw-muted">Shipping is added at checkout based on your address.</p>
            <p className="mt-1 text-xs text-pw-muted">Custom-printed to your exact dimensions. Dispatched within 72 hours.</p>
          </div>
          <Link
            href="/checkout"
            className="ml-4 inline-flex items-center justify-center rounded-pw bg-pw-ink px-6 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft sm:px-8 sm:py-3"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
