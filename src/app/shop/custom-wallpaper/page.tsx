"use client";

import { useEffect, useRef, useState } from "react";
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
      <ProcessStrip />
      <MaterialsSection />
      <RealHomesGallery />
      <PricingExamples />
      <ComparisonSection />
      <WhatsInBox />
      <SamplePackBanner />
      <FAQSection />
      <ClosingCTA />
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
// Cold-traffic gallery: each slot kills one decision-blocking objection,
// in priority order. NO spec language on the images — outcome only.
// 1. Dream            — pure aspiration, no overlay
// 2. Transformation   — same wall before/after ("will it look good?")
// 3. Price anchor     — vs decorator alternative ("can I afford it?")
// 4. Time / ease      — solo install in 2 hours ("is it a hassle?")
// 5. Renter-safe      — peels off clean ("will I lose my deposit?")
// 6. Social proof     — grid of real ZA homes + ★★★★★ ("is anyone else doing this?")
const BUY_BOX_IMAGES = [
  { src: "/images/product/pdp-01-hero.jpg",        alt: "Custom wallpaper in a sunlit living room" },
  { src: "/images/product/pdp-02-transform.jpg",   alt: "Same wall before and after, plain rental wall transformed by custom wallpaper" },
  { src: "/images/product/pdp-03-price.jpg",       alt: "Finished feature wall with overlay anchoring price against a decorator's quote" },
  { src: "/images/product/pdp-04-ease.jpg",        alt: "One person installing wallpaper solo in two hours with overlay copy" },
  { src: "/images/product/pdp-05-renter.jpg",      alt: "Hand peeling wallpaper cleanly off a wall with renter-safe overlay" },
  { src: "/images/product/pdp-06-proof.jpg",       alt: "Grid of four real South African customer homes with five-star overlay" },
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
      <div className="mx-auto max-w-7xl px-5 pt-6 pb-10 sm:px-8 sm:pt-8 sm:pb-14 lg:px-12 lg:pt-12 lg:pb-20">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">

          {/* GALLERY — left column on desktop, top on mobile */}
          <Gallery
            images={BUY_BOX_IMAGES}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
          />

          {/* PRODUCT INFO — right column on desktop (sticky), below gallery on mobile */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[7rem]">

              <ProductHeader price={price} />

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

              {/* CTAs — primary + two softer paths for cold traffic not ready to upload yet */}
              <div className="mt-7 flex flex-col items-stretch gap-3">
                <Button href="/config" variant="primary" size="lg" className="w-full">
                  Design your wallpaper
                </Button>
                <TextLink href="#pricing" className="text-center">
                  See prices for common wall sizes
                </TextLink>
                <TextLink href="/samples" className="text-center">
                  Order samples first
                </TextLink>
              </div>

              {/* Trust strip — outcome-led, not spec-led (cold-traffic memory rule) */}
              <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-pw-stone pt-6">
                {[
                  "Yours in 5 days",
                  "Free SA delivery",
                  "Free reprints, no questions",
                  "Printed in Cape Town",
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

// ── Product header (eyebrow + H1 + rating + price)
// Rendered twice in the buy box: once above the gallery on mobile (so cold
// traffic sees title + rating + price above the fold), once inside the
// sticky right column on desktop. Single source of truth, two render points.
function ProductHeader({ price }: { price: number }) {
  return (
    <>
      <Eyebrow>Custom wallpaper</Eyebrow>
      <h1 className="pw-h1 mt-3 text-pw-ink">
        Wallpaper printed to your wall.
      </h1>

      <div className="mt-5 flex items-baseline gap-3">
        <span className="pw-h2 text-pw-ink">R{price}</span>
        <span className="pw-body text-pw-muted">per m²</span>
      </div>
    </>
  );
}

// ── Gallery (snap-scroll carousel + thumbnail nav) ────────────────────────
// Carousel is the source of truth for activeImage; thumbnails and arrows
// scroll the carousel programmatically; scroll position is the only signal
// that updates activeImage (no bidirectional loop).
type GalleryImage = { src: string; alt: string };

function Gallery({
  images, activeImage, setActiveImage,
}: {
  images: readonly GalleryImage[];
  activeImage: number;
  setActiveImage: (i: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Derive activeImage from scroll position (rAF-throttled).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        if (idx !== activeImage) setActiveImage(idx);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [activeImage, setActiveImage]);

  return (
    <div className="lg:col-span-7">
      {/* Carousel */}
      <div className="relative overflow-hidden rounded-pw-card">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {images.map((img, i) => (
            <div key={i} className="snap-start shrink-0 w-full">
              <ImagePlaceholder
                src={img.src}
                aspectRatio="1/1"
                priority={i === 0}
                sizes="(min-width: 1024px) 58vw, 100vw"
                prompt={img.alt}
                className="rounded-none"
              />
            </div>
          ))}
        </div>

        {/* Desktop arrows — quiet circular buttons, fade out at edges */}
        <button
          type="button"
          onClick={() => goTo(Math.max(0, activeImage - 1))}
          aria-label="Previous image"
          className={[
            "hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-opacity",
            activeImage === 0 ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <svg className="h-4 w-4 text-pw-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => goTo(Math.min(images.length - 1, activeImage + 1))}
          aria-label="Next image"
          className={[
            "hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-opacity",
            activeImage === images.length - 1 ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <svg className="h-4 w-4 text-pw-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Mobile dot indicators — active dot wider, others narrow */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={[
                "h-1.5 rounded-full transition-all",
                i === activeImage ? "w-5 bg-white" : "w-1.5 bg-white/55",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail nav — 3 cols mobile (2 rows of 3), 6 cols desktop (1 row) */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3 sm:grid-cols-6">
        {images.map((img, i) => {
          const active = i === activeImage;
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
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
                sizes="(min-width: 640px) 12vw, 33vw"
                prompt={img.alt}
              />
            </button>
          );
        })}
      </div>
    </div>
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

// ── Pricing examples — common wall sizes, kills "what does my wall cost" stall
function PricingExamples() {
  const walls = [
    { use: "Behind a sofa",        size: "2.4 × 3 m",   m2: 7.2 },
    { use: "Bedroom feature wall", size: "2.7 × 3.6 m", m2: 9.72 },
    { use: "Dining room",          size: "3 × 4 m",     m2: 12 },
    { use: "Hallway accent",       size: "2.4 × 1.2 m", m2: 2.88 },
  ];

  const fmt = (n: number) => `R${Math.round(n).toLocaleString("en-US")}`;

  return (
    <Section tone="bg" id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="What your wall will cost."
        body="Free delivery, 5-day production. Below are the most common rooms, in traditional paste-the-wall finish. Peel & stick adds about R80/m²."
      />

      <div className="mt-8 sm:mt-12">
        <div className="overflow-hidden rounded-pw-card border border-pw-stone bg-pw-surface">
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-pw-stone/40 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-ink">Wall</span>
            </div>
            <div className="px-3 py-4 text-right sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-ink">Satin</span>
            </div>
            <div className="px-3 py-4 text-right sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-ink">Matte</span>
            </div>
            <div className="px-3 py-4 text-right sm:px-6 sm:py-5">
              <span className="pw-overline text-pw-accent">Linen</span>
            </div>
          </div>

          <ul>
            {walls.map((w, i) => (
              <li
                key={w.use}
                className={[
                  "grid grid-cols-[1.4fr_1fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr_1fr]",
                  i % 2 === 0 ? "bg-pw-bg" : "bg-pw-surface",
                ].join(" ")}
              >
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body block font-medium text-pw-ink">{w.use}</span>
                  <span className="pw-small block text-pw-muted">{w.size}</span>
                </div>
                <div className="flex items-center justify-end px-3 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body text-pw-ink">
                    {fmt(w.m2 * FINISH_PRICING.satin.traditional)}
                  </span>
                </div>
                <div className="flex items-center justify-end px-3 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body text-pw-ink">
                    {fmt(w.m2 * FINISH_PRICING.matte.traditional)}
                  </span>
                </div>
                <div className="flex items-center justify-end px-3 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body font-medium text-pw-ink">
                    {fmt(w.m2 * FINISH_PRICING.linen.traditional)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Closing CTA on this section — reduces the friction to /config */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-6">
          <Button href="/config" variant="primary" size="md">
            Get the exact price for your wall
          </Button>
          <span className="pw-small text-pw-muted">
            Takes about 60 seconds. No payment yet.
          </span>
        </div>
      </div>
    </Section>
  );
}

// ── Process strip — three-icon how-it-works for ad-traffic landing here ──
// Cold buyers from paid traffic land on the PDP without visiting /how-it-works.
// This 3-step strip gives a one-glance answer to "how does this even work?"
// without sending them off to another page.
function ProcessStrip() {
  const STEPS = [
    {
      title: "Upload your image",
      body:  "Any photo, art, or pattern. JPG, PNG, or WebP up to 50 MB.",
      icon:  (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      ),
    },
    {
      title: "We print in Cape Town",
      body:  "Commercial press, cut to the millimetre, packed in kraft. 72-hour production.",
      icon:  (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M6.75 7.5h10.5m-10.5 3h10.5m-10.5 3h7.5M3.375 19.5h17.25c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v12.75c0 .621.504 1.125 1.125 1.125Z"
        />
      ),
    },
    {
      title: "Free SA delivery",
      body:  "Tracked courier, anywhere in South Africa. Yours in 5 days.",
      icon:  (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9-1.5h9.75a.75.75 0 0 0 .75-.75V8.25A2.25 2.25 0 0 0 15 6h-3.75M14.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.5a.75.75 0 0 0 .75-.75v-7.5m0 0L18 6.75m1.5 4.5h.75a.75.75 0 0 1 .75.75V18a.75.75 0 0 1-.75.75H18.75M3 4.5v9.75A.75.75 0 0 0 3.75 15h7.5a.75.75 0 0 0 .75-.75v-9.75a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0-.75.75Z"
        />
      ),
    },
  ];

  return (
    <Section tone="bg" density="tight" id="process">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pw-ink/20 bg-pw-surface">
                <svg className="h-5 w-5 text-pw-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  {s.icon}
                </svg>
              </span>
              <p className="pw-overline text-pw-muted">Step {i + 1}</p>
            </div>
            <h3 className="pw-h3 mt-3 text-pw-ink">{s.title}</h3>
            <p className="pw-body mt-1.5 text-pw-ink/70">{s.body}</p>
          </div>
        ))}
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
  const safety = [
    "Free reprints if anything ships imperfect",
    "Samples first? R150 in. Off your first order.",
    "No payment until you approve the price",
  ];

  return (
    <Section tone="ink" id="closing-cta" density="default">
      <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-start lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow className="text-pw-accent-mid">Ready when you are</Eyebrow>
          <h2 className="pw-display mt-3 text-white sm:mt-4">
            Your image. Your wall. This week.
          </h2>
          <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
            Upload your photo, choose your finish, get a live price in under sixty seconds.
          </p>
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5 lg:items-end">
          <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
            Design your wallpaper
          </Button>

          {/* Safety-net reminders, restated at the close */}
          <ul className="space-y-2.5 lg:text-right">
            {safety.map((line) => (
              <li key={line} className="flex items-start gap-2.5 lg:flex-row-reverse lg:gap-2.5">
                <svg
                  aria-hidden
                  className="mt-[3px] h-4 w-4 shrink-0 text-pw-accent-mid"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="pw-small text-white/70">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

