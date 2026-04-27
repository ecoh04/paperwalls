"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

// CRO-tuned product page. Key conversion elements:
//   - Hero with PRICE ANCHOR ("From R410/m²") above-the-fold
//   - Benefits strip immediately after hero (4 trust signals at-a-glance)
//   - In-real-homes proof BEFORE the buy box (belief before decision)
//   - Choose-your-finish buy box with anchor pricing + "Most ordered" pill
//   - Side-by-side editorial: what arrives + how to hang
//   - Comparison table (PaperWalls vs Standard) — high-converting element
//   - Sample-pack risk reversal
//   - Product-specific FAQ destroying ordering objections
//   - Closing CTA + sticky mobile bar (appears after hero scroll)

export default function CustomWallpaperPage() {
  return (
    <>
      <HeroSection />
      <BenefitsStrip />
      <GalleryProof />
      <ProcessSection />
      <FinishesSection />
      <ExperienceSection />
      <ComparisonSection />
      <SamplePackBanner />
      <FAQSection />
      <ClosingCTA />
      <StickyMobileCTA />
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

// ── 1. Hero — product H1 + price anchor + dual CTA ────────────────────────
function HeroSection() {
  return (
    <section className="bg-pw-bg" id="product-hero">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pb-10 pt-6 sm:gap-10 sm:px-8 sm:pb-14 sm:pt-10 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">

        {/* Image first on mobile */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <ImagePlaceholder
            src="/images/product/product-hero.jpg"
            aspectRatio="4/3"
            aspectClassName="lg:!aspect-[4/5]"
            dimensions="1600×2000"
            prompt="Editorial bedroom photograph, custom-printed earthy abstract-pattern wallpaper covering a feature wall behind a low-profile linen-upholstered bed. Tan leather throw pillows, vintage ceramic table lamp, an open hardcover book, dried palm fronds in a stoneware vessel. Warm afternoon light from a tall right-side window, oak herringbone floors, white-washed plaster perimeter walls. Composition: portrait, eye-level, wallpaper occupies the full frame behind the bed. Apartmento × Aesop × Kinfolk. Photorealistic, no people."
          />
        </div>

        {/* Copy */}
        <div className="order-2 flex flex-col justify-center lg:order-1 lg:col-span-5">
          <Eyebrow>Custom wallpaper</Eyebrow>
          <h1 className="pw-display mt-4 text-pw-ink">
            Wallpaper printed exactly to your wall.
          </h1>
          <p className="pw-body-lg mt-4 max-w-md text-pw-ink/70 sm:mt-5">
            Upload any image. We print it commercial-grade, cut it to the millimetre,
            and ship it free across South Africa.
          </p>

          {/* Price anchor */}
          <div className="mt-6 flex items-baseline gap-3 sm:mt-8">
            <span className="pw-overline text-pw-muted">From</span>
            <span className="pw-h2 text-pw-ink">R410</span>
            <span className="pw-body text-pw-muted">per m²</span>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            <Button href="/config" variant="primary" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <TextLink href="/samples">Order samples first</TextLink>
          </div>

          {/* Trust micro-stats */}
          <ul className="mt-8 grid grid-cols-3 gap-3 sm:mt-12 sm:gap-6">
            {[
              { num: "72-hour",   label: "Production" },
              { num: "Free",      label: "Shipping" },
              { num: "Guaranteed", label: "Reprint cover" },
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

// ── 2. Benefits strip — 4 quick-trust at-a-glance ─────────────────────────
function BenefitsStrip() {
  const benefits = [
    { title: "72-hour production", body: "Through our press in 3 days. Tracking when it ships." },
    { title: "Free nationwide",    body: "Shipped free across South Africa, all 9 provinces." },
    { title: "Made-to-order",      body: "No standard sizes. No minimums. Cut to your wall." },
    { title: "Reprint guarantee",  body: "Defects on us. Send a photo within 7 days." },
  ];

  return (
    <Section tone="surface" density="tight">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 sm:gap-8">
        {benefits.map((b) => (
          <li key={b.title} className="flex flex-col gap-2">
            <h3 className="pw-h3 text-pw-ink">{b.title}</h3>
            <p className="pw-small text-pw-muted">{b.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ── 3. Gallery proof (compact, 3 images) ──────────────────────────────────
function GalleryProof() {
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
  ];

  return (
    <Section tone="bg" id="gallery">
      <SectionHeader
        eyebrow="In real homes"
        title="Wallpaper that becomes the room."
        body="Every print is unique to the customer who ordered it."
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-6">
        {images.map((img, i) => (
          <figure key={i}>
            <ImagePlaceholder
              src={img.src}
              aspectRatio="3/4"
              prompt={img.prompt}
            />
            <figcaption className="pw-small mt-2 text-pw-muted">{img.caption}</figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8 flex justify-center sm:mt-12">
        <TextLink href="/inspiration">See more inspiration →</TextLink>
      </div>
    </Section>
  );
}

// ── 4. Process — 3 steps reusing homepage images ──────────────────────────
function ProcessSection() {
  const steps = [
    {
      num:    "01",
      title:  "Upload your image",
      body:   "Any high-res JPG, PNG, or WebP. We check resolution against your wall size before you pay.",
      src:    "/images/home/process-1.jpg",
      prompt: "Hand uploading an image on a phone",
    },
    {
      num:    "02",
      title:  "Pick finish & size",
      body:   "Three finishes, two ways to apply, your wall in centimetres. Live price as you choose.",
      src:    "/images/home/process-2.jpg",
      prompt: "Wallpaper swatches arranged on a surface",
    },
    {
      num:    "03",
      title:  "We print, you hang",
      body:   "Through our press in 72 hours. Panels arrive rolled, labelled, with a substrate-specific install guide.",
      src:    "/images/home/process-3.jpg",
      prompt: "Hands smoothing wallpaper onto a wall",
    },
  ];

  return (
    <Section tone="surface" id="how">
      <SectionHeader
        eyebrow="How it works"
        title="From your photo to your wall."
        body="No design experience, no trade account, no minimums. Just an image and your dimensions."
      />

      <ol className="mt-8 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-3 sm:gap-8 lg:gap-10">
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

// ── 5. Finishes — anchor pricing ─────────────────────────────────────────
function FinishesSection() {
  const finishes = [
    {
      name:   "Satin",
      desc:   "Subtle sheen. Wipes clean. Sits comfortably in living rooms and family spaces.",
      range:  "R410 to R490",
      tag:    "Most ordered",
      src:    "/images/home/finish-satin.jpg",
      prompt: "Macro of satin-finish wallpaper",
    },
    {
      name:   "Matte",
      desc:   "Completely flat, non-reflective. Reads like fine art on the wall. Best for bright rooms.",
      range:  "R470 to R540",
      tag:    null,
      src:    "/images/home/finish-matte.jpg",
      prompt: "Macro of matte-finish wallpaper",
    },
    {
      name:   "Linen",
      desc:   "Textured, fabric-like. Catches light, adds depth. Designed to feel chosen, not generic.",
      range:  "R590 to R680",
      tag:    "Most premium",
      src:    "/images/home/finish-linen.jpg",
      prompt: "Macro of linen-textured wallpaper",
    },
  ];

  return (
    <Section tone="bg" id="finishes">
      <SectionHeader
        eyebrow="Choose your finish"
        title="Three finishes. One commercial press."
        body="Every order goes through the same machine. The choice is finish, how the surface catches light, and how it sticks to the wall."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
        {finishes.map((f) => (
          <article
            key={f.name}
            className="flex flex-col rounded-pw-card border border-pw-stone bg-pw-surface overflow-hidden"
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
                <span className="pw-h3 whitespace-nowrap text-pw-ink">{f.range}</span>
              </div>
              <p className="pw-small mt-1 text-pw-muted-light">per m²</p>
              <p className="pw-body mt-4 text-pw-ink/70">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2">
        <article className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-7">
          <h3 className="pw-h3 text-pw-ink">Traditional</h3>
          <p className="pw-small mt-1 text-pw-accent">Paste-the-wall</p>
          <p className="pw-body mt-3 text-pw-ink/70">
            Permanent, with the cleanest seams. Best for feature walls and rooms you&rsquo;re committing to.
          </p>
        </article>
        <article className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-7">
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

// ── 6. Experience — what arrives + how to hang (editorial 2-up) ───────────
function ExperienceSection() {
  return (
    <Section tone="surface">
      <SectionHeader
        eyebrow="What arrives"
        title="Made to be unboxed."
        body="Premium presentation, clear labelling, and an install guide chosen for the substrate you ordered."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        <article className="flex flex-col gap-5">
          <ImagePlaceholder
            src="/images/product/unboxing.jpg"
            aspectRatio="4/3"
            dimensions="1600×1200"
            prompt="Top-down editorial of a partially-unrolled wallpaper roll on a warm stone-coloured surface, kraft-paper packaging neatly folded to the side, a small printed care card with the PaperWalls logo visible. The wallpaper unrolled enough to show a beautiful botanical pattern in earthy sage, terracotta, and oat tones. Cotton ribbon tied in a loose knot on the kraft paper, scissors and measuring tape arranged thoughtfully but not staged. Soft natural side-light from the left. Mood: Aesop product photography meets Kinfolk craft. Photorealistic, sharp focus, no people."
          />
          <div>
            <h3 className="pw-h3 text-pw-ink">Premium presentation</h3>
            <p className="pw-body mt-3 text-pw-ink/70">
              Wallpaper rolls protected in kraft, every panel labelled in hanging order,
              and a printed care card with substrate-specific install instructions.
            </p>
          </div>
        </article>
        <article className="flex flex-col gap-5">
          <ImagePlaceholder
            src="/images/product/install-detail.jpg"
            aspectRatio="4/3"
            dimensions="1600×1200"
            prompt="Editorial close-up showing a wallpaper panel meeting a wall corner where it has just been smoothed onto the wall — only a hand and a smoothing brush visible, the rest of the frame is freshly-installed custom wallpaper showing crisp pattern detail and zero seams. Pattern is a warm muted botanical with rich colour saturation. Soft natural light from the left, oak floor visible at the bottom. Mood: artisanal craft, premium hotel-lobby quality. Photorealistic, sharp focus."
          />
          <div>
            <h3 className="pw-h3 text-pw-ink">Designed to be hung at home</h3>
            <p className="pw-body mt-3 text-pw-ink/70">
              Most customers hang it themselves in an afternoon. If you&rsquo;d rather not,
              a pro installer is available at checkout.
            </p>
          </div>
        </article>
      </div>
    </Section>
  );
}

// ── 7. Comparison — PaperWalls vs standard wallpaper ──────────────────────
function ComparisonSection() {
  const rows = [
    { label: "Use your own image",        us: true,  them: false, themLabel: "Stock patterns only" },
    { label: "Cut to your exact wall",    us: true,  them: false, themLabel: "Standard rolls only" },
    { label: "Made-to-order",             us: true,  them: false, themLabel: "Warehouse stock" },
    { label: "72-hour production",        us: true,  them: false, themLabel: "1 to 2 weeks typical" },
    { label: "Free nationwide shipping",  us: true,  them: false, themLabel: "Varies, often paid" },
    { label: "Resolution checked pre-pay", us: true, them: false, themLabel: "No file pre-check" },
    { label: "Reprint guarantee",         us: true,  them: false, themLabel: "Limited or none" },
  ];

  return (
    <Section tone="bg">
      <SectionHeader
        eyebrow="The difference"
        title="PaperWalls vs standard wallpaper."
        body="Most wallpaper is printed in bulk and sold by the roll. We print one wall at a time, to the millimetre, in your image."
      />

      <div className="mt-8 sm:mt-12">
        {/* Mobile: vertical stacked rows. Desktop: 3-col grid (feature, us, them). */}
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

          {/* Rows */}
          <ul>
            {rows.map((row, i) => (
              <li
                key={row.label}
                className={[
                  "grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr]",
                  i % 2 === 0 ? "bg-pw-surface" : "bg-pw-bg",
                ].join(" ")}
              >
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <span className="pw-body font-medium text-pw-ink">{row.label}</span>
                </div>
                <div className="flex items-center justify-center px-3 py-4 sm:px-6 sm:py-5">
                  {row.us ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pw-accent-soft text-pw-accent">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="pw-small text-pw-muted">—</span>
                  )}
                </div>
                <div className="flex items-center justify-center px-3 py-4 text-center sm:px-6 sm:py-5">
                  {row.them ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-pw-stone text-pw-ink/40">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="pw-small text-pw-muted">{row.themLabel}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ── 8. Sample-pack rail — risk reversal ──────────────────────────────────
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

// ── 9. FAQ — product-specific objection handling ─────────────────────────
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
    a: "Currently we ship across South Africa only. International shipping is on the roadmap. For commercial / bulk orders abroad, contact us directly.",
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

// ── 10. Closing CTA ──────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <Section tone="ink" density="default" id="closing-cta">
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

// ── 11. Sticky mobile CTA — appears after hero scroll, hides at closing CTA ──
function StickyMobileCTA() {
  const [pastHero,    setPastHero]    = useState(false);
  const [closingNear, setClosingNear] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const hero = document.getElementById("product-hero");
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
          <span className="pw-h3 text-pw-ink">R410 / m²</span>
        </div>
        <Button href="/config" variant="primary" size="md" className="shrink-0 px-6">
          Design yours
        </Button>
      </div>
    </div>
  );
}
