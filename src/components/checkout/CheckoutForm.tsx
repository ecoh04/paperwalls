"use client";

import { useState, useCallback } from "react";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import type { ShippingProvince } from "@/types/order";
import { PROVINCES } from "@/lib/shipping";
import { useCart } from "@/contexts/CartContext";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { track, flushNow } from "@/lib/analytics";
import { metaPixelTrack } from "@/components/MetaPixel";
import { mintEventId } from "@/lib/meta/event-id";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME    = 2;
const MIN_PHONE   = 10;

// Border colour is set per-branch (not appended) so the error red reliably
// overrides the default stone border instead of fighting it in the cascade.
const INPUT_BASE =
  "block w-full rounded-pw border bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:bg-pw-surface focus:outline-none focus:ring-2";
const inputClass = (hasError: boolean) =>
  hasError
    ? `${INPUT_BASE} border-red-400 focus:border-red-500 focus:ring-red-100`
    : `${INPUT_BASE} border-pw-stone focus:border-pw-ink focus:ring-pw-ink/10`;

const LABEL_CLASSES = "pw-overline mb-2 block text-pw-muted";

// Read a browser cookie. Used for Meta's _fbp/_fbc, which we forward to the
// server so the CAPI Purchase/InitiateCheckout events match at high quality.
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export type CheckoutCreateResult = {
  payfastUrl:    string;
  payfastFields: Record<string, string>;
  orderNumbers:  string[];
};

type CheckoutFormProps = {
  items:      CartItem[];
  sessionId?: string;
  onSuccess:  (result: CheckoutCreateResult) => void;
  onError:    (message: string) => void;
};

type FieldErrors = Partial<Record<keyof CheckoutAddress, string>>;

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

// Validate ALL fields and return a per-field map, so every problem is shown
// inline at once. Messages are short, plain, and tell the buyer exactly what
// to do — a confused buyer at checkout is a lost buyer.
function validateAddress(a: CheckoutAddress): FieldErrors {
  const e: FieldErrors = {};
  if (!a.customer_name?.trim() || a.customer_name.trim().length < MIN_NAME)
    e.customer_name = "Enter your full name.";
  if (!a.customer_email?.trim())
    e.customer_email = "Enter your email so we can confirm your order.";
  else if (!EMAIL_REGEX.test(a.customer_email.trim()))
    e.customer_email = "That email doesn’t look right — check for typos.";
  if (!a.customer_phone?.trim())
    e.customer_phone = "Enter a phone number for delivery updates.";
  else if (a.customer_phone.replace(/\D/g, "").length < MIN_PHONE)
    e.customer_phone = "Enter a valid phone number (at least 10 digits).";
  if (!a.address_line1?.trim())
    e.address_line1 = "Enter your street address.";
  if (!a.city?.trim())
    e.city = "Enter your city or town.";
  if (!a.postal_code?.trim())
    e.postal_code = "Enter your postal code.";
  return e;
}

// Order to scan when focusing the first error.
const FIELD_ORDER: (keyof CheckoutAddress)[] = [
  "customer_name", "customer_email", "customer_phone",
  "address_line1", "city", "postal_code",
];

export function CheckoutForm({ items, sessionId, onSuccess, onError }: CheckoutFormProps) {
  const { identifyCustomer } = useCart();
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = useCallback((field: keyof CheckoutAddress, value: string | ShippingProvince) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear this field's error as soon as the buyer starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const fieldErrors = validateAddress(address);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        // Take the buyer straight to the first thing to fix — no hunting.
        const first = FIELD_ORDER.find((f) => fieldErrors[f]);
        if (first && typeof document !== "undefined") {
          const el = document.getElementById(first);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          (el as HTMLElement | null)?.focus?.({ preventScroll: true });
        }
        return;
      }
      setErrors({});
      setSubmitting(true);

      const totalCents = items.reduce((s, i) => s + i.subtotalCents, 0);
      track("checkout.submitted", {
        item_count:  items.length,
        total_cents: totalCents,
      });
      flushNow();

      // Meta Pixel: InitiateCheckout. The same event_id rides through to
      // the server in the request body so the CAPI fired by the API route
      // dedupes against this pixel event.
      const checkoutEventId = mintEventId("InitiateCheckout");
      metaPixelTrack("InitiateCheckout", {
        event_id:     checkoutEventId,
        value_cents:  totalCents,
        currency:     "ZAR",
        num_items:    items.length,
        content_type: "product",
        content_ids:  items.map((i) => i.type === "sample_pack" ? "sample_pack" : "custom_wallpaper"),
      });

      try {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: {
              ...address,
              address_line2: address.address_line2 || null,
            },
            cart:               items,
            session_id:         sessionId,
            meta_event_id_init: checkoutEventId,
            fbp:                readCookie("_fbp"),
            fbc:                readCookie("_fbc"),
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
        onSuccess({
          payfastUrl:    data.payfastUrl,
          payfastFields: data.payfastFields,
          orderNumbers:  data.orderNumbers || [],
        });
      } catch {
        onError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [address, items, sessionId, onSuccess, onError]
  );

  // Inline error message under a field.
  const FieldError = ({ field }: { field: keyof CheckoutAddress }) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-600">
        <svg aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
              className={inputClass(!!errors.customer_name)}
              aria-invalid={!!errors.customer_name}
              aria-describedby={errors.customer_name ? "customer_name-error" : undefined}
              placeholder="Your full name"
            />
            <FieldError field="customer_name" />
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
              className={inputClass(!!errors.customer_email)}
              aria-invalid={!!errors.customer_email}
              aria-describedby={errors.customer_email ? "customer_email-error" : undefined}
              placeholder="your@email.com"
            />
            <FieldError field="customer_email" />
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
              className={inputClass(!!errors.customer_phone)}
              aria-invalid={!!errors.customer_phone}
              aria-describedby={errors.customer_phone ? "customer_phone-error" : undefined}
              placeholder="082 123 4567"
            />
            <FieldError field="customer_phone" />
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
              className={inputClass(!!errors.address_line1)}
              aria-invalid={!!errors.address_line1}
              aria-describedby={errors.address_line1 ? "address_line1-error" : undefined}
              placeholder="House number, street, complex"
            />
            <FieldError field="address_line1" />
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
              className={inputClass(false)}
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
              className={inputClass(!!errors.city)}
              aria-invalid={!!errors.city}
              aria-describedby={errors.city ? "city-error" : undefined}
              placeholder="Johannesburg"
            />
            <FieldError field="city" />
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
              className={inputClass(false)}
            >
              {PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Postal code (full width) */}
          <div className="sm:col-span-2">
            <label htmlFor="postal_code" className={LABEL_CLASSES}>
              Postal code <span className="text-red-500">*</span>
            </label>
            <input
              id="postal_code"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              value={address.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              className={inputClass(!!errors.postal_code)}
              aria-invalid={!!errors.postal_code}
              aria-describedby={errors.postal_code ? "postal_code-error" : undefined}
              placeholder="2000"
            />
            <FieldError field="postal_code" />
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
        You&rsquo;ll complete payment securely with PayFast on the next screen.
      </p>
    </form>
  );
}
