import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "How it works | PaperWalls",
  description: "From upload to delivery. The exact order flow for custom wallpaper, made-to-order in Cape Town.",
};

const STEPS = [
  {
    num:   "01",
    title: "Add your image",
    body:  "Drop in any photo, artwork, or pattern. JPG, PNG, or WebP up to 50 MB. We give you live feedback on whether it'll print sharply at your wall size.",
    tag:   "Quality checked",
    image: "/images/how-it-works/step-1-upload.jpg",
    alt:   "A hand holding a phone with a photo ready to upload, on a soft linen sofa",
  },
  {
    num:   "02",
    title: "Set your wall size",
    body:  "Width and height in centimetres, edge to edge. Configure one wall or up to four. We update the price the moment your numbers are valid.",
    tag:   "Live pricing",
    image: "/images/how-it-works/step-2-measure.jpg",
    alt:   "A hand pulling a tape measure across a plain off-white wall, marking it lightly",
  },
  {
    num:   "03",
    title: "We print and finish",
    body:  "Satin, Matte, or Linen on traditional paste-the-wall or peel-and-stick. Every order goes through the same commercial press in Cape Town, cut to the millimetre.",
    tag:   "Three finishes",
    image: "/images/how-it-works/step-3-print.jpg",
    alt:   "Wide-format print press in mid-run, custom wallpaper emerging from the rollers",
  },
  {
    num:   "04",
    title: "Yours in 5 days",
    body:  "Packed in kraft paper with cotton ribbon, dispatched within 72 hours, free tracked courier across SA. Hang it yourself with the printed install guide, or add a pro installer.",
    tag:   "Free SA delivery",
    image: "/images/how-it-works/step-4-deliver.jpg",
    alt:   "Editorial flat-lay of a PaperWalls package: rolled wallpaper, kraft sleeve, care card",
  },
];

const CHECKLIST = [
  "Measure floor to ceiling and edge to edge",
  "Add a few cm of bleed each side for a clean trim",
  "Use the highest-resolution version of your image you have",
  "Have a card ready for checkout (PayFast, secure)",
];

const AFTER = [
  "Order confirmed and queued for production",
  "Printed and packed in Cape Town",
  "Dispatched within 5 days",
  "Free, tracked delivery nationwide",
];

export default function HowItWorksPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      {/* Hero — split: header copy left, anchor image right */}
      <section className="bg-pw-bg">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 pt-6 pb-10 sm:gap-10 sm:px-8 sm:pt-10 sm:pb-14 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-12 lg:pt-14 lg:pb-20">
          <div className="lg:col-span-5">
            <p className="pw-overline text-pw-muted">The process</p>
            <h1 className="pw-display mt-3 text-pw-ink sm:mt-4">
              From upload to wall.
            </h1>
            <p className="pw-body-lg mt-4 max-w-md text-pw-ink/70 sm:mt-5">
              Four steps. Live pricing throughout. No payment until you approve everything.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <Button href="/config" variant="primary" size="lg">
                Start designing
              </Button>
              <Button href="/samples" variant="ghost" size="md">
                Or order a sample first →
              </Button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ImagePlaceholder
              src="/images/how-it-works/hero.jpg"
              aspectRatio="4/3"
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              prompt="Editorial photograph of a finished feature wall with custom wallpaper, person standing back admiring it"
            />
          </div>
        </div>
      </section>

      {/* The four steps — image-led */}
      <Section tone="surface" id="steps">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {STEPS.map((s) => (
            <article
              key={s.num}
              className="flex flex-col overflow-hidden rounded-pw-card border border-pw-stone bg-pw-bg"
            >
              <ImagePlaceholder
                src={s.image}
                aspectRatio="4/3"
                sizes="(min-width: 768px) 50vw, 100vw"
                prompt={s.alt}
                className="rounded-none"
              />
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-baseline gap-3">
                  <span className="pw-overline text-pw-muted-light">{s.num}</span>
                  <span className="pw-overline text-pw-accent">{s.tag}</span>
                </div>
                <h2 className="pw-h3 mt-3 text-pw-ink">{s.title}</h2>
                <p className="pw-body mt-3 text-pw-ink/70">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Prep + after — supporting context, kept compact */}
      <Section tone="bg" id="prep">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
            <Eyebrow>Before you start</Eyebrow>
            <h2 className="pw-h3 mt-3 text-pw-ink">Quick checklist.</h2>
            <ul className="mt-5 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pw-accent" />
                  <span className="pw-body text-pw-ink/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
            <Eyebrow>After checkout</Eyebrow>
            <h2 className="pw-h3 mt-3 text-pw-ink">What happens next.</h2>
            <ul className="mt-5 space-y-3">
              {AFTER.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="pw-overline mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-pw-ink/20 bg-pw-bg text-pw-ink"
                  >
                    {i + 1}
                  </span>
                  <span className="pw-body text-pw-ink/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Closing CTA */}
      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Ready when you are</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Get a price in sixty seconds.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Drop in your image, set your wall size, choose a finish. No payment until you approve the price.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <span className="pw-small text-center text-white/45 lg:text-right">
              Free reprints if anything ships imperfect.
            </span>
          </div>
        </div>
      </Section>
    </main>
  );
}
