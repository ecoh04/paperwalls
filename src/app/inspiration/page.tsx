import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "Inspiration | PaperWalls",
  description: "Real customer walls. Use them as direction, then upload your own image.",
};

const REAL_HOMES = [
  {
    src:     "/images/product/pdp-11-home-1.jpg",
    caption: "Watercolour botanical · Matte · Dining room",
    alt:     "Dining room with custom watercolour wallpaper as a feature wall",
  },
  {
    src:     "/images/product/pdp-12-home-2.jpg",
    caption: "Geometric pattern · Satin · Reading nook",
    alt:     "Reading nook with custom geometric wallpaper, oatmeal armchair, brass lamp",
  },
  {
    src:     "/images/product/pdp-13-home-3.jpg",
    caption: "Abstract landscape · Linen · Home office",
    alt:     "Home office with abstract landscape mural, walnut desk, brass lamp",
  },
];

const PROMPT_IDEAS = [
  "Soft botanical mural in muted clay and sage tones",
  "Abstract watercolour landscape, warm earth palette",
  "Minimal geometric pattern, oatmeal and charcoal",
  "Hand-drawn line illustration, off-white background",
  "Moody nocturnal forest, deep greens and ochres",
  "Vintage map, sepia and ink, lightly faded",
];

export default function InspirationPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Inspiration</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Real walls in real homes.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Use them as direction. Then upload your own image and build a one-of-one wall.
          </p>
        </div>
      </header>

      <Section tone="bg" id="real-homes">
        <SectionHeader
          eyebrow="In real homes"
          title="Different walls, same press."
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6">
          {REAL_HOMES.map((img) => (
            <figure key={img.src}>
              <ImagePlaceholder
                src={img.src}
                aspectRatio="4/5"
                prompt={img.alt}
              />
              <figcaption className="pw-small mt-3 text-pw-muted">{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section tone="surface" id="prompts">
        <SectionHeader
          eyebrow="Starting points"
          title="Prompt ideas if you're generating artwork."
          body="Drop these into Midjourney, DALL·E, or Higgsfield to generate something custom. Or just upload a photo you already have."
        />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2">
          {PROMPT_IDEAS.map((p) => (
            <div
              key={p}
              className="rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 sm:px-5"
            >
              <p className="pw-body text-pw-ink/80">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Use your own image</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Not a template.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Every order is custom-printed to your dimensions. You stay in control of the final look.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Upload your design
            </Button>
            <span className="pw-small text-center text-white/45 lg:text-right">
              Free SA delivery. Yours in 5 days.
            </span>
          </div>
        </div>
      </Section>
    </main>
  );
}
