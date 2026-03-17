"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const SAMPLE_PRICE_CENTS = 30_000; // R300

const MATERIALS = [
  {
    name: "Woven fabric",
    desc: "Our most popular substrate. Soft texture, rich colour depth, repositionable.",
    tag: "Best seller",
  },
  {
    name: "Non-woven",
    desc: "Paste-the-wall application. Perfectly smooth finish, ideal for large murals.",
    tag: "Easiest install",
  },
  {
    name: "Peel & stick",
    desc: "Renter-friendly. No paste, no damage. Removes cleanly when you're ready.",
    tag: "Renter friendly",
  },
  {
    name: "Textured canvas",
    desc: "Heavy-weight with a subtle linen weave. Hotel and commercial grade.",
    tag: "Premium",
  },
];

export default function SamplesPage() {
  const { addItem, items } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const alreadyInCart = items.some((i) => i.type === "sample_pack");

  function handleAddToCart() {
    if (alreadyInCart) {
      router.push("/cart");
      return;
    }
    addItem({ type: "sample_pack", quantity: 1, subtotalCents: SAMPLE_PRICE_CENTS });
    setAdded(true);
  }

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { label: "Sample Swatch Pack" },
        ]}
      />

      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-pw-accent">
            Not sure which material to choose?
          </p>
          <h1 className="text-3xl font-bold text-pw-ink sm:text-4xl">
            Sample Swatch Pack
          </h1>
          <p className="mt-4 text-pw-muted leading-relaxed">
            Feel the difference before you commit. We print and ship a real A5 swatch of every material we offer — using the same commercial press that prints your final order. Touch it, hold it to your wall, see how light hits it.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">

          {/* Left: product card */}
          <div className="lg:col-span-3">

            {/* Swatch preview */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-pw-card overflow-hidden" style={{ height: 260 }}>
              <div className="rounded-tl-pw-card" style={{ background: "linear-gradient(135deg, #8b7355 0%, #6b543c 30%, #4a3728 60%, #7c6245 100%)" }} />
              <div className="rounded-tr-pw-card" style={{
                background: "#c5beaa",
                backgroundImage: "repeating-linear-gradient(30deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px), repeating-linear-gradient(-30deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px)"
              }} />
              <div className="rounded-bl-pw-card" style={{
                background: "#2e2a26",
                backgroundImage: "radial-gradient(circle at 20% 30%, rgba(196,98,45,0.5) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(196,98,45,0.3) 0%, transparent 25%)"
              }} />
              <div className="rounded-br-pw-card" style={{
                background: "linear-gradient(160deg, #5c4a3c 0%, #3d2e24 50%, #6b5141 100%)"
              }} />
            </div>

            {/* Materials list */}
            <ul className="space-y-3">
              {MATERIALS.map((m) => (
                <li
                  key={m.name}
                  className="flex items-start gap-3 rounded-pw-card border border-pw-stone bg-pw-surface p-4"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pw-accent-soft">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-pw-ink">{m.name}</p>
                      <span className="rounded-full bg-pw-accent-soft px-2 py-0.5 text-xs text-pw-accent">
                        {m.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-pw-muted">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: purchase panel */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-pw-card border border-pw-stone bg-pw-surface p-6 shadow-pw-sm">

              <div className="mb-5 border-b border-pw-stone pb-5">
                <p className="text-xs font-medium uppercase tracking-widest text-pw-muted">Sample Swatch Pack</p>
                <p className="mt-1 text-3xl font-bold text-pw-ink">R 300</p>
                <p className="mt-1 text-sm text-pw-muted">
                  Shipping included · Delivered in 3–5 days
                </p>
              </div>

              <ul className="mb-6 space-y-2 text-sm text-pw-muted">
                <li className="flex items-center gap-2">
                  <span className="text-pw-accent">✓</span> A5 swatch of all 4 materials
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pw-accent">✓</span> Printed on the same press as your order
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pw-accent">✓</span> R300 credited toward your first wallpaper order
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-pw-accent">✓</span> Ships nationwide, fully tracked
                </li>
              </ul>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full rounded-pw bg-pw-ink py-3 text-sm font-medium text-white transition hover:bg-pw-ink-soft"
              >
                {alreadyInCart
                  ? "View in cart →"
                  : added
                  ? "Added — view in cart →"
                  : "Add to cart — R300"}
              </button>

              {added && !alreadyInCart && (
                <Link
                  href="/cart"
                  className="mt-3 block text-center text-sm text-pw-muted underline underline-offset-2 hover:text-pw-ink"
                >
                  View cart
                </Link>
              )}

              <p className="mt-4 text-center text-xs text-pw-muted">
                Already ordered? The R300 is automatically credited against your next custom wallpaper order.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-pw-card border border-pw-stone bg-pw-stone p-8 text-center">
          <p className="text-sm font-medium text-pw-ink">Already know what you want?</p>
          <p className="mt-1 text-sm text-pw-muted">Skip the swatches and go straight to your custom wallpaper.</p>
          <Link
            href="/config"
            className="mt-4 inline-flex items-center gap-2 rounded-pw bg-pw-ink px-6 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
          >
            Start designing
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/15 text-xs">↗</span>
          </Link>
        </div>

      </div>
    </PageContainer>
  );
}
