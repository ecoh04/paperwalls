"use client";

import { formatZar } from "@/lib/pricing";

type Props = {
  totalSqm:      number;
  subtotalCents: number;
  canAddToCart:  boolean;
  blockedReason: string | null;
  onAddToCart:   () => void;
};

/**
 * Sticky bottom bar on mobile only. Always-visible running total + primary
 * CTA so cold-traffic buyers don't have to scroll past every step to see
 * what their wall costs or how to add to cart.
 *
 * Hidden on desktop (lg+) where the right-column summary panel is sticky.
 */
export function MobileSummaryBar({
  totalSqm,
  subtotalCents,
  canAddToCart,
  blockedReason,
  onAddToCart,
}: Props) {
  const hasPrice = totalSqm > 0 && subtotalCents > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-pw-stone bg-pw-surface/95 backdrop-blur supports-[backdrop-filter]:bg-pw-surface/85 lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-8">
        <div className="min-w-0 flex-1">
          {hasPrice ? (
            <>
              <p className="pw-overline text-pw-muted">Running total</p>
              <p className="pw-h3 text-pw-ink">{formatZar(subtotalCents)}</p>
            </>
          ) : (
            <>
              <p className="pw-overline text-pw-muted">Your wallpaper</p>
              <p className="pw-small text-pw-muted">
                {blockedReason ?? "Set up your wallpaper to see pricing."}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canAddToCart}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-pw bg-pw-ink px-6 pw-small font-semibold text-white transition-colors hover:bg-pw-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canAddToCart ? "Add to cart" : "Continue"}
        </button>
      </div>
    </div>
  );
}
