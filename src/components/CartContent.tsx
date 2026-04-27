"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatZar } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { WallpaperCartItem, SamplePackCartItem } from "@/types/cart";

function fmtCm(m: number) {
  return `${(m * 100).toFixed(0)} cm`;
}

function WallpaperRow({
  item,
  onRemove,
}: {
  item: WallpaperCartItem;
  onRemove: () => void;
}) {
  return (
    <>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-bg sm:h-24 sm:w-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageDataUrls?.[0] ?? item.imageDataUrl}
          alt="Wallpaper preview"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="pw-body font-semibold text-pw-ink">Custom wallpaper</p>
        <p className="pw-small mt-1 text-pw-muted">
          {item.walls?.length
            ? item.walls
                .map((w, i) => `Wall ${i + 1}: ${fmtCm(w.widthM)} × ${fmtCm(w.heightM)}`)
                .join(" · ")
            : `${fmtCm(item.widthM)} × ${fmtCm(item.heightM)}${item.wallCount > 1 ? ` × ${item.wallCount}` : ""}`}
          {" · "}
          {item.totalSqm.toFixed(1)} m²
        </p>
        <p className="pw-overline mt-1 text-pw-muted-light">
          {item.wallpaperType === "peel_and_stick" ? "Peel & Stick" : "Traditional"} · {item.material} · {item.application.replace(/_/g, " ")}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <p className="pw-body font-semibold text-pw-ink">{formatZar(item.subtotalCents)}</p>
        <button
          type="button"
          onClick={onRemove}
          className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-red-600 hover:decoration-red-600/40 transition-colors"
        >
          Remove
        </button>
      </div>
    </>
  );
}

function SamplePackRow({
  item,
  onRemove,
}: {
  item: SamplePackCartItem;
  onRemove: () => void;
}) {
  return (
    <>
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-pw border border-pw-stone bg-pw-bg sm:h-24 sm:w-24">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="3"  y="3"  width="12" height="12" rx="2.5" fill="#C4622D" />
          <rect x="17" y="3"  width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.45" />
          <rect x="3"  y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.25" />
          <rect x="17" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.12" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="pw-body font-semibold text-pw-ink">Sample pack</p>
        <p className="pw-small mt-1 text-pw-muted">All three finishes · printed on the same press</p>
        <p className="pw-overline mt-1 text-pw-muted-light">Qty {item.quantity}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <p className="pw-body font-semibold text-pw-ink">{formatZar(item.subtotalCents)}</p>
        <button
          type="button"
          onClick={onRemove}
          className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-red-600 hover:decoration-red-600/40 transition-colors"
        >
          Remove
        </button>
      </div>
    </>
  );
}

const CONFIDENCE = [
  "Secure payment via PayFast",
  "Free SA delivery",
  "Yours in 5 days",
  "Reply within 1 business day",
];

export function CartContent() {
  const { items, removeItem } = useCart();

  // ── Empty cart state ───────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-8 text-center sm:p-12">
        <Eyebrow variant="muted">Empty cart</Eyebrow>
        <h2 className="pw-h2 mt-3 text-pw-ink">Nothing here yet.</h2>
        <p className="pw-body mt-3 text-pw-ink/70">
          Design your wallpaper or order a sample pack to get started.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button href="/config" variant="primary" size="lg">
            Design your wallpaper
          </Button>
          <Button href="/samples" variant="secondary" size="lg">
            Order samples
          </Button>
        </div>
      </div>
    );
  }

  const totalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 sm:pb-0">
      {/* Items */}
      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-pw-card border border-pw-stone bg-pw-surface p-4 sm:p-5"
          >
            {item.type === "sample_pack" ? (
              <SamplePackRow item={item} onRemove={() => removeItem(item.id)} />
            ) : (
              <WallpaperRow item={item} onRemove={() => removeItem(item.id)} />
            )}
          </li>
        ))}
      </ul>

      {/* Subtotal — fixed bottom on mobile, inline card on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-pw-stone bg-pw-surface/95 backdrop-blur supports-[backdrop-filter]:bg-pw-surface/85 sm:static sm:rounded-pw-card sm:border sm:bg-pw-bg sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-6 sm:py-6">
          <div className="min-w-0 flex-1">
            <p className="pw-overline text-pw-muted">Subtotal</p>
            <p className="pw-h3 mt-0.5 text-pw-ink">{formatZar(totalCents)}</p>
            <p className="pw-small mt-0.5 hidden text-pw-ink/70 sm:block">
              Free delivery, secure checkout via PayFast.
            </p>
          </div>
          <Button href="/checkout" variant="primary" size="lg" className="shrink-0">
            Checkout
          </Button>
        </div>
      </div>

      {/* Confidence trust block */}
      <ul className="grid gap-2 rounded-pw border border-pw-stone bg-pw-bg p-5 sm:grid-cols-2 sm:gap-3 sm:p-6">
        {CONFIDENCE.map((line) => (
          <li key={line} className="flex items-start gap-2 pw-small text-pw-ink/70">
            <svg
              aria-hidden
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pw-accent"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
