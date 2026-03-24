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
    body: "A versatile finish with a subtle sheen that enhances color depth. Great for most living spaces.",
  },
  {
    name: "Matte",
    use: "Low-reflection, modern look",
    body: "A flat, non-reflective finish that reduces glare and keeps detail soft and clean in bright rooms.",
  },
  {
    name: "Linen",
    use: "Textured premium finish",
    body: "A fabric-like texture that adds depth and warmth. Ideal when you want a richer, high-end look.",
  },
];

export default function MaterialsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Materials" }]} />

      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-pw-accent">Substrates</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-pw-ink">Materials</h1>
        <p className="mt-4 text-base text-pw-muted leading-relaxed">
          Choose the finish that matches your space and installation style.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {MATERIALS.map((m) => (
          <article
            key={m.name}
            className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5"
          >
            <h2 className="text-xl font-semibold text-pw-ink">{m.name}</h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-pw-accent">{m.use}</p>
            <p className="mt-3 text-sm text-pw-muted leading-relaxed">{m.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="text-sm text-pw-muted">
          Material pricing depends on wallpaper type (Traditional or Peel & Stick) and your wall area.
        </p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
        >
          Compare live in configurator
        </Link>
      </div>
    </PageContainer>
  );
}
