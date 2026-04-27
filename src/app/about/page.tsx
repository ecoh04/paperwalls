import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export const metadata = {
  title: "About | PaperWalls",
  description: "PaperWalls makes custom wallpaper. Cape Town press, your image, your wall.",
};

const PRINCIPLES = [
  {
    title: "Made to order, not held in stock",
    body:  "Every roll runs once, for one customer, cut to one wall. No warehouses of unsold patterns. The image you upload is the only file that gets printed.",
  },
  {
    title: "Local press, real people",
    body:  "Printed in Cape Town on commercial-grade kit, the same machines that produce gallery and signage work. You can email and a person replies, usually within hours.",
  },
  {
    title: "Promise on the print",
    body:  "Free reprints if anything ships imperfect. No quibbling, no return shipping. Photo within 7 days, replacement on the press within 48 hours.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">About</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Your image. Your wall. Cut to fit.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            PaperWalls makes custom wallpaper for South African homes and projects.
            Made-to-order in Cape Town, free delivery, no standard rolls.
          </p>
        </div>
      </header>

      {/* Mission split */}
      <Section tone="bg" id="story">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            <ImagePlaceholder
              src="/images/product/pdp-10-unboxing.jpg"
              aspectRatio="4/3"
              prompt="PaperWalls flat-lay of order contents on warm cream paper"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          <div className="lg:col-span-6">
            <Eyebrow>The idea</Eyebrow>
            <h2 className="pw-h2 mt-3 text-pw-ink">
              Wallpaper that&rsquo;s actually yours.
            </h2>
            <p className="pw-body-lg mt-4 text-pw-ink/70">
              Most wallpaper is printed in bulk and sold by the roll. We print one
              wall at a time, to the millimetre, in your image. A photo, an artwork,
              a pattern, an AI-generated landscape. If you can save it as a file we
              can run it through the press.
            </p>
            <p className="pw-body mt-4 text-pw-ink/70">
              Premium-grade substrate, gallery-quality print, free reprints if
              anything ships imperfect. Made in South Africa, priced in rand,
              delivered to your door.
            </p>
          </div>
        </div>
      </Section>

      {/* Principles */}
      <Section tone="surface" id="principles">
        <div className="max-w-2xl">
          <Eyebrow>What we believe</Eyebrow>
          <h2 className="pw-h2 mt-3 text-pw-ink">
            Three things, no more.
          </h2>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li
              key={p.title}
              className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-8"
            >
              <h3 className="pw-h3 text-pw-ink">{p.title}</h3>
              <p className="pw-body mt-3 text-pw-ink/70">{p.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Closing CTA */}
      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Ready to start?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Build your first wall.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Drop in your image, set your wall size, get a live price in under sixty seconds.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <Button href="/samples" variant="ghost" size="md" className="text-white/85 hover:text-white">
              Or order a sample pack →
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
