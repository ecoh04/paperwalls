import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Contact | PaperWalls",
  description: "Get in touch about your order, image quality, install, or delivery.",
};

const CHANNELS = [
  {
    label:    "General + order support",
    address:  "hello@paperwalls.co.za",
    note:     "Order questions, artwork checks, install advice. Replies within one business day.",
  },
  {
    label:    "Press and trade",
    address:  "trade@paperwalls.co.za",
    note:     "Interior designers, hospitality, retail buyers. We&rsquo;ll send a trade pack on request.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Contact</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Talk to us.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Email is fastest. Most replies land within a business day, often sooner.
          </p>
        </div>
      </header>

      <Section tone="bg" id="channels">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {CHANNELS.map((c) => (
            <div
              key={c.address}
              className="flex flex-col rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8"
            >
              <Eyebrow>{c.label}</Eyebrow>
              <a
                href={`mailto:${c.address}`}
                className="pw-h3 mt-3 text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
              >
                {c.address}
              </a>
              <p
                className="pw-body mt-4 text-pw-ink/70"
                dangerouslySetInnerHTML={{ __html: c.note }}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:mt-10 sm:p-8">
          <Eyebrow variant="muted">Where we are</Eyebrow>
          <h2 className="pw-h3 mt-3 text-pw-ink">Printed in Cape Town.</h2>
          <p className="pw-body mt-3 max-w-xl text-pw-ink/70">
            Every order goes through our Cape Town facility. We don&rsquo;t take
            walk-ins yet, but if you&rsquo;re curious about the press or want
            to see how a job runs, email us and we&rsquo;ll arrange it.
          </p>
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Order question?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Most questions answer themselves.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              The configurator gives a live price, image quality feedback, and the full breakdown before you pay anything.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Open configurator
            </Button>
            <Button href="/faq" variant="ghost" size="md" className="text-white/85 hover:text-white">
              Read the FAQ →
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
