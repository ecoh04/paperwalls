import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Shipping & delivery | PaperWalls",
  description: "Production lead times, courier delivery windows, and packaging across South Africa.",
};

const SECTIONS = [
  {
    title: "Production lead time",
    body: [
      "Once payment is confirmed we review your file and start printing within 24 hours. Most orders dispatch within 72 hours.",
      "If you picked the Pro installer option, we contact you within 24 hours of dispatch to schedule the install.",
    ],
  },
  {
    title: "Free SA shipping",
    body: [
      "Free standard delivery on every order, anywhere in South Africa. No minimum.",
      "Typical transit is 2 to 4 business days after dispatch. Remote areas may add 1 to 2 days.",
    ],
  },
  {
    title: "How your order is packed",
    body: [
      "Cut to your exact dimensions, rolled onto a protective core, wrapped in heavy-duty film, and shipped in rigid cardboard tubes so nothing creases in transit.",
      "Multi-panel orders are rolled separately and labelled in hanging order so you know exactly which panel goes where.",
    ],
  },
  {
    title: "Tracking",
    body: [
      "A tracking number lands in your inbox the moment your order leaves our facility. If you haven&rsquo;t received it within 4 business days of payment, email us and we&rsquo;ll investigate immediately.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Delivery</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Shipping &amp; delivery.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Printed to order in Cape Town. Shipped free, fully tracked, across all nine provinces.
          </p>
        </div>
      </header>

      <Section tone="bg" id="summary">
        <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
          <Eyebrow>Plain English</Eyebrow>
          <p className="pw-body-lg mt-3 text-pw-ink">
            We print in Cape Town, dispatch in 72 hours, and delivery usually takes another 2 to 4 business days.
            Yours in 5 days, door to door.
          </p>
        </div>
      </Section>

      <Section tone="surface" id="details">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <article
              key={s.title}
              className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-8"
            >
              <h2 className="pw-h3 text-pw-ink">{s.title}</h2>
              <div className="mt-4 space-y-3">
                {s.body.map((p, i) => (
                  <p
                    key={i}
                    className="pw-body text-pw-ink/70"
                    dangerouslySetInnerHTML={{ __html: p }}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Question about an order?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Reach out, we&rsquo;ll fix it.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Most replies within one business day, often sooner.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/contact" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Contact us
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
