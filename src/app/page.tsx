"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// Mobile-first 8-section flow tuned for DTC ecom CRO:
//   1. Hero               — value prop + single primary CTA + secondary text link
//   2. Gallery            — proof early via real installs (horizontal scroll mobile)
//   3. Process            — 3 numbered steps, tight rhythm
//   4. Finishes & price   — buy-box with anchor pricing
//   5. Sample-pack rail   — secondary path for the considered buyer
//   6. Why PaperWalls     — 3 trust signals, slim list on mobile
//   7. FAQ                — objection handling
//   8. Closing CTA        — dark, single decisive ask

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <GallerySection />
      <ProcessSection />
      <FinishesSection />
      <SamplePackBanner />
      <WhyPaperWalls />
      <FAQSection />
      <ClosingCTA />
    </>
  );
}

// ── Reusable: simple centred text link for secondary CTAs ─────────────────
function TextLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={["pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors", className].join(" ").trim()}
    >
      {children}
    </Link>
  );
}

// ── 1. Hero ────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="bg-pw-bg">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pb-10 pt-6 sm:gap-10 sm:px-8 sm:pb-14 sm:pt-10 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">

        {/* Image first on mobile (visual hook); right on desktop */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <ImagePlaceholder
            src="/images/home/hero.jpg"
            aspectRatio="4/3"
            aspectClassName="lg:!aspect-[4/5]"
            dimensions="1600×2000"
            prompt="Editorial Cape Town living room with botanical custom-printed wallpaper as feature wall behind an oat-bouclé sofa, warm afternoon light from a tall window, brass floor lamp, travertine coffee table with linen books, oak herringbone floors, white-washed plaster walls. Apartmento × Aesop × Kinfolk warmth. Photorealistic, no people."
          />
        </div>

        {/* Copy */}
        <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
          <Eyebrow>Custom wallpaper · Made in Cape Town</Eyebrow>
          <h1 className="pw-display mt-4 text-pw-ink">
            Your image.<br />
            Your wall.
          </h1>
          <p className="pw-body-lg mt-4 max-w-md text-pw-ink/70 sm:mt-5">
            Upload any photo, pattern, or artwork. We print it, cut it to your
            wall&rsquo;s exact size, and ship it free across South Africa.
          </p>

          {/* CTAs — primary full-width on mobile, secondary as text link below */}
          <div className="mt-6 flex flex-col items-center gap-4 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <TextLink href="/samples">Order samples first</TextLink>
          </div>

          {/* 3 trust signals — uniform single-line labels */}
          <ul className="mt-8 grid grid-cols-3 gap-3 sm:mt-12 sm:gap-6">
            {[
              { num: "72-hour",   label: "Production" },
              { num: "Free",      label: "Shipping" },
              { num: "Cape Town", label: "Made by us" },
            ].map((item) => (
              <li key={item.label} className="flex flex-col gap-0.5">
                <span className="pw-h3 text-pw-ink">{item.num}</span>
                <span className="pw-overline text-pw-muted">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── 2. Gallery — horizontal scroll on mobile, editorial grid on desktop ───
function GallerySection() {
  const images = [
    {
      src:     "/images/home/gallery-1.jpg",
      caption: "Botanical · Satin · Living room",
      prompt:  "Living room with custom botanical wallpaper",
    },
    {
      src:     "/images/home/gallery-2.jpg",
      caption: "Watercolour · Matte · Bedroom",
      prompt:  "Bedroom with custom watercolour wallpaper",
    },
    {
      src:     "/images/home/gallery-3.jpg",
      caption: "Modern art · Linen · Home office",
      prompt:  "Home office with custom modern art wallpaper",
    },
    {
      src:     "/images/home/gallery-4.jpg",
      caption: "Geometric · Satin · Hallway",
      prompt:  "Hallway with custom geometric wallpaper",
    },
    {
      src:     "/images/home/gallery-5.jpg",
      caption: "Landscape · Matte · Stairwell",
      prompt:  "Stairwell with custom landscape wallpaper",
    },
  ];

  return (
    <Section tone="surface" id="gallery">
      <SectionHeader
        eyebrow="In real homes"
        title="Wallpaper that becomes the room."
        body="Every print is unique to the customer who ordered it."
      />

      <div className="mt-8 sm:mt-10 lg:mt-12">
        {/*
          Mobile/tablet: 2-col grid with the hero image spanning both columns.
          The horizontal-scroll-snap pattern looked cramped (image hugging
          the right edge). A clean grid is more legible and predictable.
        */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
          {images.map((img, i) => (
            <figure key={i} className={i === 0 ? "col-span-2" : ""}>
              <ImagePlaceholder
                src={img.src}
                aspectRatio={i === 0 ? "4/5" : "3/4"}
                prompt={img.prompt}
              />
              <figcaption className="pw-small mt-2 text-pw-muted">{img.caption}</figcaption>
            </figure>
          ))}
        </div>

        {/* Desktop: editorial 12-col grid */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:auto-rows-[280px] lg:gap-4">
          <figure className="lg:col-span-7 lg:row-span-2">
            <ImagePlaceholder src={images[0].src} aspectRatio="4/5" prompt={images[0].prompt} className="h-full" />
          </figure>
          <figure className="lg:col-span-5">
            <ImagePlaceholder src={images[1].src} aspectRatio="4/3" prompt={images[1].prompt} className="h-full" />
          </figure>
          <figure className="lg:col-span-5">
            <ImagePlaceholder src={images[2].src} aspectRatio="4/3" prompt={images[2].prompt} className="h-full" />
          </figure>
          <figure className="lg:col-span-4">
            <ImagePlaceholder src={images[3].src} aspectRatio="3/4" prompt={images[3].prompt} className="h-full" />
          </figure>
          <figure className="lg:col-span-4">
            <ImagePlaceholder src={images[4].src} aspectRatio="3/4" prompt={images[4].prompt} className="h-full" />
          </figure>
          <div className="lg:col-span-4 flex flex-col justify-end rounded-pw-card border border-pw-stone bg-pw-bg p-7">
            <Eyebrow variant="muted">Bring your own image</Eyebrow>
            <p className="pw-h3 mt-3 text-pw-ink">
              Anything you can save as a file — we&rsquo;ll print it at any scale.
            </p>
          </div>
        </div>
      </div>

      {/* Single CTA below grid (both mobile & desktop) */}
      <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-x-6 lg:mt-12">
        <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
          Design yours
        </Button>
        <TextLink href="/inspiration">See more inspiration →</TextLink>
      </div>
    </Section>
  );
}

// ── 3. Process — 3 numbered steps, tight ─────────────────────────────────
function ProcessSection() {
  const steps = [
    {
      num:    "01",
      title:  "Upload your image",
      body:   "Any high-res JPG, PNG, or WebP. We check resolution against your wall before you check out.",
      src:    "/images/home/process-1.jpg",
      prompt: "Hand uploading an image on a phone",
    },
    {
      num:    "02",
      title:  "Pick your finish & size",
      body:   "Three finishes, two ways to apply. Width and height in centimetres. Live price as you choose.",
      src:    "/images/home/process-2.jpg",
      prompt: "Wallpaper swatches arranged on a surface",
    },
    {
      num:    "03",
      title:  "We print, you hang",
      body:   "Through our press in 72 hours. Panels arrive rolled, labelled in hanging order, with an install guide.",
      src:    "/images/home/process-3.jpg",
      prompt: "Hands smoothing wallpaper onto a wall",
    },
  ];

  return (
    <Section tone="bg" id="how">
      <SectionHeader
        eyebrow="How it works"
        title="From your photo to your wall."
        body="No design experience, no trade account, no minimums."
      />

      <ol className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-3 sm:gap-8 lg:mt-14 lg:gap-10">
        {steps.map((step) => (
          <li key={step.num} className="flex flex-col gap-4">
            <ImagePlaceholder
              src={step.src}
              aspectRatio="16/10"
              aspectClassName="sm:!aspect-square"
              prompt={step.prompt}
            />
            <div className="flex items-baseline gap-3">
              <span className="pw-overline text-pw-accent">{step.num}</span>
              <h3 className="pw-h3 text-pw-ink">{step.title}</h3>
            </div>
            <p className="pw-body text-pw-ink/70">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex justify-center sm:mt-12">
        <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
          Start designing
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
      desc:        "Subtle sheen. Wipes clean. Sits comfortably in living rooms and family spaces.",
      rangeFromTo: "R410–490",
      tag:         "Most ordered",
      src:         "/images/home/finish-satin.jpg",
      prompt:      "Macro of satin-finish wallpaper",
    },
    {
      name:        "Matte",
      desc:        "Completely flat, non-reflective. Reads like fine art on the wall. Best for bright rooms.",
      rangeFromTo: "R470–540",
      tag:         null,
      src:         "/images/home/finish-matte.jpg",
      prompt:      "Macro of matte-finish wallpaper",
    },
    {
      name:        "Linen",
      desc:        "Textured, fabric-like. Catches light, adds depth. Designed to feel chosen, not generic.",
      rangeFromTo: "R590–680",
      tag:         "Most premium",
      src:         "/images/home/finish-linen.jpg",
      prompt:      "Macro of linen-textured wallpaper",
    },
  ];

  return (
    <Section tone="surface" id="finishes">
      <SectionHeader
        eyebrow="Choose your finish"
        title="Three finishes. One commercial press."
        body="Every order goes through the same machine. The choice is finish — how the surface catches light — and how it sticks to the wall."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
        {finishes.map((f) => (
          <article
            key={f.name}
            className="flex flex-col rounded-pw-card border border-pw-stone bg-pw-bg overflow-hidden"
          >
            <div className="relative">
              <ImagePlaceholder
                src={f.src}
                aspectRatio="16/10"
                aspectClassName="md:!aspect-[4/3]"
                prompt={f.prompt}
              />
              {f.tag && (
                <span className="pw-overline absolute top-4 left-4 rounded-full bg-pw-ink px-3 py-1 text-white">
                  {f.tag}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="pw-h3 text-pw-ink">{f.name}</h3>
                <span className="pw-h3 whitespace-nowrap text-pw-ink">{f.rangeFromTo}</span>
              </div>
              <p className="pw-small mt-1 text-pw-muted-light">per m²</p>
              <p className="pw-body mt-4 text-pw-ink/70">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Application — Traditional vs Peel & Stick */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2">
        <article className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-7">
          <h3 className="pw-h3 text-pw-ink">Traditional</h3>
          <p className="pw-small mt-1 text-pw-accent">Paste-the-wall</p>
          <p className="pw-body mt-3 text-pw-ink/70">
            Permanent, with the cleanest seams. Best for feature walls and rooms you&rsquo;re committing to.
          </p>
        </article>
        <article className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-7">
          <h3 className="pw-h3 text-pw-ink">Peel &amp; Stick</h3>
          <p className="pw-small mt-1 text-pw-accent">Self-adhesive</p>
          <p className="pw-body mt-3 text-pw-ink/70">
            Repositionable while you hang, removes cleanly when you&rsquo;re done. The right choice for renters.
          </p>
        </article>
      </div>

      <div className="mt-8 flex justify-center sm:mt-12">
        <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
          See live pricing
        </Button>
      </div>
    </Section>
  );
}

// ── 5. Sample-pack banner ─────────────────────────────────────────────────
function SamplePackBanner() {
  return (
    <section className="bg-pw-stone">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-10 sm:gap-10 sm:px-8 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-12 lg:py-20">
        <div className="lg:col-span-5">
          <ImagePlaceholder
            src="/images/home/sample-pack.jpg"
            aspectRatio="4/3"
            prompt="Sample pack with wallpaper swatches"
          />
        </div>
        <div className="lg:col-span-7">
          <Eyebrow variant="muted">Not ready to commit?</Eyebrow>
          <h2 className="pw-h2 mt-3 text-pw-ink">
            Feel the materials in your hand first.
          </h2>
          <p className="pw-body-lg mt-4 max-w-xl text-pw-ink/70">
            A5 swatches of every finish, printed on the same press as your final
            order. R300, ships free, arrives in 3–5 days.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <Button href="/samples" variant="primary" size="lg" className="w-full sm:w-auto">
              Order sample pack — R300
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 6. Why PaperWalls — 3 trust signals ───────────────────────────────────
function WhyPaperWalls() {
  const reasons = [
    {
      title: "Printed in Cape Town",
      body:  "Our own press, our own people, our own QC. No imported rolls, no third-party fulfilment.",
    },
    {
      title: "Cut to your wall",
      body:  "Every order cut to the millimetre based on your dimensions. There are no standard sizes.",
    },
    {
      title: "Reprint guarantee",
      body:  "Anything imperfect — banding, colour shift, transit damage — we reprint at no cost.",
    },
  ];

  return (
    <Section tone="bg">
      <SectionHeader
        eyebrow="Why PaperWalls"
        title="Standards we hold ourselves to."
      />

      {/* Mobile: clean bullet list. Desktop: 3-card grid. */}
      <ul className="mt-8 flex flex-col gap-5 sm:mt-12 md:grid md:grid-cols-3 md:gap-8">
        {reasons.map((r) => (
          <li key={r.title} className="flex gap-4 md:flex-col md:gap-3">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pw-accent md:mt-0 md:h-2 md:w-2"
            />
            <div>
              <h3 className="pw-h3 text-pw-ink">{r.title}</h3>
              <p className="pw-body mt-1.5 text-pw-ink/70 md:mt-2">{r.body}</p>
            </div>
          </li>
        ))}
      </ul>
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
    a: "We check resolution against your wall dimensions before you pay. If the file is too small, we tell you upfront and suggest a smaller wall or a sharper image.",
  },
  {
    q: "How do I measure my wall correctly?",
    a: "Width × height in centimetres, edge to edge at the widest and tallest points. We cut every order to the millimetre — measure twice.",
  },
  {
    q: "I rent — will peel-and-stick damage my walls?",
    a: "No. Our peel-and-stick removes cleanly from painted plaster without leaving residue, and can be repositioned during install.",
  },
  {
    q: "How long does delivery take?",
    a: "72 hours through our press from payment, then 2–4 business days for nationwide delivery. You get a tracking number when it ships.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone="surface" id="faq">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
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
                  Talk to us.
                </Link>
              </>
            }
          />
        </div>
        <ul className="lg:col-span-8">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="border-b border-pw-stone first:border-t">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors sm:py-6"
                >
                  <span className="pw-h3 text-pw-ink">{item.q}</span>
                  <span
                    className={[
                      "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-pw-stone text-pw-ink transition-transform",
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
                  <p className="pw-body pb-6 -mt-1 max-w-3xl text-pw-ink/70">{item.a}</p>
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
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow className="text-pw-accent-mid">Ready when you are</Eyebrow>
          <h2 className="pw-display mt-3 text-white sm:mt-4">
            Your image.<br />
            On your wall this week.
          </h2>
          <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
            Upload your photo, choose your finish, get a live price in under sixty seconds.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 lg:col-span-5 lg:items-end">
          <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
            Design your wallpaper
          </Button>
          <span className="pw-small text-center text-white/45 lg:text-right">
            No payment yet · Free shipping
          </span>
        </div>
      </div>
    </Section>
  );
}
