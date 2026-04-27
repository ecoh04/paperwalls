"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ── Real signals only — no fabricated review counts or ratings. ────────────
const TRUST_SIGNALS = [
  { label: "Made-to-order in Cape Town" },
  { label: "Free shipping nationwide" },
  { label: "72-hour production turnaround" },
  { label: "DIY guide or pro installer" },
];

const PROCESS_STEPS = [
  {
    num:   "01",
    title: "Send us your image",
    body:  "A photo from your phone, an artwork you scanned, a pattern you bought. Any high-resolution JPG, PNG, or WebP works — we'll flag the file's resolution against your wall size before you check out.",
  },
  {
    num:   "02",
    title: "Set your wall size",
    body:  "Width and height in centimetres, edge to edge. We cut every order to your exact measurements — there are no standard rolls. Multi-wall orders are configured one wall at a time.",
  },
  {
    num:   "03",
    title: "Choose how it sticks",
    body:  "Traditional wallpaper for permanence and clean seams, or peel-and-stick for renters and rooms you might change. Three finishes — satin, matte, or linen — each affecting how light moves on the wall.",
  },
  {
    num:   "04",
    title: "We print and ship",
    body:  "Your order goes through our commercial press within 72 hours of payment. Panels arrive rolled, labelled in hanging order, with a substrate-specific install guide. Free nationwide.",
  },
];

const FINISHES = [
  {
    name:        "Satin",
    desc:        "A subtle sheen with deep colour. The most forgiving finish — wipes clean, suits most lights, sits comfortably in living rooms and family spaces.",
    rangeFromTo: "R410 – R490",
    bestFor:     "All-rounder",
  },
  {
    name:        "Matte",
    desc:        "Completely flat, non-reflective. Renders fine detail without glare and reads like fine art on the wall. The right pick for bright rooms with strong light.",
    rangeFromTo: "R470 – R540",
    bestFor:     "Bright rooms",
  },
  {
    name:        "Linen",
    desc:        "A textured, fabric-like surface that catches light and adds depth. The most premium of the three — designed to feel like a chosen material, not wallpaper.",
    rangeFromTo: "R590 – R680",
    bestFor:     "Statement walls",
  },
];

const GALLERY = [
  {
    span:        "lg:col-span-2 lg:row-span-2",
    aspectRatio: "1/1",
    prompt:      "Editorial living-room photograph, custom large-scale botanical wallpaper as the wall behind a low-profile linen sofa. A vintage rug, a small ceramic side table, two oversized linen cushions. Late afternoon golden light, white-washed plaster perimeter walls, oak floors. Apartmento magazine style, photorealistic, no people.",
    dimensions:  "1600×1600",
  },
  {
    span:        "",
    aspectRatio: "3/4",
    prompt:      "Editorial bedroom photograph, custom abstract-watercolour wallpaper as the headboard wall, linen-upholstered bed, tan leather throw pillows, vintage ceramic bedside lamp, an open book. Soft morning light from a side window, oak floors. Aesop / Kinfolk warmth, photorealistic, no people.",
    dimensions:  "900×1200",
  },
  {
    span:        "",
    aspectRatio: "3/4",
    prompt:      "Editorial home-office photograph, custom modern art-painting wallpaper behind a clean walnut desk. A linen-upholstered chair, a brass desk lamp, a small succulent, an open notebook. Bright soft natural light from a left-side window, warm stone perimeter walls. Apartmento warmth, photorealistic, no people.",
    dimensions:  "900×1200",
  },
  {
    span:        "",
    aspectRatio: "3/4",
    prompt:      "Editorial entryway photograph, custom geometric-line wallpaper on a long hallway wall. A thin oak console table with a single ceramic vase, a small abstract framed artwork, terrazzo floor tile, soft natural light from a high window. Aesop store interior style, photorealistic, no people.",
    dimensions:  "900×1200",
  },
  {
    span:        "",
    aspectRatio: "3/4",
    prompt:      "Editorial stairwell photograph, dramatic full-height custom-printed mountain landscape wallpaper running floor to ceiling along the staircase wall. Dark oak hardwood treads, brass handrail, soft skylight from above. Premium hotel-lobby mood, no people, photorealistic.",
    dimensions:  "900×1200",
  },
];

