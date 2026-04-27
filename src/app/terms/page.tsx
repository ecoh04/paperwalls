import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Terms of service | PaperWalls",
  description: "Terms governing use of PaperWalls and custom-print orders.",
};

const SECTIONS = [
  {
    title: "Using the site",
    body:
      "By browsing or placing an order, you agree to these terms. You must be 18 or over, provide accurate details, and only upload images you have the legal right to use. We reserve the right to refuse or cancel orders that breach these terms.",
  },
  {
    title: "Custom orders",
    body:
      "Every wallpaper is printed to order, to the dimensions and specifications you confirm at checkout. We print exactly what you confirm. We&rsquo;re not responsible for design choices once confirmed (resolution, cropping, colour from your screen). The configurator gives live feedback before you pay so you can adjust.",
  },
  {
    title: "Pricing and payment",
    body:
      "All prices are in South African rand and include VAT where applicable. Payment is processed by PayFast on a separate secure page. We never see or store your card details. Final price is whatever shows in the configurator at the moment you click Add to cart.",
  },
  {
    title: "Image rights",
    body:
      "You confirm you have the rights to print every image you upload. Don&rsquo;t upload copyrighted artwork or photography you don&rsquo;t own or licence. If we&rsquo;re notified of an infringement, we&rsquo;ll cancel the order and refund without deducting production costs.",
  },
  {
    title: "Returns and refunds",
    body:
      "Custom orders are non-returnable. We reprint or refund any genuine production defect within 7 days of delivery. Full policy on the Returns &amp; refunds page.",
  },
  {
    title: "Updates",
    body:
      "We may update these terms. Continued use of the site after an update constitutes acceptance. Material changes affecting existing orders will be communicated by email.",
  },
];

export default function TermsPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Legal</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Terms of service.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            What you agree to by using PaperWalls and placing an order.
          </p>
          <p className="pw-overline mt-4 text-pw-muted-light sm:mt-5">
            Last updated: {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </header>

      <Section tone="bg" id="summary">
        <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
          <Eyebrow>Plain English</Eyebrow>
          <p className="pw-body-lg mt-3 text-pw-ink">
            Provide accurate details, only upload images you have the right to use,
            and we print exactly what you confirm at checkout.
          </p>
        </div>
      </Section>

      <Section tone="surface" id="details">
        <div className="space-y-5 sm:space-y-6">
          {SECTIONS.map((s) => (
            <article
              key={s.title}
              className="rounded-pw-card border border-pw-stone bg-pw-bg p-6 sm:p-8"
            >
              <h2 className="pw-h3 text-pw-ink">{s.title}</h2>
              <p
                className="pw-body mt-4 text-pw-ink/70"
                dangerouslySetInnerHTML={{ __html: s.body }}
              />
            </article>
          ))}
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Question?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Email is fastest.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Most replies within one business day, often sooner.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/contact" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Contact us
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
