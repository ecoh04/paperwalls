"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);

  useEffect(() => {
    const ordersParam = searchParams.get("orders");
    if (ordersParam) {
      setOrderNumbers(ordersParam.split(",").map((s) => s.trim()).filter(Boolean));
    }
    clearCart();
  }, [searchParams, clearCart]);

  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <div className="mx-auto max-w-2xl px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        {/* Confirmation card */}
        <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-7 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pw-accent-soft text-pw-accent">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="pw-overline mt-6 text-pw-muted">Order confirmed</p>
          <h1 className="pw-h1 mt-3 text-pw-ink">Thank you.</h1>
          <p className="pw-body mt-3 text-pw-ink/70">
            We&rsquo;ve received your payment and your wallpaper goes onto the press today.
          </p>

          {orderNumbers.length > 0 && (
            <div className="mt-6 rounded-pw border border-pw-stone bg-pw-bg p-4 text-left sm:p-5">
              <p className="pw-overline text-pw-muted">Order number{orderNumbers.length > 1 ? "s" : ""}</p>
              <ul className="mt-2 space-y-1 font-mono pw-body text-pw-ink">
                {orderNumbers.map((num) => (
                  <li key={num}>{num}</li>
                ))}
              </ul>
              <p className="pw-small mt-3 text-pw-muted">
                Keep this for tracking. A confirmation email is on its way.
              </p>
            </div>
          )}
        </div>

        {/* What happens next */}
        <div className="mt-8 rounded-pw-card border border-pw-stone bg-pw-surface p-7 sm:p-8">
          <p className="pw-overline text-pw-muted">What happens next</p>
          <ol className="mt-5 space-y-5">
            {[
              {
                t: "Your order is confirmed",
                b: "Payment received. Our team picks up your file within two hours and runs the resolution check.",
              },
              {
                t: "Printed and packed in Cape Town",
                b: "You&rsquo;ll get an email when your order goes onto the press and again when it ships.",
              },
              {
                t: "Dispatched within 5 days",
                b: "Tracking number emailed as soon as it leaves our facility. All SA deliveries are insured.",
              },
            ].map((step, i) => (
              <li key={step.t} className="flex gap-4">
                <span
                  aria-hidden
                  className="pw-overline flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-pw-ink/20 bg-pw-bg text-pw-ink"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="pw-body font-semibold text-pw-ink">{step.t}</p>
                  <p
                    className="pw-small mt-1 text-pw-ink/70"
                    dangerouslySetInnerHTML={{ __html: step.b }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 text-center">
          <Button href="/" variant="primary" size="lg" className="w-full sm:w-auto">
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="bg-pw-bg pb-16 sm:pb-20">
        <div className="mx-auto max-w-2xl px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
          <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-8 text-center">
            <p className="pw-small text-pw-muted">Loading…</p>
          </div>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