const FAQ = [
  {
    q: "Do I need design software or special files?",
    a: "No. If you have a photo on your phone, you have everything you need. Upload any JPG, PNG, or WebP and we handle the print setup from there.",
  },
  {
    q: "What if my image isn't high-resolution enough?",
    a: "We check resolution against your chosen wall dimensions before you pay. If the file is too small, we tell you upfront and suggest a smaller wall or a sharper image.",
  },
  {
    q: "How do I measure my wall correctly?",
    a: "Width × height in centimetres, edge to edge at the widest and tallest points. We cut every order to the millimetre — measure twice. There's a step-by-step guide in How it works.",
  },
  {
    q: "I rent — will peel-and-stick damage the walls?",
    a: "No. Our peel-and-stick removes cleanly from painted plaster without leaving residue. It can also be repositioned if you need to adjust after hanging.",
  },
  {
    q: "How long does delivery take after I order?",
    a: "72 hours through our press from payment confirmation, then 2–4 business days for nationwide delivery. You receive a tracking number when it ships.",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustRibbon />
      <ProcessSection />
      <FinishesSection />
      <GallerySection />
      <ReassuranceSection />
      <FAQSection />
      <ClosingCTA />
    </>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-pw-bg">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-32">
        {/* Copy column */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <Eyebrow>Custom wallpaper · Made to order in Cape Town</Eyebrow>
          <h1 className="pw-display mt-5 text-pw-ink">
            Your image.<br />
            <em className="text-pw-accent">Your wall.</em>
          </h1>
          <p className="pw-body-lg mt-6 max-w-lg text-pw-ink/70">
            Upload any photo, pattern, or artwork. We print it on commercial-grade
            substrate, cut it to your wall's exact measurements, and ship it free
            across South Africa.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button href="/config" variant="primary" size="lg">
              Design your wallpaper
            </Button>
            <Button href="/samples" variant="ghost" size="md">
              Order a sample pack first
            </Button>
          </div>

          {/* Hero trust dividers */}
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-pw-stone pt-8 sm:grid-cols-4">
            {[
              { num: "72hr",  label: "Print to dispatch" },
              { num: "Free",  label: "Nationwide shipping" },
              { num: "Any",   label: "Wall size, exact" },
              { num: "100%",  label: "Made in Cape Town" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <dt className="pw-h3 text-pw-ink">{item.num}</dt>
                <dd className="pw-overline text-pw-muted">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Image column */}
        <div className="lg:col-span-6">
          <ImagePlaceholder
            aspectRatio="4/5"
            dimensions="1600×2000"
            prompt="Editorial interior photograph — modern Cape Town apartment living room with a custom-printed botanical-pattern wallpaper as the focal feature wall. Soft warm afternoon light streaming through tall west-facing windows. Curved bouclé sofa in oat colour in the foreground, a low travertine coffee table with two stacked linen-bound books, a vintage brass floor lamp. Warm white-washed plaster on the perimeter walls, oak herringbone floors. Composition: portrait orientation, eye level, the wallpaper occupies the full frame behind the sofa. Mood: Apartmento magazine, Aesop store interior, Kinfolk warmth. Photorealistic, no people, sharp focus, very subtle film grain."
            className="shadow-pw-md"
          />
        </div>
      </div>
    </section>
  );
}

// ── Trust ribbon ───────────────────────────────────────────────────────────
function TrustRibbon() {
  return (
    <div className="border-y border-pw-stone bg-pw-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-10 gap-y-3 px-6 py-5 sm:px-8 lg:px-12">
        {TRUST_SIGNALS.map((s) => (
          <span key={s.label} className="pw-small font-medium text-pw-ink/80">
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Process ────────────────────────────────────────────────────────────────
function ProcessSection() {
  return (
    <Section tone="bg" id="how">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="The process"
            title={<>Four steps. <em>That's it.</em></>}
            body="No design experience, no trade account, no minimums. Just your image, your dimensions, and a clear price before you check out."
          />
        </div>
        <div className="lg:col-span-8">
          <ol className="grid gap-px overflow-hidden rounded-pw-card border border-pw-stone bg-pw-stone sm:grid-cols-2">
            {PROCESS_STEPS.map((step) => (
              <li key={step.num} className="flex flex-col gap-3 bg-pw-surface p-7 sm:p-8">
                <span className="pw-overline text-pw-accent">Step {step.num}</span>
                <h3 className="pw-h3 text-pw-ink">{step.title}</h3>
                <p className="pw-body text-pw-ink/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

// ── Finishes (real SKU taxonomy) ──────────────────────────────────────────
function FinishesSection() {
  return (
    <Section tone="surface" id="finishes">
      <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Three finishes · Two application types"
          title={<>Pick how it <em>feels</em>. Then how it <em>sticks</em>.</>}
          body="Every order goes through the same commercial press. The choice is finish — how the surface catches light — and application method, which decides whether you're committing to the wall or keeping options open."
        />
      </div>

      {/* Finish cards */}
      <div className="grid gap-px overflow-hidden rounded-pw-card border border-pw-stone bg-pw-stone md:grid-cols-3">
        {FINISHES.map((f, i) => (
          <article key={f.name} className="flex flex-col bg-pw-surface p-7 sm:p-8">
            <ImagePlaceholder
              aspectRatio="4/3"
              dimensions="1200×900"
              prompt={
                f.name === "Satin"
                  ? "Macro detail photograph of premium satin-finish printed wallpaper, soft sheen catching warm side-light from the right, subtle grain texture, neutral cream base with terracotta brushwork visible in the print, sharp focus, no people."
                  : f.name === "Matte"
                  ? "Macro detail of matte-finish wallpaper, completely flat non-reflective surface, deep colour saturation, oat-and-clay tonal print pattern visible, soft natural light, sharp focus, no people."
                  : "Macro detail of linen-textured wallpaper, visible woven fabric grain pattern, warm stone tones, side-light revealing the surface relief, premium hotel-lobby material feel, sharp focus, no people."
              }
              gradient={
                i === 0 ? "linear-gradient(135deg, #E8DFD2 0%, #C4A78A 60%, #8C6F58 100%)"
                : i === 1 ? "linear-gradient(135deg, #DDD3C5 0%, #B5A795 100%)"
                : "linear-gradient(135deg, #D4C9BE 0%, #A38C72 50%, #6B543C 100%)"
              }
              className="mb-6"
            />
            <span className="pw-overline text-pw-accent">{f.bestFor}</span>
            <h3 className="pw-h3 mt-3 text-pw-ink">{f.name}</h3>
            <p className="pw-body mt-3 text-pw-ink/70 flex-1">{f.desc}</p>
            <div className="mt-6 flex items-baseline justify-between border-t border-pw-stone pt-5">
              <span className="pw-small text-pw-muted">Price per m²</span>
              <span className="font-serif text-xl text-pw-ink">{f.rangeFromTo}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Application explainer */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <article className="rounded-pw-card border border-pw-stone bg-pw-bg p-7 sm:p-8">
          <Eyebrow variant="muted">Application 1</Eyebrow>
          <h3 className="pw-h3 mt-3 text-pw-ink">Traditional</h3>
          <p className="pw-body mt-3 text-pw-ink/70">
            Paste-the-wall application. Permanent, with the cleanest seams — the way wallpaper is supposed to look. Best for feature walls, commercial spaces, and rooms you're committing to.
          </p>
        </article>
        <article className="rounded-pw-card border border-pw-stone bg-pw-bg p-7 sm:p-8">
          <Eyebrow variant="muted">Application 2</Eyebrow>
          <h3 className="pw-h3 mt-3 text-pw-ink">Peel &amp; Stick</h3>
          <p className="pw-body mt-3 text-pw-ink/70">
            Self-adhesive backing. Repositionable while you hang it, removes cleanly when you're done. The right choice for renters or anyone who wants the option to change later.
          </p>
        </article>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button href="/config" variant="primary" size="lg">See live pricing in the configurator</Button>
        <Link href="/samples" className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors">
          Or order a sample pack first
        </Link>
      </div>
    </Section>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────
function GallerySection() {
  return (
    <Section tone="bg" id="gallery">
      <SectionHeader
        eyebrow="In real rooms"
        title={<>Walls that <em>make</em> the room.</>}
        body="Every print is unique to the customer who ordered it — your image, your size, your wall."
      />
      <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {GALLERY.map((g, i) => (
          <ImagePlaceholder
            key={i}
            aspectRatio={g.aspectRatio}
            dimensions={g.dimensions}
            prompt={g.prompt}
            className={g.span}
          />
        ))}
      </div>
    </Section>
  );
}

// ── Reassurance trio ──────────────────────────────────────────────────────
function ReassuranceSection() {
  return (
    <Section tone="surface" density="default">
      <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
        {[
          {
            title: "Printed in Cape Town",
            body:  "Our own press, our own people, our own quality control. No imported rolls, no third-party fulfilment, no surprises in the box.",
          },
          {
            title: "Cut to your wall",
            body:  "We cut every order to the millimetre based on the dimensions you submit. There are no standard sizes — the price you see is for the wall you measured.",
          },
          {
            title: "Defects, on us",
            body:  "If anything ships imperfect — banding, colour shift, transit damage — we reprint at no cost. Send a photo within 7 days and we sort it within 48 hours.",
          },
        ].map((card) => (
          <div key={card.title} className="flex flex-col gap-4">
            <h3 className="pw-h3 text-pw-ink">{card.title}</h3>
            <p className="pw-body text-pw-ink/70">{card.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Section tone="bg" id="faq">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Common questions"
            title={<>The five things <em>everyone</em> asks.</>}
            body={
              <>
                Still unsure?{" "}
                <Link href="/contact" className="text-pw-accent underline underline-offset-[5px] decoration-pw-accent/40 hover:decoration-pw-accent">
                  Get in touch
                </Link>
                {" "}and we'll talk through your project.
              </>
            }
          />
        </div>
        <ul className="lg:col-span-8 divide-y divide-pw-stone border-y border-pw-stone">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left hover:text-pw-ink transition-colors"
                >
                  <span className="pw-h3 text-pw-ink">{item.q}</span>
                  <span
                    className={[
                      "shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-pw-stone text-pw-ink transition-transform",
                      isOpen ? "rotate-45 bg-pw-accent-soft border-pw-accent text-pw-accent" : "",
                    ].join(" ").trim()}
                    aria-hidden
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <p className="pw-body pb-7 -mt-1 max-w-3xl text-pw-ink/70">{item.a}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ── Closing CTA ───────────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <Section tone="ink" density="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow variant="muted" className="text-pw-accent-mid">Ready when you are</Eyebrow>
          <h2 className="pw-display mt-5 text-white">
            Your image.<br />
            <em className="text-pw-accent-mid">On your wall this week.</em>
          </h2>
          <p className="pw-body-lg mt-6 max-w-xl text-white/65">
            Upload your photo, choose your finish, get a live price in under
            sixty seconds. Printed in Cape Town. Delivered nationwide. No
            account needed to start.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:col-span-5 lg:items-end">
          <Button href="/config" variant="light-on-ink" size="lg">
            Design your wallpaper
          </Button>
          <span className="pw-small text-white/45">
            No payment until you check out · Free shipping nationwide
          </span>
        </div>
      </div>
    </Section>
  );
}
