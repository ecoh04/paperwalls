import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

export const metadata = {
  title: "Inspiration | PaperWalls",
  description: "Inspiration for custom wallpaper ideas, styles, and room concepts.",
};

const IDEAS = [
  {
    title: "Soft botanical tones",
    caption: "Bedrooms and calm lounges",
    style: "linear-gradient(135deg, #8b7355 0%, #6b543c 30%, #4a3728 60%, #7c6245 100%)",
  },
  {
    title: "Minimal texture",
    caption: "Scandinavian and modern spaces",
    style:
      "repeating-linear-gradient(30deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px), repeating-linear-gradient(-30deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px), #c5beaa",
  },
  {
    title: "Moody contrast",
    caption: "Feature walls and hospitality",
    style:
      "radial-gradient(circle at 20% 30%, rgba(196,98,45,0.5) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(196,98,45,0.3) 0%, transparent 25%), #2e2a26",
  },
];

const STARTER_PROMPTS = [
  "Moody abstract mural for a modern bedroom",
  "Warm neutral textured landscape for lounge wall",
  "Botanical line art in soft beige and clay tones",
  "Minimal geometric pattern for office feature wall",
];

export default function InspirationPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Inspiration" }]} />

      <ConversionPageIntro
        eyebrow="Gallery"
        title="Inspiration"
        description="Use these styles as direction, then upload your own image to build a one-of-one wall."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {IDEAS.map((idea) => (
          <article
            key={idea.title}
            className="overflow-hidden rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface"
          >
            <div className="h-48 w-full" style={{ background: idea.style }} />
            <div className="p-4">
              <h2 className="font-sans text-lg font-semibold text-pw-ink">{idea.title}</h2>
              <p className="mt-1 text-sm text-pw-ink/75">{idea.caption}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <h2 className="font-sans text-lg font-semibold text-pw-ink">Prompt ideas for generating artwork</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {STARTER_PROMPTS.map((prompt) => (
            <li key={prompt} className="rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-surface px-3 py-2 text-sm text-pw-ink/80">
              {prompt}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="font-sans text-lg font-semibold text-pw-ink">Use your own image, not a template.</p>
        <p className="mt-1 text-sm text-pw-ink/75">
          Every order is custom printed to your dimensions and cropped to fit your wall.
          You stay in control of the final look.
        </p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
        >
          Upload your design
        </Link>
      </div>
    </PageContainer>
  );
}
