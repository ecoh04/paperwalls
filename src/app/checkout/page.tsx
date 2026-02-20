"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { formatZar } from "@/lib/pricing";

export default function CheckoutPage() {
  const { items } = useCart();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((redirectUrl: string) => {
    setError(null);
    window.location.href = redirectUrl;
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
  }, []);

  if (items.length === 0) {
    return (
      <PageContainer>
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/cart", label: "Cart" },
            { label: "Checkout" },
          ]}
        />
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center">
          <h1 className="text-xl font-semibold text-stone-900">Your cart is empty</h1>
          <p className="mt-2 text-stone-600">Add a design from the configurator, then return to checkout.</p>
          <Link
            href="/config"
            className="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
          >
            Design your wallpaper
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/cart", label: "Cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="text-3xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-2 text-stone-600">
        Enter your details below. You’ll complete payment securely with Stitch Express.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm items={items} onSuccess={handleSuccess} onError={handleError} />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Your order</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-stone-100 pb-3 last:border-0">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-100">
                    <img
                      src={item.imageDataUrls?.[0] ?? item.imageDataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">Custom wallpaper</p>
                    <p className="text-xs text-stone-500">
                      {item.walls?.length
                        ? item.walls.map((w, i) => `Wall ${i + 1}: ${w.widthM}×${w.heightM} m`).join(" · ")
                        : `${item.widthM}×${item.heightM} m${item.wallCount > 1 ? ` × ${item.wallCount}` : ""}`}
                      {" "}· {item.totalSqm.toFixed(1)} m² · {item.style}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">{formatZar(item.subtotalCents)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-stone-500">
        <Link href="/cart" className="underline hover:no-underline">← Back to cart</Link>
      </p>
    </PageContainer>
  );
}
