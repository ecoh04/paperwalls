"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ── Section flow (CRO-ordered, mobile-first) ──────────────────────────────
//   1. Hero            — value prop + primary CTA + secondary CTA + visual
//   2. Process          — 3-step visual story (reduces ordering friction)
//   3. Gallery          — proof through real installs (build belief early)
//   4. Finishes & price — buy-box with anchor pricing
//   5. Sample-pack rail — secondary path for the considered buyer
//   6. Why PaperWalls   — 3 brand differentiators
//   7. FAQ              — objection handling
//   8. Closing CTA      — dark, single decisive ask

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProcessSection />
      <GallerySection />
      <FinishesSection />
      <SamplePackRail />
      <WhyPaperWalls />
      <FAQSection />
      <ClosingCTA />
    </>
  );
}

// ── 1. Hero ────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-pw-bg">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-14 sm:gap-12 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-28">
        {/* Image — appears AFTER copy on mobile (better for scanning); BEFORE on desktop via order */}
        <div className="order-2 lg:order-2 lg:col-span-7">
          <ImagePlaceholder
            aspectRatio="4/5"
            dimensions="1600×2000"
            // src="/images/home/hero.jpg"
            prompt="Editorial interior — modern Cape Town apartment living room, custom-printed botanical wallpaper as the focal feature wall behind a curved oat-bouclé sofa. Soft warm afternoon light from a tall west-facing window. Low travertine coffee table with stacked linen-bound books, a vintage brass floor lamp. Warm white-washed plaster on perimeter walls, oak herringbone floors. Composition: portrait, eye-level, wallpaper occupies the full frame behind the sofa. Mood: Apartmento magazine, Aesop store interior, Kinfolk warmth. Photorealistic, no people, sharp focus, very subtle film grain."
            className="shadow-pw-md"
          />
        </div>

        {/* Copy */}
        <div className="order-1 flex flex-col justify-center lg:order-1 lg:col-span-5">
          <Eyebrow>Custom wallpaper · Made in Cape Town</Eyebrow>
          <h1 className="pw-display mt-4 text-pw-ink sm:mt-5">
            Your image.<br />
            Your wall.
          </h1>
          <p className="pw-body-lg mt-5 max-w-md text-pw-ink/70 sm:mt-6">
            Upload any photo, pattern, or artwork. We print it commercial-grade,
            cut it to your wall&rsquo;s exact size, and ship it free across South Africa.
          </p>

          {/* CTAs — full-width primary on mobile, inline on tablet+ */}
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <Button href="/samples" variant="ghost" size="md" className="w-full justify-center sm:w-auto">
              Order samples first
            </Button>
          </div>

          {/* Hero trust strip — built into hero, no separate section needed */}
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-pw-stone pt-7 sm:mt-14 sm:grid-cols-4 sm:gap-x-8 sm:pt-8">
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
      </div>
    </section>
  );
}

