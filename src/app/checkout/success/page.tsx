"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

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
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/cart", label: "Cart" },
          { href: "/checkout", label: "Checkout" },
          { label: "Success" },
        ]}
      />
      <div className="mx-auto max-w-xl rounded-pw-card border border-pw-stone bg-pw-surface p-8 text-center shadow-pw-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pw-accent-soft text-pw-accent">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 font-sans text-3xl font-bold tracking-tight text-pw-ink">Thank you for your order</h1>
        <p className="mt-2 text-pw-ink/80">
          We&apos;ve received your payment and will start preparing your wallpaper.
        </p>

        {orderNumbers.length > 0 && (
          <div className="mt-6 rounded-lg border border-pw-stone bg-pw-bg p-4 text-left">
            <p className="text-sm font-medium text-pw-ink">Order number(s)</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-pw-ink">
              {orderNumbers.map((num) => (
                <li key={num}>{num}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-pw-ink/70">
              Keep this number for tracking. A confirmation email is on its way.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="mt-8 rounded-lg border border-pw-stone bg-pw-bg p-5 text-left">
          <p className="text-sm font-semibold text-pw-ink">What happens next</p>
          <ol className="mt-4 space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pw-accent-soft text-xs font-semibold text-pw-accent">1</span>
              <div>
                <p className="text-sm font-medium text-pw-ink">We confirm your order</p>
                <p className="mt-0.5 text-xs text-pw-ink/75">Payment received. Your order is being picked up by our team within 2 hours.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pw-accent-soft text-xs font-semibold text-pw-accent">2</span>
              <div>
                <p className="text-sm font-medium text-pw-ink">Printed &amp; packed in Cape Town</p>
                <p className="mt-0.5 text-xs text-pw-ink/75">You&apos;ll receive an email once your order is on the press and ready to ship.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pw-accent-soft text-xs font-semibold text-pw-accent">3</span>
              <div>
                <p className="text-sm font-medium text-pw-ink">Dispatched within 72 hours</p>
                <p className="mt-0.5 text-xs text-pw-ink/75">Your tracking number is emailed as soon as your order leaves our facility. All SA deliveries are insured.</p>
              </div>
            </li>
          </ol>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-pw bg-pw-ink px-6 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
        >
          Back to home
        </Link>
      </div>
    </PageContainer>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <PageContainer>
        <div className="mx-auto max-w-xl rounded-pw-card border border-pw-stone bg-pw-surface p-8 text-center shadow-pw-sm">
          <p className="text-pw-muted">Loading&hellip;</p>
        </div>
      </PageContainer>
    }>
      <SuccessContent />
    </Suspense>
  );
}
