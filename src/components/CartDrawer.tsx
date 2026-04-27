"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatZar } from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
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
    <div className="flex gap-3 py-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageDataUrls?.[0] ?? item.imageDataUrl}
          alt="Wallpaper preview"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="pw-small font-semibold text-pw-ink">Custom wallpaper</p>
          <p className="pw-small whitespace-nowrap font-semibold text-pw-ink">
            {formatZar(item.subtotalCents)}
          </p>
        </div>
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
          {item.wallpaperType === "peel_and_stick" ? "Peel & Stick" : "Traditional"} · {item.material}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-red-600 hover:decoration-red-600/40 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
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
    <div className="flex gap-3 py-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-pw border border-pw-stone bg-pw-bg">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect x="3"  y="3"  width="12" height="12" rx="2.5" fill="#C4622D" />
          <rect x="17" y="3"  width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.45" />
          <rect x="3"  y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.25" />
          <rect x="17" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.12" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="pw-small font-semibold text-pw-ink">Sample pack</p>
          <p className="pw-small whitespace-nowrap font-semibold text-pw-ink">
            {formatZar(item.subtotalCents)}
          </p>
        </div>
        <p className="pw-small mt-1 text-pw-muted">All three finishes · printed on the same press</p>
        <p className="pw-overline mt-1 text-pw-muted-light">Qty {item.quantity}</p>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-red-600 hover:decoration-red-600/40 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { items, removeItem, isCartOpen, closeCart } = useCart();

  // Lock body scroll while the drawer is open and respond to ESC.
  useEffect(() => {
    if (!isCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isCartOpen, closeCart]);

  const totalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeCart}
        className={[
          "fixed inset-0 z-[70] bg-pw-ink/35 backdrop-blur-sm transition-opacity duration-200",
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Cart"
        aria-hidden={!isCartOpen}
        className={[
          "fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col bg-pw-bg shadow-2xl transition-transform duration-300 ease-out",
          isCartOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-pw-stone px-5 py-4 sm:px-6">
          <div>
            <p className="pw-overline text-pw-muted">Your cart</p>
            <p className="pw-h3 mt-0.5 text-pw-ink">
              {items.length === 0
                ? "Empty"
                : `${items.length} item${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <p className="pw-overline text-pw-muted">Empty cart</p>
              <h2 className="pw-h3 mt-3 text-pw-ink">Nothing here yet.</h2>
              <p className="pw-body mt-3 max-w-sm text-pw-ink/70">
                Design your wallpaper or order a sample pack to get started.
              </p>
              <div className="mt-7 flex flex-col items-stretch gap-3">
                <Button href="/config" variant="primary" size="md" className="w-full" onClick={closeCart}>
                  Design your wallpaper
                </Button>
                <Button href="/samples" variant="secondary" size="md" className="w-full" onClick={closeCart}>
                  Order samples
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-pw-stone">
              {items.map((item) => (
                <li key={item.id}>
                  {item.type === "sample_pack" ? (
                    <SamplePackRow item={item} onRemove={() => removeItem(item.id)} />
                  ) : (
                    <WallpaperRow item={item} onRemove={() => removeItem(item.id)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / checkout */}
        {items.length > 0 && (
          <footer className="border-t border-pw-stone bg-pw-surface px-5 py-5 sm:px-6 sm:py-6">
            {/* Free shipping confirmation — already free, so this is reassurance, not progress */}
            <div className="mb-4 flex items-center gap-2.5 rounded-pw border border-pw-accent/25 bg-pw-accent-soft px-4 py-3">
              <svg
                aria-hidden
                className="h-4 w-4 shrink-0 text-pw-accent"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="pw-small text-pw-ink">
                Free SA delivery included. Yours in 5 days.
              </p>
            </div>

            <div className="mb-4 flex items-baseline justify-between">
              <span className="pw-small text-pw-muted">Subtotal</span>
              <div className="text-right">
                <span className="pw-h3 text-pw-ink">{formatZar(totalCents)}</span>
                <span className="pw-overline ml-2 text-pw-muted-light">VAT included</span>
              </div>
            </div>

            <Button
              href="/checkout"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={closeCart}
            >
              Checkout · {formatZar(totalCents)}
            </Button>
            <p className="pw-small mt-3 text-center text-pw-muted">
              No payment until you approve the price.{" "}
              <Link
                href="/cart"
                onClick={closeCart}
                className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
              >
                View full cart
              </Link>
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
