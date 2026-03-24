import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

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

export default function InspirationPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Inspiration" }]} />

      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-pw-accent">Gallery</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-pw-ink">Inspiration</h1>
        <p className="mt-4 text-base text-pw-muted leading-relaxed">
          Explore ideas, then upload your own image to create a one-of-one wall for your space.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {IDEAS.map((idea) => (
          <article
            key={idea.title}
            className="overflow-hidden rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface"
          >
            <div className="h-48 w-full" style={{ background: idea.style }} />
            <div className="p-4">
              <h2 className="text-base font-semibold text-pw-ink">{idea.title}</h2>
              <p className="mt-1 text-sm text-pw-muted">{idea.caption}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="text-pw-ink font-medium">Use your own image, not a template.</p>
        <p className="mt-1 text-sm text-pw-muted">
          Every order is custom printed to your dimensions and cropped to fit your wall.
        </p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
        >
          Upload your design
        </Link>
      </div>
    </PageContainer>
  );
}
