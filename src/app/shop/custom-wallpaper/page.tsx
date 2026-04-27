"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// ── Shopify-style Product Detail Page ─────────────────────────────────────
// Above-the-fold: classic 2-col buy box (gallery left, info + CTA right).
// Below-the-fold: product description, materials deep-dive, what's in the
// box, real-homes gallery, comparison, sample-pack, FAQ, closing CTA.
// Plus: sticky mobile CTA from past-hero through to closing CTA.

const FINISH_PRICING = {
  satin: { traditional: 410, peelAndStick: 490 },
  matte: { traditional: 470, peelAndStick: 540 },
  linen: { traditional: 590, peelAndStick: 680 },
} as const;

type Finish      = keyof typeof FINISH_PRICING;
type Application = "traditional" | "peelAndStick";

const FINISH_DETAILS: Record<Finish, { name: string; sub: string; swatch: string }> = {
  satin: { name: "Satin", sub: "Subtle sheen, easy clean",  swatch: "linear-gradient(135deg, #E8DFD2 0%, #C4A78A 60%, #8C6F58 100%)" },
  matte: { name: "Matte", sub: "Flat, non-reflective",      swatch: "linear-gradient(135deg, #DDD3C5 0%, #B5A795 100%)" },
  linen: { name: "Linen", sub: "Textured, premium feel",    swatch: "linear-gradient(135deg, #D4C9BE 0%, #A38C72 50%, #6B543C 100%)" },
};

export default function CustomWallpaperPage() {
  const [activeImage,       setActiveImage]       = useState(0);
  const [activeFinish,      setActiveFinish]      = useState<Finish>("satin");
  const [activeApplication, setActiveApplication] = useState<Application>("traditional");

  const price = FINISH_PRICING[activeFinish][activeApplication];

  return (
    <>
      <BuyBox
        activeImage={activeImage}
        setActiveImage={setActiveImage}
        activeFinish={activeFinish}
        setActiveFinish={setActiveFinish}
        activeApplication={activeApplication}
        setActiveApplication={setActiveApplication}
        price={price}
      />
      <ProductDescription />
      <MaterialsSection />
      <WhatsInBox />
      <RealHomesGallery />
      <ComparisonSection />
      <SamplePackBanner />
      <FAQSection />
      <ClosingCTA />
      <StickyMobileCTA price={price} />
    </>
  );
}

// ── Reusable text link ────────────────────────────────────────────────────
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

// ── BUY BOX (above the fold) ──────────────────────────────────────────────
// Each gallery slot has ONE conversion job, in this order:
// 1. Hero lifestyle           — emotional hook, no overlay
// 2. Feature pills overlay    — answers "why us" (specs, ink, origin, shipping)
// 3. Material macro + label   — answers "is it premium" (gsm, wipe-clean)
// 4. Finish comparison strip  — lets buyer eyeball Satin/Matte/Linen difference
// 5. Scale + dimensions       — kills "will it fit my wall" objection
// 6. Real-home + 5★ overlay   — social proof / risk reversal
const BUY_BOX_IMAGES = [
  { src: "/images/product/pdp-01-hero.jpg",      alt: "Custom wallpaper in a sunlit living room" },
  { src: "/images/product/pdp-02-features.jpg",  alt: "Wall corner with feature callouts: 1440dpi print, non-toxic ink, made in SA, free delivery" },
  { src: "/images/product/pdp-03-material.jpg",  alt: "Macro of linen-finish wallpaper labelled 220gsm and wipe-clean" },
  { src: "/images/product/pdp-04-finishes.jpg",  alt: "Side-by-side comparison strip of Satin, Matte and Linen finishes" },
  { src: "/images/product/pdp-05-scale.jpg",     alt: "Wall in a room with dimensions overlaid and a person silhouette for scale" },
  { src: "/images/product/pdp-06-real-home.jpg", alt: "Real customer home with five-star testimonial overlay" },
];

type BuyBoxProps = {
  activeImage:        number;
  setActiveImage:     (i: number) => void;
  activeFinish:       Finish;
  setActiveFinish:    (f: Finish) => void;
  activeApplication:  Application;
  setActiveApplication: (a: Application) => void;
  price:              number;
};

