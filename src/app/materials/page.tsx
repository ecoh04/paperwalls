import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "Materials | PaperWalls",
  description: "Compare Satin, Matte, and Linen finishes. Same press, three surfaces.",
};

const FINISHES = [
  {
    name:   "Satin",
    sub:    "Subtle sheen, easy clean",
    body:   "Soft sheen with deep colour. Wipes clean. The all-rounder for living rooms and family spaces.",
    image:  "/images/product/pdp-07-satin.jpg",
    bestFor:"Living rooms, hallways, family homes",
    price:  "From R410/m²",
    tag:    "Most ordered",
  },
  {
    name:   "Matte",
    sub:    "Flat, non-reflective",
    body:   "Completely flat surface. Renders fine detail without glare. Best in rooms with strong daylight.",
    image:  "/images/product/pdp-08-matte.jpg",
    bestFor:"Bedrooms, offices, bright rooms",
    price:  "From R470/m²",
  },
  {
    name:   "Linen",
    sub:    "Textured, premium feel",
    body:   "Fabric-like weave. Catches light, adds depth. Designed to feel like a chosen material, not generic wallpaper.",
    image:  "/images/product/pdp-09-linen.jpg",
    bestFor:"Feature walls, hospitality, statement rooms",
    price:  "From R590/m²",
    tag:    "Most premium",
  },
];

const COMPARISON_ROWS = [
  { label: "Look",  satin: "Slight sheen",       matte: "Flat",            linen: "Textured weave" },
  { label: "Glare", satin: "Medium",             matte: "Low",             linen: "Low" },
  { label: "Care",  satin: "Wipes clean easily", matte: "Easy care",       linen: "Gentle clean" },
  { label: "Best",  satin: "Family rooms",       matte: "Bright rooms",    linen: "Statement walls" },
];

const FAQ = [
  {
    q: "Does the finish change print quality?",
    a: "No. All finishes are printed on the same commercial press. The difference is texture and how light hits the surface.",
  },
  {
    q: "Which finish is easiest to maintain?",
    a: "Satin wipes clean most easily. Matte and Linen need a gentler touch but hide minor wall imperfections better.",
  },
  {
    q: "Can I see the finishes before I buy?",
    a: "Yes. The sample pack is R300 with all three finishes, and R150 of it credits back when you order wallpaper.",
  },
];

export default function MaterialsPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Materials</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Same press, three surfaces.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Pick a finish based on look, lighting, and how the wall is used. Not on guesswork.
          </p>
        </div>
      </header>

      {/* Three finish cards */}
      <Section tone="bg" id="finishes">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
          {FINISHES.map((f) => (
            <article key={f.name} className="flex flex-col overflow-hidden rounded-pw-card border border-pw-stone bg-pw-surface">
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
                  <h2 className="pw-h3 text-pw-ink">{f.name}</h2>
                  <span className="pw-small whitespace-nowrap text-pw-muted">{f.sub}</span>
                </div>
                <p className="pw-body mt-3 text-pw-ink/70">{f.body}</p>
                <div className="mt-5 border-t border-pw-stone pt-4">
                  <p className="pw-overline text-pw-muted-light">Best for</p>
                  <p className="pw-small mt-1 text-pw-ink">{f.bestFor}</p>
                </div>
                <p className="pw-small mt-3 font-medium text-pw-ink">{f.price}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Comparison table */}
      <Section tone="surface" id="compare">
        <SectionHeader
          eyebrow="Side by side"
          title="Quick comparison."
        />
        <div className="mt-8 overflow-hidden rounded-pw-card border border-pw-stone sm:mt-10">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-pw-stone/40">
            <div className="px-4 py-4 sm:px-6 sm:py-5"></div>
            <div className="px-3 py-4 text-center sm:px-6 sm:py-5"><span className="pw-overline text-pw-ink">Satin</span></div>
            <div className="px-3 py-4 text-center sm:px-6 sm:py-5"><span className="pw-overline text-pw-ink">Matte</span></div>
            <div className="px-3 py-4 text-center sm:px-6 sm:py-5"><span className="pw-overline text-pw-accent">Linen</span></div>
          </div>
          <ul>
            {COMPARISON_ROWS.map((row, i) => (
              <li
                key={row.label}
                className={[
                  "grid grid-cols-[1fr_1fr_1fr_1fr]",
                  i % 2 === 0 ? "bg-pw-bg" : "bg-pw-surface",
                ].join(" ")}
              >
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <span className="pw-small font-medium text-pw-ink">{row.label}</span>
                </div>
                <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
                  <span className="pw-small text-pw-ink/70">{row.satin}</span>
                </div>
                <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
                  <span className="pw-small text-pw-ink/70">{row.matte}</span>
                </div>
                <div className="px-3 py-4 text-center sm:px-6 sm:py-5">
                  <span className="pw-small text-pw-ink/70">{row.linen}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="bg" id="faq">
        <SectionHeader eyebrow="Common questions" title="Quick answers." />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-3">
          {FAQ.map((f) => (
            <article key={f.q} className="rounded-pw-card border border-pw-stone bg-pw-surface p-6">
              <h3 className="pw-h3 text-pw-ink">{f.q}</h3>
              <p className="pw-body mt-3 text-pw-ink/70">{f.a}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Still deciding?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Hold them in your hand.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              R300 sample pack with all three finishes. R150 credits back when you order wallpaper.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/samples" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Order sample pack
            </Button>
            <Button href="/config" variant="ghost" size="md" className="text-white/85 hover:text-white">
              Or skip to designing →
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
