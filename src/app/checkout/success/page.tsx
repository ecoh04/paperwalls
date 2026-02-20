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
      <div className="mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-stone-900">Thank you for your order</h1>
        <p className="mt-2 text-stone-600">
          We’ve received your payment and will start preparing your wallpaper.
        </p>
        {orderNumbers.length > 0 && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4 text-left">
            <p className="text-sm font-medium text-stone-700">Order number(s)</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-stone-900">
              {orderNumbers.map((num) => (
                <li key={num}>{num}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-500">
              We’ll send a confirmation email shortly. Keep this number for tracking.
            </p>
          </div>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
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
        <div className="mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-600">Loading…</p>
        </div>
      </PageContainer>
    }>
      <SuccessContent />
    </Suspense>
  );
}