function BuyBox({
  activeImage, setActiveImage,
  activeFinish, setActiveFinish,
  activeApplication, setActiveApplication,
  price,
}: BuyBoxProps) {
  return (
    <section id="buy-box" className="bg-pw-bg">
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-14 lg:px-12 lg:pt-10 lg:pb-20">

        {/* Breadcrumbs */}
        <nav className="pw-small mb-4 flex flex-wrap items-center gap-x-2 text-pw-muted sm:mb-6">
          <Link href="/" className="hover:text-pw-ink transition-colors">Home</Link>
          <span className="text-pw-muted-light">/</span>
          <Link href="/shop" className="hover:text-pw-ink transition-colors">Shop</Link>
          <span className="text-pw-muted-light">/</span>
          <span className="text-pw-ink">Custom wallpaper</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">

          {/* GALLERY — left column on desktop, top on mobile */}
          <div className="lg:col-span-7">
            {/* Main image */}
            <ImagePlaceholder
              src={BUY_BOX_IMAGES[activeImage].src}
              aspectRatio="1/1"
              prompt={BUY_BOX_IMAGES[activeImage].alt}
            />
            {/* Thumbnail row — 3 cols mobile (2 rows of 3), 6 cols desktop (1 row) */}
            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3 sm:grid-cols-6">
              {BUY_BOX_IMAGES.map((img, i) => {
                const active = i === activeImage;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-pressed={active}
                    className={[
                      "relative overflow-hidden rounded-pw-card transition-all",
                      active ? "ring-2 ring-pw-ink ring-offset-2 ring-offset-pw-bg" : "ring-1 ring-pw-stone hover:ring-pw-ink/40",
                    ].join(" ")}
                  >
                    <ImagePlaceholder
                      src={img.src}
                      aspectRatio="1/1"
                      prompt={img.alt}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* PRODUCT INFO — right column on desktop (sticky), below gallery on mobile */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">

              {/* Title + price */}
              <Eyebrow>Custom wallpaper</Eyebrow>
              <h1 className="pw-h1 mt-3 text-pw-ink">
                Wallpaper printed to your wall.
              </h1>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="pw-h2 text-pw-ink">R{price}</span>
                <span className="pw-body text-pw-muted">per m²</span>
              </div>
              <p className="pw-small mt-1 text-pw-muted">
                Final price is calculated from your wall size in the configurator.
              </p>

              {/* Description */}
              <p className="pw-body mt-5 text-pw-ink/70">
                Upload any image. We print it on commercial-grade substrate, cut it to
                your wall&rsquo;s exact dimensions, and ship it free across South Africa.
                Made to order in Cape Town.
              </p>

              {/* Variant 1 — Application */}
              <div className="mt-7 border-t border-pw-stone pt-7">
                <div className="flex items-baseline justify-between">
                  <span className="pw-overline text-pw-ink">Application</span>
                  <span className="pw-small text-pw-muted">
                    {activeApplication === "traditional" ? "Paste-the-wall" : "Self-adhesive"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { id: "traditional"  as const, label: "Traditional",   sub: "Paste-the-wall" },
                    { id: "peelAndStick" as const, label: "Peel & Stick",  sub: "Renter-friendly" },
                  ].map((opt) => {
                    const active = opt.id === activeApplication;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setActiveApplication(opt.id)}
                        aria-pressed={active}
                        className={[
                          "flex flex-col items-start rounded-pw border p-4 text-left transition-colors",
                          active
                            ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink"
                            : "border-pw-stone bg-pw-surface hover:border-pw-ink/40",
                        ].join(" ")}
                      >
                        <span className="pw-small font-semibold text-pw-ink">{opt.label}</span>
                        <span className="pw-small mt-1 text-pw-muted">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variant 2 — Finish */}
              <div className="mt-6 border-t border-pw-stone pt-6">
                <div className="flex items-baseline justify-between">
                  <span className="pw-overline text-pw-ink">Finish</span>
                  <span className="pw-small text-pw-muted">{FINISH_DETAILS[activeFinish].sub}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(Object.keys(FINISH_DETAILS) as Finish[]).map((f) => {
                    const active = f === activeFinish;
                    const detail = FINISH_DETAILS[f];
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setActiveFinish(f)}
                        aria-pressed={active}
                        className={[
                          "flex flex-col items-stretch overflow-hidden rounded-pw border bg-pw-surface text-left transition-colors",
                          active ? "border-pw-ink ring-1 ring-pw-ink" : "border-pw-stone hover:border-pw-ink/40",
                        ].join(" ")}
                      >
                        <span
                          aria-hidden
                          className="block h-12 w-full"
                          style={{ background: detail.swatch }}
                        />
                        <span className="block px-3 py-2 text-center">
                          <span className="pw-small block font-semibold text-pw-ink">{detail.name}</span>
                          <span className="pw-overline block text-pw-muted">R{FINISH_PRICING[f][activeApplication]}/m²</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-col items-stretch gap-3">
                <Button href="/config" variant="primary" size="lg" className="w-full">
                  Design your wallpaper
                </Button>
                <TextLink href="/samples" className="text-center">
                  Order samples first
                </TextLink>
              </div>

              {/* Trust badges */}
              <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-pw-stone pt-6">
                {[
                  "72-hour production",
                  "Free SA shipping",
                  "Reprint guarantee",
                  "Made in Cape Town",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2 pw-small text-pw-ink/70">
                    <svg className="h-4 w-4 shrink-0 text-pw-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Product description ──────────────────────────────────────────────────
function ProductDescription() {
  return (
    <Section tone="surface" id="description">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="About this wallpaper"
            title="Made to order, cut to your wall."
          />
        </div>
        <div className="space-y-5 lg:col-span-7">
          <p className="pw-body-lg text-pw-ink/80">
            PaperWalls is custom wallpaper printed in Cape Town on commercial-grade
            substrate. There are no standard rolls or pre-printed designs. You upload
            any image, choose a finish, and we print exactly what you sent at exactly
            the size you measured.
          </p>
          <p className="pw-body text-pw-ink/70">
            Every order is checked for resolution against your wall before payment, cut
            to the millimetre, labelled in hanging order, and shipped with a printed
            install guide chosen for the substrate you picked. If anything ships
            imperfect, we reprint at no cost.
          </p>

          {/* Specs grid */}
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-pw-stone pt-6 sm:grid-cols-3">
            {[
              { label: "Substrate",       value: "Commercial-grade" },
              { label: "Finish options",  value: "Satin · Matte · Linen" },
              { label: "Application",     value: "Traditional or peel-and-stick" },
              { label: "Wall sizes",      value: "Any, cut to mm" },
              { label: "Production",      value: "72 hours" },
              { label: "Shipping",        value: "Free across SA" },
            ].map((spec) => (
              <div key={spec.label}>
                <dt className="pw-overline text-pw-muted">{spec.label}</dt>
                <dd className="pw-body mt-1 text-pw-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}

// ── Materials deep-dive ──────────────────────────────────────────────────
function MaterialsSection() {
  const finishes = [
    {
      name: "Satin", desc: "Subtle sheen with deep colour. Wipes clean. Sits comfortably in living rooms and family spaces.",
      range: "From R410/m²", src: "/images/product/pdp-07-satin.jpg", alt: "Macro of satin wallpaper with sheen and gsm label",
    },
    {
      name: "Matte", desc: "Completely flat, non-reflective. Renders fine detail without glare. Best for bright rooms.",
      range: "From R470/m²", src: "/images/product/pdp-08-matte.jpg", alt: "Macro of matte wallpaper with flat-finish label",
    },
    {
      name: "Linen", desc: "Textured, fabric-like surface. Catches light, adds depth. Designed to feel like a chosen material.",
      range: "From R590/m²", src: "/images/product/pdp-09-linen.jpg", alt: "Macro of linen-textured wallpaper with weave and gsm label",
    },
  ];

  return (
    <Section tone="bg" id="materials">
      <SectionHeader
        eyebrow="Three finishes"
        title="Same press, three surfaces."
        body="Every order goes through the same commercial press. The choice is finish, how the surface catches light, and how the wallpaper feels under your hand."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
        {finishes.map((f) => (
          <article key={f.name} className="flex flex-col rounded-pw-card border border-pw-stone bg-pw-surface overflow-hidden">
            <ImagePlaceholder
              src={f.src}
              aspectRatio="4/3"
              prompt={f.alt}
            />
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="pw-h3 text-pw-ink">{f.name}</h3>
                <span className="pw-small whitespace-nowrap text-pw-muted">{f.range}</span>
              </div>
              <p className="pw-body mt-3 text-pw-ink/70">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

// ── What's in the box ────────────────────────────────────────────────────
function WhatsInBox() {
  return (
    <Section tone="surface" id="whats-in-box">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-6">
          <ImagePlaceholder
            src="/images/product/pdp-10-unboxing.jpg"
            aspectRatio="4/3"
            prompt="Flat-lay of unboxed PaperWalls contents with each item labelled"
          />
        </div>
        <div className="lg:col-span-6">
          <SectionHeader
            eyebrow="What's in the box"
            title="Made to be unboxed."
          />
          <ul className="mt-7 space-y-5">
            {[
              { t: "Your wallpaper, panel by panel",     b: "Cut to your dimensions, labelled in hanging order so you know exactly which panel goes where." },
              { t: "Substrate-specific install guide",   b: "Step-by-step printed instructions for either paste-the-wall or peel-and-stick, depending on what you ordered." },
              { t: "Kraft-paper presentation",           b: "Rolls protected in kraft paper with a cotton ribbon. Not throwaway packaging." },
              { t: "Care card with the reprint promise", b: "If anything ships imperfect, send a photo within 7 days. Replacement on the press within 48 hours." },
            ].map((item) => (
              <li key={item.t} className="flex gap-4">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pw-accent" />
                <div>
                  <h3 className="pw-h3 text-pw-ink">{item.t}</h3>
                  <p className="pw-body mt-1.5 text-pw-ink/70">{item.b}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ── Real homes gallery ────────────────────────────────────────────────────
function RealHomesGallery() {
  const images = [
    { src: "/images/product/pdp-11-home-1.jpg", caption: "Watercolour · Matte · Dining room",  alt: "Dining room with custom watercolour wallpaper, five-star caption" },
    { src: "/images/product/pdp-12-home-2.jpg", caption: "Geometric · Satin · Reading nook",   alt: "Reading nook with custom geometric wallpaper, five-star caption" },
    { src: "/images/product/pdp-13-home-3.jpg", caption: "Landscape · Linen · Home office",    alt: "Home office with custom landscape wallpaper, five-star caption" },
  ];

  return (
    <Section tone="bg" id="real-homes">
      <SectionHeader
        eyebrow="In real homes"
        title="Different walls, same press."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
        {images.map((img, i) => (
          <figure key={i}>
            <ImagePlaceholder
              src={img.src}
              aspectRatio="4/5"
              prompt={img.alt}
            />
            <figcaption className="pw-small mt-2 text-pw-muted">{img.caption}</figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

// ── Comparison ──────────────────────────────────────────────────────────
function ComparisonSection() {
  const rows = [
    { label: "Use your own image",         us: true,  themLabel: "Stock patterns only" },
    { label: "Cut to your exact wall",     us: true,  themLabel: "Standard rolls only" },
    { label: "Made-to-order",              us: true,  themLabel: "Warehouse stock" },
    { label: "72-hour production",         us: true,  themLabel: "1 to 2 weeks typical" },
    { label: "Free nationwide shipping",   us: true,  themLabel: "Varies, often paid" },
    { label: "Resolution checked pre-pay", us: true,  themLabel: "No file pre-check" },
    { label: "Reprint guarantee",          us: true,  themLabel: "Limited or none" },
  ];

  return (
    <Section tone="surface" id="comparison">
      <SectionHeader
        eyebrow="The difference"
        title="PaperWalls vs standard wallpaper."
        body="Most wallpaper is printed in bulk and sold by the roll. We print one wall at a time, to the millimetre, in your image."
      />

      <div className="mt-8 sm:mt-12">
        <div className="overflow-hidden rounded-pw-card border border-pw-stone">
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-pw-stone/40 sm:grid-cols-[1.6fr_1fr_1fr]">
            <div className="px-4 py-4 sm:px-6 sm:py-5"></div>
            <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-accent">PaperWalls</span>
            </div>
            <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-muted">Standard wallpaper</span>
            </div>
          </div>

          <ul>
            {rows.map((row, i) => (
              <li
                key={row.label}
                className={[
                  "grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr]",
                  i % 2 === 0 ? "bg-pw-bg" : "bg-pw-surface",
                ].join(" ")}
              >
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body font-medium text-pw-ink">{row.label}</span>
                </div>
                <div className="flex items-center justify-center px-3 py-4 sm:px-6 sm:py-5">
                  {row.us && (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pw-accent-soft text-pw-accent">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center px-3 py-4 text-center sm:px-6 sm:py-5">
                  <span className="pw-small text-pw-muted">{row.themLabel}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ── Sample-pack rail ─────────────────────────────────────────────────────
function SamplePackBanner() {
  return (
    <section className="bg-pw-stone">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-10 sm:gap-10 sm:px-8 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-12 lg:py-20">
        <div className="lg:col-span-5">
          <ImagePlaceholder
            src="/images/product/pdp-14-sample.jpg"
            aspectRatio="4/3"
            prompt="Sample pack with R150 credit-back overlay"
          />
        </div>
        <div className="lg:col-span-7">
          <Eyebrow variant="muted">Risk-free</Eyebrow>
          <h2 className="pw-h2 mt-3 text-pw-ink">
            Feel the materials in your hand first.
          </h2>
          <p className="pw-body-lg mt-4 max-w-xl text-pw-ink/70">
            A5 swatches of every finish, printed on the same press as your final order.
            R300, ships free, arrives in 3 to 5 days.
          </p>
          <div className="mt-6">
            <Button href="/samples" variant="primary" size="lg" className="w-full sm:w-auto">
              Order sample pack · R300
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "How do I measure my wall?",
    a: "Width × height in centimetres, edge to edge at the widest and tallest points. Add 5 cm bleed on each side for a clean trim. We cut every order to the millimetre, so measure twice. The configurator has a guide if you get stuck.",
  },
  {
    q: "What resolution does my image need to be?",
    a: "It depends on your wall size. As a rule of thumb, you want roughly 25 pixels per cm of wall (so a 200 cm × 250 cm wall needs at least 5,000 × 6,250 px). The configurator checks your image against your dimensions before you pay and tells you if it's too small.",
  },
  {
    q: "What's included with my order?",
    a: "Every order ships with: your wallpaper printed to your exact dimensions, panels labelled in hanging order, kraft-paper packaging, and a substrate-specific printed install guide. Free nationwide shipping included.",
  },
  {
    q: "Can I install it myself?",
    a: "Yes. Most customers hang their wall in an afternoon. The install guide is substrate-specific (paste-the-wall vs peel-and-stick). If you'd rather not, a certified pro installer is available at checkout.",
  },
  {
    q: "What if it ships damaged or misprinted?",
    a: "We reprint at no cost. Send us a photo within 7 days of delivery and we'll have the replacement on the press within 48 hours.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship across South Africa only. International shipping is on the roadmap. For commercial or bulk orders abroad, contact us directly.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section tone="bg" id="faq">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Common questions"
            title="Everything ordering-related, answered."
            body={
              <>
                Need something specific?{" "}
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

// ── Closing CTA ─────────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <Section tone="ink" id="closing-cta" density="default">
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow className="text-pw-accent-mid">Ready when you are</Eyebrow>
          <h2 className="pw-display mt-3 text-white sm:mt-4">
            Your image. Your wall. This week.
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

// ── Sticky mobile CTA — past hero through to closing CTA ──────────────────
function StickyMobileCTA({ price }: { price: number }) {
  const [pastHero,    setPastHero]    = useState(false);
  const [closingNear, setClosingNear] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const hero = document.getElementById("buy-box");
    let obsHero: IntersectionObserver | undefined;
    if (hero) {
      obsHero = new IntersectionObserver(
        ([entry]) => setPastHero(!entry.isIntersecting),
        { threshold: 0, rootMargin: "0px 0px -90% 0px" }
      );
      obsHero.observe(hero);
    }

    const closing = document.getElementById("closing-cta");
    let obsClosing: IntersectionObserver | undefined;
    if (closing) {
      obsClosing = new IntersectionObserver(
        ([entry]) => setClosingNear(entry.isIntersecting),
        { threshold: 0, rootMargin: "0px 0px -100px 0px" }
      );
      obsClosing.observe(closing);
    }

    return () => {
      obsHero?.disconnect();
      obsClosing?.disconnect();
    };
  }, []);

  const visible = pastHero && !closingNear;

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-pw-stone bg-pw-bg/95 backdrop-blur transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex flex-1 flex-col">
          <span className="pw-overline text-pw-muted">From</span>
          <span className="pw-h3 text-pw-ink">R{price} / m²</span>
        </div>
        <Button href="/config" variant="primary" size="md" className="shrink-0 px-6">
          Design yours
        </Button>
      </div>
    </div>
  );
}
