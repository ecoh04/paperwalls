"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
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
        Enter your details below. You’ll complete payment securely with PayFast.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <CheckoutForm items={items} sessionId={sessionId} onSuccess={handleSuccess} onError={handleError} />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-1">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Your order</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 border-b border-stone-100 pb-3 last:border-0">
                  {item.type === "sample_pack" ? (
                    <>
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border border-stone-200 bg-stone-100">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
                          <rect x="3" y="3" width="12" height="12" rx="2.5" fill="#C4622D" />
                          <rect x="17" y="3" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.45" />
                          <rect x="3" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.25" />
                          <rect x="17" y="17" width="12" height="12" rx="2.5" fill="#C4622D" opacity="0.12" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-stone-900">Sample Swatch Pack</p>
                        <p className="text-xs text-stone-500">All 4 materials · Qty: {item.quantity}</p>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                  <p className="text-sm font-semibold text-stone-900">{formatZar(item.subtotalCents)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-stone-500">
              Prices shown exclude shipping. Shipping is added on the next step based on your delivery address.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-stone-500">
        <Link href="/cart" className="underline hover:no-underline">← Back to cart</Link>
      </p>
    </PageContainer>
  );
}
