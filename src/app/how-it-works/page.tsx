import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "How it works | PaperWalls",
  description: "From upload to delivery. The exact order flow for custom wallpaper, made-to-order in Cape Town.",
};

const STEPS = [
  {
    num:  "01",
    title:"Add your image",
    body: "Drop in any photo, artwork, or pattern. JPG, PNG, or WebP up to 50 MB. We give you live feedback on whether it'll print sharply at your wall size.",
    tag:  "Quality checked",
  },
  {
    num:  "02",
    title:"Set your wall size",
    body: "Width and height in centimetres, edge to edge. Configure one wall or up to four. We update the price the moment your numbers are valid.",
    tag:  "Live pricing",
  },
  {
    num:  "03",
    title:"Pick finish and install",
    body: "Satin, Matte, or Linen on traditional paste-the-wall or peel-and-stick. DIY with optional kit, or add a pro installer. The price updates as you choose.",
    tag:  "Three finishes",
  },
  {
    num:  "04",
    title:"We print and ship",
    body: "Printed in Cape Town on commercial-grade substrate, cut to the millimetre, packed in kraft. Free SA delivery. Yours in five days.",
    tag:  "5-day production",
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
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">The process</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            From upload to wall.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Four steps. Live pricing throughout. No payment until you approve everything.
          </p>
        </div>
      </header>

      <Section tone="bg" id="steps">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {STEPS.map((s) => (
            <article
              key={s.num}
              className="flex flex-col rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8"
            >
              <span className="pw-display text-pw-ink/15">{s.num}</span>
              <h2 className="pw-h3 mt-4 text-pw-ink">{s.title}</h2>
              <p className="pw-body mt-3 text-pw-ink/70">{s.body}</p>
              <p className="pw-overline mt-5 text-pw-accent">{s.tag}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="surface" id="prep">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          <div className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-8">
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

          <div className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-8">
            <Eyebrow>After checkout</Eyebrow>
            <h2 className="pw-h3 mt-3 text-pw-ink">What happens next.</h2>
            <ul className="mt-5 space-y-3">
              {AFTER.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="pw-overline mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-pw-ink/20 bg-pw-surface text-pw-ink"
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
