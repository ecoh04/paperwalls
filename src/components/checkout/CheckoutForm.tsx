"use client";

import { useState, useCallback } from "react";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import type { ShippingProvince } from "@/types/order";
import { PROVINCES } from "@/lib/shipping";
import { useCart } from "@/contexts/CartContext";
import { Eyebrow } from "@/components/ui/Eyebrow";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME    = 2;
const MIN_PHONE   = 10;

const INPUT_CLASSES =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10";

const LABEL_CLASSES = "pw-overline mb-2 block text-pw-muted";

type CheckoutFormProps = {
  items:      CartItem[];
  sessionId?: string;
  onSuccess:  (payfastUrl: string, fields: Record<string, string>, orderNumbers: string[]) => void;
  onError:    (message: string) => void;
};

const emptyAddress: CheckoutAddress = {
  customer_name:  "",
  customer_email: "",
  customer_phone: "",
  address_line1:  "",
  address_line2:  "",
  city:           "",
  province:       "gauteng",
  postal_code:    "",
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

export function CheckoutForm({ items, sessionId, onSuccess, onError }: CheckoutFormProps) {
  const { identifyCustomer } = useCart();
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((field: keyof CheckoutAddress, value: string | ShippingProvince) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
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
            cart:       items,
            session_id: sessionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          onError(data.error || "Something went wrong. Please try again.");
          return;
        }
        if (!data.payfastUrl || !data.payfastFields) {
          onError("Invalid response from server.");
          return;
        }
        onSuccess(data.payfastUrl, data.payfastFields, data.orderNumbers || []);
      } catch {
        onError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [address, items, sessionId, onSuccess, onError]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
        <Eyebrow>Where to ship it</Eyebrow>
        <h2 className="pw-h3 mt-3 text-pw-ink">Contact and delivery.</h2>
        <p className="pw-small mt-1.5 text-pw-muted">
          We use this to confirm your order, ship your wallpaper, and reach you if anything needs clarifying.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {/* Full name (full width) */}
          <div className="sm:col-span-2">
            <label htmlFor="customer_name" className={LABEL_CLASSES}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_name"
              type="text"
              autoComplete="name"
              value={address.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="Thabo Mbeki"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="customer_email" className={LABEL_CLASSES}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_email"
              type="email"
              autoComplete="email"
              value={address.customer_email}
              onChange={(e) => set("customer_email", e.target.value)}
              onBlur={(e) => {
                const email = e.target.value.trim();
                if (EMAIL_REGEX.test(email)) {
                  identifyCustomer(email, address.customer_name || undefined, address.customer_phone || undefined);
                }
              }}
              className={INPUT_CLASSES}
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="customer_phone" className={LABEL_CLASSES}>
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="customer_phone"
              type="tel"
              autoComplete="tel"
              value={address.customer_phone}
              onChange={(e) => set("customer_phone", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="082 123 4567"
            />
          </div>

          {/* Street address (full width) */}
          <div className="sm:col-span-2">
            <label htmlFor="address_line1" className={LABEL_CLASSES}>
              Street address <span className="text-red-500">*</span>
            </label>
            <input
              id="address_line1"
              type="text"
              autoComplete="street-address"
              value={address.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="House number, street, complex"
            />
          </div>

          {/* Address line 2 (full width, optional) */}
          <div className="sm:col-span-2">
            <label htmlFor="address_line2" className={LABEL_CLASSES}>
              Suburb / unit <span className="text-pw-muted-light">(optional)</span>
            </label>
            <input
              id="address_line2"
              type="text"
              autoComplete="address-line2"
              value={address.address_line2}
              onChange={(e) => set("address_line2", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="Unit, building, suburb"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className={LABEL_CLASSES}>
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              value={address.city}
              onChange={(e) => set("city", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="Johannesburg"
            />
          </div>

          {/* Province */}
          <div>
            <label htmlFor="province" className={LABEL_CLASSES}>
              Province <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              value={address.province}
              onChange={(e) => set("province", e.target.value as ShippingProvince)}
              className={INPUT_CLASSES}
            >
              {PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Postal code (full width on mobile, half width with city on desktop already handled by grid) */}
          <div className="sm:col-span-2">
            <label htmlFor="postal_code" className={LABEL_CLASSES}>
              Postal code <span className="text-red-500">*</span>
            </label>
            <input
              id="postal_code"
              type="text"
              autoComplete="postal-code"
              value={address.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className={INPUT_CLASSES}
              placeholder="2000"
            />
          </div>
        </div>

        <p className="pw-small mt-6 text-pw-muted-light">
          Free delivery anywhere in South Africa. Province is used for delivery routing only.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-pw bg-pw-ink pw-body font-semibold text-white transition-colors hover:bg-pw-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Preparing your order…" : "Continue to payment"}
      </button>

      <p className="pw-small text-center text-pw-muted">
        You&rsquo;ll complete payment securely with PayFast on the next screen. We never store card details.
      </p>
    </form>
  );
}