// ── 2. Process — 3 visual steps ────────────────────────────────────────────
function ProcessSection() {
  const steps = [
    {
      num:    "01",
      title:  "Upload your image",
      body:   "A photo from your phone, an artwork you scanned, a pattern you bought. Any high-res JPG, PNG, or WebP works. We check resolution against your wall before you check out.",
      prompt: "Top-down lifestyle photograph of a hand holding a phone over a small linen-covered table, the phone screen showing an image-upload interface with a custom abstract pattern photo selected. Warm soft side-light, natural shadow on the table, oat colour palette. Photorealistic, sharp focus, no faces visible, square composition.",
      dims:   "800×800",
      // src:    "/images/home/process-1.jpg",
    },
    {
      num:    "02",
      title:  "Pick your finish & size",
      body:   "Three finishes — satin, matte, or linen. Two ways to apply — paste-the-wall or peel-and-stick. Width and height in centimetres. Live price as you choose.",
      prompt: "Top-down lifestyle photograph of three large fabric wallpaper swatches arranged in a fan on an oak surface — one warm cream satin, one matte olive, one textured linen with subtle pattern. A measuring tape resting beside them, soft natural light, photorealistic, no people, square composition.",
      dims:   "800×800",
      // src:    "/images/home/process-2.jpg",
    },
    {
      num:    "03",
      title:  "We print, you hang",
      body:   "Through our commercial press within 72 hours of payment. Panels arrive rolled, labelled in hanging order, with a substrate-specific install guide. Free nationwide.",
      prompt: "Editorial photograph showing a person's hands smoothing a section of newly-installed custom wallpaper onto a wall — only hands and tools visible, a smoothing brush nearby. Warm side-light, the wallpaper has a beautiful botanical pattern partially visible. Photorealistic, sharp focus, square composition.",
      dims:   "800×800",
      // src:    "/images/home/process-3.jpg",
    },
  ];

  return (
    <Section tone="bg" id="how">
      <SectionHeader
        eyebrow="How it works"
        title="From your photo to your wall in days."
        body="No design experience, no trade account, no minimums. Just your image, your dimensions, and a clear price before you check out."
      />

      {/*
        Mobile: stack with horizontal-rectangle images (less vertical scroll).
        Tablet+: 3-column with square images.
      */}
      <div className="mt-10 grid grid-cols-1 gap-7 sm:mt-14 sm:grid-cols-3 sm:gap-8 lg:gap-12">
        {steps.map((step) => (
          <article key={step.num} className="flex flex-col gap-5">
            <ImagePlaceholder
              aspectRatio="16/10"
              aspectClassName="sm:!aspect-square"
              dimensions={step.dims}
              prompt={step.prompt}
            />
            <div className="flex items-center gap-3">
              <span className="pw-overline text-pw-accent">Step {step.num}</span>
              <span className="h-px flex-1 bg-pw-stone" />
            </div>
            <h3 className="pw-h3 text-pw-ink">{step.title}</h3>
            <p className="pw-body text-pw-ink/70">{step.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex justify-center sm:mt-14">
        <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
          Start designing
        </Button>
      </div>
    </Section>
  );
}

// ── 3. Gallery — real installs, modern editorial grid ─────────────────────
function GallerySection() {
  const images = [
    {
      span:   "col-span-2 lg:col-span-7 lg:row-span-2",
      aspect: "4/5",
      caption: "Botanical · Satin · Living room",
      prompt: "Editorial living-room photograph, custom large-scale botanical wallpaper as the wall behind a low-profile linen sofa. A vintage rug, a small ceramic side table, two oversized linen cushions. Late afternoon golden light, white-washed plaster perimeter walls, oak floors. Apartmento magazine style, photorealistic, no people.",
      dims:   "1600×2000",
      // src:    "/images/home/gallery-1.jpg",
    },
    {
      span:   "lg:col-span-5",
      aspect: "4/3",
      caption: "Watercolour · Matte · Bedroom",
      prompt: "Editorial bedroom photograph, custom abstract-watercolour wallpaper as the headboard wall, linen-upholstered bed, tan leather throw pillows, vintage ceramic bedside lamp, an open book. Soft morning light from a side window, oak floors. Aesop / Kinfolk warmth, photorealistic, no people.",
      dims:   "1200×900",
      // src:    "/images/home/gallery-2.jpg",
    },
    {
      span:   "lg:col-span-5",
      aspect: "4/3",
      caption: "Modern art · Linen · Home office",
      prompt: "Editorial home-office photograph, custom modern art-painting wallpaper behind a clean walnut desk. A linen-upholstered chair, a brass desk lamp, a small succulent, an open notebook. Bright soft natural light from a left-side window, warm stone perimeter walls. Apartmento warmth, photorealistic, no people.",
      dims:   "1200×900",
      // src:    "/images/home/gallery-3.jpg",
    },
    {
      span:   "lg:col-span-4",
      aspect: "3/4",
      caption: "Geometric · Satin · Hallway",
      prompt: "Editorial entryway photograph, custom geometric-line wallpaper on a long hallway wall. Thin oak console table with a single ceramic vase, a small abstract framed artwork, terrazzo floor tile, soft natural light from a high window. Aesop store interior style, photorealistic, no people.",
      dims:   "900×1200",
      // src:    "/images/home/gallery-4.jpg",
    },
    {
      span:   "lg:col-span-4",
      aspect: "3/4",
      caption: "Landscape · Matte · Stairwell",
      prompt: "Editorial stairwell photograph, dramatic full-height custom-printed mountain-landscape wallpaper running floor to ceiling along the staircase wall. Dark oak hardwood treads, brass handrail, soft skylight from above. Premium hotel-lobby mood, photorealistic, no people.",
      dims:   "900×1200",
      // src:    "/images/home/gallery-5.jpg",
    },
    {
      span:   "col-span-2 lg:col-span-4",
      aspect: "auto",
      isCallout: true,
    },
  ];

  return (
    <Section tone="surface" id="gallery">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <SectionHeader
          eyebrow="Real walls, real homes"
          title={"Wallpaper that becomes the room."}
          body="Every print is unique to the customer who ordered it. Your image, your wall, cut to your size."
        />
        <Button href="/config" variant="ghost" size="md" className="hidden sm:inline-flex">
          Design yours →
        </Button>
      </div>

      {/*
        Mobile: 2-column grid (huge improvement over 1-col stack of 6 images).
        Lg+: 12-col editorial grid with intentional spans.
      */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 sm:mt-12 lg:grid-cols-12 lg:auto-rows-[280px]">
        {images.map((img, i) =>
          img.isCallout ? (
            <div
              key={i}
              className={[
                "rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-7 lg:p-8 flex flex-col justify-between",
                img.span,
              ].join(" ")}
            >
              <div>
                <Eyebrow variant="muted">Bring your own image</Eyebrow>
                <p className="pw-h3 mt-3 text-pw-ink">
                  Anything you can save as a file — we&rsquo;ll print it at any scale.
                </p>
              </div>
              <Link
                href="/inspiration"
                className="pw-small mt-6 inline-flex items-center gap-1 font-medium text-pw-ink hover:gap-2 transition-all"
              >
                See more inspiration →
              </Link>
            </div>
          ) : (
            <div key={i} className={img.span}>
              <ImagePlaceholder
                aspectRatio={img.aspect}
                dimensions={img.dims}
                prompt={img.prompt!}
                caption={img.caption}
                className="h-full"
              />
            </div>
          )
        )}
      </div>

      {/* Mobile-only CTA below grid */}
      <div className="mt-8 sm:hidden">
        <Button href="/config" variant="primary" size="lg" className="w-full">
          Design yours
        </Button>
      </div>
    </Section>
  );
}

// ── 4. Finishes — anchor pricing + clear options ──────────────────────────
function FinishesSection() {
  const finishes = [
    {
      name:        "Satin",
      desc:        "A subtle sheen. Wipes clean. Sits comfortably in living rooms and family spaces.",
      rangeFromTo: "R410 – R490",
      tag:         "Most ordered",
      gradient:    "linear-gradient(135deg, #E8DFD2 0%, #C4A78A 60%, #8C6F58 100%)",
      prompt:      "Macro detail of premium satin-finish printed wallpaper on a wall, soft sheen catching warm side-light, neutral cream base with subtle terracotta brushwork visible. Sharp focus, no people.",
      dims:        "1200×900",
      // src:         "/images/home/finish-satin.jpg",
    },
    {
      name:        "Matte",
      desc:        "Completely flat, non-reflective. Reads like fine art on the wall. Best for bright rooms with strong light.",
      rangeFromTo: "R470 – R540",
      tag:         null,
      gradient:    "linear-gradient(135deg, #DDD3C5 0%, #B5A795 100%)",
      prompt:      "Macro detail of matte-finish wallpaper, completely flat non-reflective surface, deep colour saturation, oat-and-clay tonal print pattern visible. Soft natural light, sharp focus, no people.",
      dims:        "1200×900",
      // src:         "/images/home/finish-matte.jpg",
    },
    {
      name:        "Linen",
      desc:        "Textured, fabric-like surface. Catches light and adds depth. Designed to feel like a chosen material.",
      rangeFromTo: "R590 – R680",
      tag:         "Most premium",
      gradient:    "linear-gradient(135deg, #D4C9BE 0%, #A38C72 50%, #6B543C 100%)",
      prompt:      "Macro detail of linen-textured wallpaper, visible woven fabric grain pattern, warm stone tones, side-light revealing the surface relief. Premium hotel-lobby material feel, sharp focus, no people.",
      dims:        "1200×900",
      // src:         "/images/home/finish-linen.jpg",
    },
  ];

  return (
    <Section tone="bg" id="finishes">
      <SectionHeader
        eyebrow="Choose your finish"
        title="Three finishes. One commercial press."
        body="Every order goes through the same machine. The choice is finish — how the surface catches light — and how it sticks to the wall."
      />

      <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-14 sm:gap-6 md:grid-cols-3">
        {finishes.map((f) => (
          <article
            key={f.name}
            className="group flex flex-col rounded-pw-card border border-pw-stone bg-pw-surface overflow-hidden hover:shadow-pw-md transition-shadow"
          >
            <div className="relative">
              <ImagePlaceholder
                aspectRatio="16/10"
                aspectClassName="md:!aspect-[4/3]"
                dimensions={f.dims}
                prompt={f.prompt}
                gradient={f.gradient}
              />
              {f.tag && (
                <span className="pw-overline absolute top-4 left-4 rounded-full bg-pw-ink px-3 py-1 text-white">
                  {f.tag}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <h3 className="pw-h3 text-pw-ink">{f.name}</h3>
              <p className="pw-body mt-3 flex-1 text-pw-ink/70">{f.desc}</p>
              <div className="mt-5 flex items-baseline justify-between border-t border-pw-stone pt-4 sm:mt-6 sm:pt-5">
                <span className="pw-small text-pw-muted">From</span>
                <span className="pw-h3 text-pw-ink">{f.rangeFromTo}</span>
              </div>
              <p className="pw-small mt-1 text-right text-pw-muted-light">per m²</p>
            </div>
          </article>
        ))}
      </div>

      {/* Application strip — Traditional vs Peel & Stick */}
      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-pw-card border border-pw-stone bg-pw-stone sm:mt-12 md:grid-cols-2">
        <div className="flex flex-col gap-3 bg-pw-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="pw-overline text-pw-muted">Application 01</span>
            <span className="h-px flex-1 bg-pw-stone" />
          </div>
          <h3 className="pw-h3 text-pw-ink">Traditional (paste-the-wall)</h3>
          <p className="pw-body text-pw-ink/70">
            Permanent, with the cleanest seams — the way wallpaper is supposed to look.
            Best for feature walls and rooms you&rsquo;re committing to.
          </p>
        </div>
        <div className="flex flex-col gap-3 bg-pw-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="pw-overline text-pw-muted">Application 02</span>
            <span className="h-px flex-1 bg-pw-stone" />
          </div>
          <h3 className="pw-h3 text-pw-ink">Peel &amp; Stick</h3>
          <p className="pw-body text-pw-ink/70">
            Self-adhesive backing. Repositionable while you hang, removes cleanly
            when you&rsquo;re done. The right choice for renters or anyone keeping
            options open.
          </p>
        </div>
      </div>

      <div className="mt-10 flex justify-center sm:mt-12">
        <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
          See live pricing in the configurator
        </Button>
      </div>
    </Section>
  );
}

// ── 5. Sample-pack rail — secondary path for considered buyers ────────────
function SamplePackRail() {
  return (
    <section className="bg-pw-stone">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-12 sm:gap-10 sm:px-8 sm:py-16 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-12 lg:py-20">
        <div className="lg:col-span-5">
          <ImagePlaceholder
            aspectRatio="4/3"
            dimensions="1200×900"
            // src="/images/home/sample-pack.jpg"
            prompt="Top-down editorial photograph of the PaperWalls sample pack laid out on a warm stone-coloured surface — six A5 wallpaper swatches in a fan arrangement (satin cream, matte olive, linen oat, satin terracotta, matte clay, linen rust). Soft natural side-light, photorealistic, no people."
          />
        </div>
        <div className="lg:col-span-7">
          <Eyebrow variant="muted">Not ready to commit?</Eyebrow>
          <h2 className="pw-h2 mt-4 text-pw-ink">
            Feel the materials in your hand first.
          </h2>
          <p className="pw-body-lg mt-4 max-w-xl text-pw-ink/70">
            Order our sample pack — A5 swatches of every finish we offer, printed on
            the same press as your final order. Touch, hold, see the light catch each
            material on your actual wall.
          </p>
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <Button href="/samples" variant="primary" size="lg" className="w-full sm:w-auto">
              Order sample pack — R300
            </Button>
            <span className="pw-small text-center text-pw-muted sm:text-left">
              Ships free · Delivered in 3–5 days
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 6. Why PaperWalls — 3 differentiators ─────────────────────────────────
function WhyPaperWalls() {
  const reasons = [
    {
      title: "Printed in Cape Town",
      body:  "Our own press, our own people, our own QC. No imported rolls, no third-party fulfilment, no surprises.",
    },
    {
      title: "Cut to your wall",
      body:  "Every order is cut to the millimetre based on the dimensions you submit. There are no standard sizes — the price is for the wall you measured.",
    },
    {
      title: "Defects on us",
      body:  "If anything ships imperfect — banding, colour shift, transit damage — we reprint at no cost. Send a photo within 7 days and we sort it within 48.",
    },
  ];

  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="Why PaperWalls"
        title="The standards we hold ourselves to."
      />
      <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-pw-card border border-pw-stone bg-pw-stone sm:mt-14 md:grid-cols-3">
        {reasons.map((r) => (
          <div key={r.title} className="flex flex-col gap-4 bg-pw-surface p-6 sm:p-8">
            <h3 className="pw-h3 text-pw-ink">{r.title}</h3>
            <p className="pw-body text-pw-ink/70">{r.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 7. FAQ ────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Do I need design software or special files?",
    a: "No. If you have a photo on your phone, you have everything you need. Upload any JPG, PNG, or WebP — we handle the print setup from there.",
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
    q: "I rent — will peel-and-stick damage my walls?",
    a: "No. Our peel-and-stick removes cleanly from painted plaster without leaving residue. It can also be repositioned if you need to adjust after hanging.",
  },
  {
    q: "How long does delivery take after I order?",
    a: "72 hours through our press from payment confirmation, then 2–4 business days for nationwide delivery. You receive a tracking number when it ships.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone="bg" id="faq">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Common questions"
            title="The five things everyone asks."
            body={
              <>
                Still unsure?{" "}
                <Link
                  href="/contact"
                  className="text-pw-accent underline underline-offset-[5px] decoration-pw-accent/40 hover:decoration-pw-accent"
                >
                  Get in touch
                </Link>
                {" "}and we&rsquo;ll talk through your project.
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
                  className="flex w-full items-center justify-between gap-4 py-5 text-left hover:text-pw-ink transition-colors sm:gap-6 sm:py-6"
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
                  <p className="pw-body pb-6 -mt-1 max-w-3xl text-pw-ink/70 sm:pb-7">{item.a}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

// ── 8. Closing CTA ────────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <Section tone="ink" density="default">
      <div className="grid gap-8 sm:gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow variant="muted" className="text-pw-accent-mid">Ready when you are</Eyebrow>
          <h2 className="pw-display mt-4 text-white sm:mt-5">
            Your image.<br />
            On your wall this week.
          </h2>
          <p className="pw-body-lg mt-5 max-w-xl text-white/65 sm:mt-6">
            Upload your photo, choose your finish, get a live price in under
            sixty seconds. Printed in Cape Town. Delivered nationwide. No
            account needed to start.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 lg:col-span-5 lg:items-end">
          <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto lg:w-auto">
            Design your wallpaper
          </Button>
          <span className="pw-small text-center text-white/45 lg:text-right">
            No payment until you check out · Free shipping nationwide
          </span>
        </div>
      </div>
    </Section>
  );
}
