"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { formatZar } from "@/lib/pricing";

export default function CheckoutPage() {
  const { items, sessionId } = useCart();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (payfastUrl: string, fields: Record<string, string>) => {
      setError(null);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payfastUrl;
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type  = "hidden";
        input.name  = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    },
    []
  );

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  // ── Empty cart state ───────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main className="bg-pw-bg pb-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
          <div className="mx-auto max-w-xl rounded-pw-card border border-pw-stone bg-pw-surface p-8 text-center sm:p-10">
            <p className="pw-overline text-pw-muted">Empty cart</p>
            <h1 className="pw-h2 mt-3 text-pw-ink">Nothing here yet.</h1>
            <p className="pw-body mt-3 text-pw-ink/70">
              Design your wallpaper first. We&rsquo;ll bring you back here to check out.
            </p>
            <Button href="/config" variant="primary" size="lg" className="mt-7 w-full sm:w-auto">
              Design your wallpaper
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // ── Standard checkout state ────────────────────────────────────────────
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Checkout</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">Almost there.</h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Where to ship it, and how to reach you. Payment runs through PayFast on the next screen.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {error && (
          <div className="mb-6 flex gap-3 rounded-pw border border-red-200 bg-red-50 p-4" role="alert">
            <svg
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div className="min-w-0">
              <p className="pw-small font-semibold text-red-800">Payment couldn&rsquo;t start</p>
              <p className="pw-small mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Checkout form — left column on desktop, below order on mobile */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <CheckoutForm
              items={items}
              sessionId={sessionId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          {/* Order summary — right column on desktop, top on mobile */}
          <aside className="order-1 lg:order-2 lg:col-span-1">
            <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-7 lg:sticky lg:top-[7rem]">
              <p className="pw-overline text-pw-muted">Your order</p>

              <ul className="mt-4 space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 border-b border-pw-stone pb-4 last:border-0 last:pb-0">
                    {item.type === "sample_pack" ? (
                      <>
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-pw border border-pw-stone bg-pw-bg">
                          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
                            <rect x="3" y="3" width="12" height="12" rx="2.5" fill="#C4622D" />
                            <rect x="17" y="3" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.45" />
                            <rect x="3" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.25" />
                            <rect x="17" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.12" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="pw-small font-semibold text-pw-ink">Sample pack</p>
                          <p className="pw-small mt-0.5 text-pw-muted">
                            All three finishes · Qty {item.quantity}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-bg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageDataUrls?.[0] ?? item.imageDataUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="pw-small font-semibold text-pw-ink">Custom wallpaper</p>
                          <p className="pw-small mt-0.5 text-pw-muted">
                            {item.walls?.length
                              ? item.walls
                                  .map((w, i) => `Wall ${i + 1}: ${Math.round(w.widthM * 100)}×${Math.round(w.heightM * 100)} cm`)
                                  .join(" · ")
                              : `${Math.round(item.widthM * 100)}×${Math.round(item.heightM * 100)} cm${item.wallCount > 1 ? ` × ${item.wallCount}` : ""}`}
                            {" · "}
                            {item.totalSqm.toFixed(1)} m²
                          </p>
                          <p className="pw-overline mt-1 text-pw-muted-light">
                            {item.wallpaperType === "peel_and_stick" ? "Peel & Stick" : "Traditional"} · {item.material}
                          </p>
                        </div>
                      </>
                    )}
                    <p className="pw-small whitespace-nowrap font-semibold text-pw-ink">
                      {formatZar(item.subtotalCents)}
                    </p>
                  </li>
                ))}
              </ul>

              <p className="pw-small mt-5 text-pw-muted-light">
                Shipping is free. Final total includes any installation extras you picked.
              </p>
            </div>

            {/* Trust strip below the panel on mobile, below the sticky box on desktop */}
            <ul className="mt-5 grid gap-2 rounded-pw border border-pw-stone bg-pw-bg p-4 sm:grid-cols-3 sm:gap-3 sm:p-5">
              {[
                "Secure payment via PayFast",
                "Free SA delivery",
                "Reply within 1 business day",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 pw-small text-pw-ink/70">
                  <svg aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>

            <p className="pw-small mt-5 text-center text-pw-muted">
              <Link href="/cart" className="font-medium underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors">
                Back to cart
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
