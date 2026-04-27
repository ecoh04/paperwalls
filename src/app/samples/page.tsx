"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

const SAMPLE_PRICE_CENTS = 30_000; // R300

const FINISHES = [
  {
    name:        "Satin",
    sub:         "Subtle sheen, easy clean",
    description: "Soft sheen, deep colour. Wipes clean. Sits comfortably in living rooms and family spaces.",
    image:       "/images/product/pdp-07-satin.jpg",
  },
  {
    name:        "Matte",
    sub:         "Flat, non-reflective",
    description: "Completely flat, no glare. Renders fine detail without reflection. Best in bright rooms.",
    image:       "/images/product/pdp-08-matte.jpg",
    tag:         "Most ordered",
  },
  {
    name:        "Linen",
    sub:         "Textured, premium feel",
    description: "Fabric-like weave, catches light. Adds tactile depth. Designed to feel chosen, not generic.",
    image:       "/images/product/pdp-09-linen.jpg",
    tag:         "Most premium",
  },
];

const INCLUDES = [
  "A5 swatch of every finish, printed on our commercial press",
  "Free nationwide delivery, fully tracked",
  "Delivered in 3 to 5 business days",
  "R150 credited to your wallpaper order when you come back",
];

export default function SamplesPage() {
  const { addItem, items, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const alreadyInCart = items.some((i) => i.type === "sample_pack");

  function handleAddToCart() {
    if (alreadyInCart) {
      // Open the drawer instead of navigating, so the buyer sees what's
      // already in the cart without leaving /samples.
      openCart();
      return;
    }
    // addItem auto-opens the drawer via CartContext.
    addItem({ type: "sample_pack", quantity: 1, subtotalCents: SAMPLE_PRICE_CENTS });
    setAdded(true);
  }

  return (
    <main className="bg-pw-bg">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <Section tone="bg" density="tight">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            <Eyebrow>Sample pack</Eyebrow>
            <h1 className="pw-display mt-3 text-pw-ink sm:mt-4">
              Hold it before<br />you commit.
            </h1>
            <p className="pw-body-lg mt-4 max-w-md text-pw-ink/70 sm:mt-5">
              An A5 swatch of every finish on the same commercial press that prints
              your wallpaper. Touch it, hold it to the wall, see how the light hits.
            </p>
          </div>
          <div className="lg:col-span-6">
            <ImagePlaceholder
              src="/images/product/pdp-14-sample.jpg"
              aspectRatio="4/3"
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              prompt="PaperWalls sample pack flat-lay with three finish swatches and kraft envelope"
            />
          </div>
        </div>
      </Section>

      {/* ── Three finishes (matches PDP and configurator) ─────────────── */}
      <Section tone="surface" id="finishes">
        <SectionHeader
          eyebrow="Three finishes"
          title="Same press, three surfaces."
          body="Every order goes through the same machine. The choice is finish, how the surface catches light, and how it feels under your hand."
        />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {FINISHES.map((f) => (
            <article
              key={f.name}
              className="flex flex-col overflow-hidden rounded-pw-card border border-pw-stone bg-pw-bg"
            >
              <div className="relative">
                <ImagePlaceholder
                  src={f.image}
                  aspectRatio="4/3"
                  prompt={`${f.name} finish texture macro`}
                />
                {f.tag && (
                  <span className="pw-overline absolute left-4 top-4 rounded-full bg-pw-ink px-3 py-1 text-white">
                    {f.tag}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="pw-h3 text-pw-ink">{f.name}</h3>
                  <span className="pw-small whitespace-nowrap text-pw-muted">{f.sub}</span>
                </div>
                <p className="pw-body mt-3 text-pw-ink/70">{f.description}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── Buy panel + what's included ─────────────────────────────── */}
      <Section tone="bg" id="buy">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-16">

          {/* What's included */}
          <div className="lg:col-span-7">
            <Eyebrow>What's in the pack</Eyebrow>
            <h2 className="pw-h2 mt-3 text-pw-ink sm:mt-4">
              Four reasons it's R150 well spent.
            </h2>
            <ul className="mt-7 space-y-5">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pw-accent-soft"
                  >
                    <svg className="h-3 w-3 text-pw-accent" fill="none" viewBox="0 0 10 10">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="pw-body text-pw-ink/80">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Sticky purchase panel (desktop sticky, normal flow on mobile) */}
          <div className="lg:col-span-5">
            <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8 lg:sticky lg:top-[7rem]">
              <Eyebrow variant="muted">Sample pack</Eyebrow>
              <p className="pw-h1 mt-3 text-pw-ink">R150</p>
              <p className="pw-small mt-1 text-pw-muted">
                Free delivery, 3 to 5 business days.
              </p>

              <div className="mt-6">
                {alreadyInCart ? (
                  <Button href="/cart" variant="primary" size="lg" className="w-full">
                    View in cart
                  </Button>
                ) : added ? (
                  <Button href="/cart" variant="primary" size="lg" className="w-full">
                    Added. View in cart
                  </Button>
                ) : (
                  <Button onClick={handleAddToCart} variant="primary" size="lg" className="w-full">
                    Add to cart
                  </Button>
                )}
              </div>

              <p className="pw-small mt-4 text-center text-pw-muted">
                The R150 credits to your wallpaper order when you come back.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <Section tone="ink" density="default" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Already decided?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Skip the swatches.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Drop in your image, set your wall size, get a live price in under sixty seconds.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <span className="pw-small text-center text-white/45 lg:text-right">
              No payment until you approve the price.
            </span>
          </div>
        </div>
      </Section>
    </main>
  );
}
