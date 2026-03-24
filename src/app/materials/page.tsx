import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Materials | PaperWalls",
  description: "Compare PaperWalls materials and choose the right finish for your wall.",
};

const MATERIALS = [
  {
    name: "Satin",
    use: "Balanced sheen and durability",
    body: "Subtle sheen with strong color depth. A practical all-rounder for most living spaces.",
    bestFor: "Living rooms, feature walls, family homes",
  },
  {
    name: "Matte",
    use: "Low-reflection, modern look",
    body: "A flat, non-reflective finish that minimizes glare and keeps visuals clean in bright rooms.",
    bestFor: "Bedrooms, offices, bright spaces",
  },
  {
    name: "Linen",
    use: "Textured premium finish",
    body: "Fabric-like texture that adds depth and warmth. Premium tactile feel for upscale interiors.",
    bestFor: "Boutique spaces, hospitality, statement rooms",
  },
];

const FAQ = [
  {
    q: "Does material affect print quality?",
    a: "All materials are printed on the same commercial press. The difference is finish, texture, and light reflection.",
  },
  {
    q: "Which material is easiest to maintain?",
    a: "Satin is typically the easiest to wipe clean. Matte and Linen are better when you want less shine.",
  },
  {
    q: "Can I preview pricing by material?",
    a: "Yes. In the configurator, switch type/material and the total updates immediately.",
  },
];

export default function MaterialsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Materials" }]} />

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-accent">Substrates</p>
        <h1 className="mt-3 font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">Materials</h1>
        <p className="mt-4 text-base sm:text-lg text-pw-ink/80 leading-relaxed">
          Pick a finish based on look, lighting, and room use - not guesswork.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {MATERIALS.map((m) => (
          <article
            key={m.name}
            className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5"
          >
            <h2 className="font-sans text-xl font-semibold text-pw-ink">{m.name}</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-pw-accent">{m.use}</p>
            <p className="mt-3 text-[15px] text-pw-ink/75 leading-relaxed">{m.body}</p>
            <p className="mt-4 border-t border-[rgba(26,23,20,0.08)] pt-3 text-sm text-pw-ink">
              <span className="font-semibold">Best for:</span> {m.bestFor}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {FAQ.map((f) => (
          <article key={f.q} className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-5">
            <h3 className="font-sans text-base font-semibold text-pw-ink">{f.q}</h3>
            <p className="mt-2 text-sm text-pw-ink/75 leading-relaxed">{f.a}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="text-sm text-pw-ink/80">
          Final price depends on wallpaper type (Traditional or Peel & Stick), material (Satin/Matte/Linen),
          total area, and installation choice.
        </p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
        >
          Compare live in configurator
        </Link>
      </div>
    </PageContainer>
  );
}
