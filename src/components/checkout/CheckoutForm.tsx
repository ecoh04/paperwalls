"use client";

import { useState, useCallback } from "react";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import type { ShippingProvince } from "@/types/order";
import { PROVINCES } from "@/lib/shipping";
import { getShippingCents } from "@/lib/shipping";
import { formatZar } from "@/lib/pricing";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME = 2;
const MIN_PHONE = 10;

type CheckoutFormProps = {
  items: CartItem[];
  onSuccess: (redirectUrl: string, orderNumbers: string[]) => void;
  onError: (message: string) => void;
};

const emptyAddress: CheckoutAddress = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  province: "gauteng",
  postal_code: "",
};

function validateAddress(a: CheckoutAddress): string | null {
  if (!a.customer_name?.trim() || a.customer_name.trim().length < MIN_NAME)
    return "Please enter your full name.";
  if (!a.customer_email?.trim()) return "Please enter your email.";
  if (!EMAIL_REGEX.test(a.customer_email.trim())) return "Please enter a valid email address.";
  if (!a.customer_phone?.trim()) return "Please enter your phone number.";
  if (a.customer_phone.replace(/\D/g, "").length < MIN_PHONE)
    return "Please enter a valid phone number.";
  if (!a.address_line1?.trim()) return "Please enter your street address.";
  if (!a.city?.trim()) return "Please enter your city.";
  if (!a.province) return "Please select your province.";
  if (!a.postal_code?.trim()) return "Please enter your postal code.";
  return null;
}

export function CheckoutForm({ items, onSuccess, onError }: CheckoutFormProps) {
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const shippingCents = getShippingCents(address.province as ShippingProvince);
  const subtotalCents = items.reduce((s, i) => s + i.subtotalCents, 0);
  const totalCents = subtotalCents + shippingCents;

  const set = useCallback((field: keyof CheckoutAddress, value: string | ShippingProvince) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const err = validateAddress(address);
      if (err) {
        onError(err);
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: {
              ...address,
              address_line2: address.address_line2 || null,
            },
            cart: items,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError(data.error || "Something went wrong. Please try again.");
          return;
        }
        if (!data.redirectUrl) {
          onError("Invalid response from server.");
          return;
        }
        onSuccess(data.redirectUrl, data.orderNumbers || []);
      } catch {
        onError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [address, items, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Contact & delivery</h2>
        <p className="mt-1 text-sm text-stone-600">We’ll use this to confirm your order and ship your wallpaper.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="customer_name" className="block text-sm font-medium text-stone-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_name"
              type="text"
              autoComplete="name"
              value={address.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, customer_name: true }))}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="e.g. Thabo Mbeki"
            />
          </div>
          <div>
            <label htmlFor="customer_email" className="block text-sm font-medium text-stone-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_email"
              type="email"
              autoComplete="email"
              value={address.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="customer_phone" className="block text-sm font-medium text-stone-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_phone"
              type="tel"
              autoComplete="tel"
              value={address.customer_phone}
              onChange={(e) => set("customer_phone", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="e.g. 082 123 4567"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address_line1" className="block text-sm font-medium text-stone-700">
              Street address <span className="text-red-500">*</span>
            </label>
            <input
              id="address_line1"
              type="text"
              autoComplete="street-address"
              value={address.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="House number, street, complex"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address_line2" className="block text-sm font-medium text-stone-700">
              Address line 2 <span className="text-stone-400">(optional)</span>
            </label>
            <input
              id="address_line2"
              type="text"
              autoComplete="address-line2"
              value={address.address_line2}
              onChange={(e) => set("address_line2", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="Unit, building, suburb"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-stone-700">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              value={address.city}
              onChange={(e) => set("city", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="e.g. Johannesburg"
            />
          </div>
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-stone-700">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              value={address.province}
              onChange={(e) => set("province", e.target.value as ShippingProvince)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            >
              {PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-stone-700">
              Postal code <span className="text-red-500">*</span>
            </label>
            <input
              id="postal_code"
              type="text"
              autoComplete="postal-code"
              value={address.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              placeholder="e.g. 2000"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-stone-900 bg-stone-50 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-600">Subtotal</dt>
            <dd className="font-medium text-stone-900">{formatZar(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-600">Shipping</dt>
            <dd className="font-medium text-stone-900">{formatZar(shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-3 text-base">
            <dt className="font-semibold text-stone-900">Total</dt>
            <dd className="font-semibold text-stone-900">{formatZar(totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-stone-500">
          You’ll complete payment securely on the next screen (Stitch Express).
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-stone-900 py-4 font-medium text-white hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Preparing…" : "Proceed to payment"}
        </button>
      </div>
    </form>
  );
}
