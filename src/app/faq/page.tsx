import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import Link from "next/link";

const faqs = [
  {
    q: "How does custom wallpaper work?",
    a: "You upload an image (photo, art, or pattern), enter your wall dimensions, and choose a finish and application method. We calculate the price and print to your specs, then ship or arrange installation.",
  },
  {
    q: "What file formats do you accept?",
    a: "We accept JPG, PNG, and PDF. For best print quality we recommend high-resolution files (at least 150 DPI at print size).",
  },
  {
    q: "Do you deliver across South Africa?",
    a: "Yes. We ship to all provinces. Shipping cost depends on your zone (e.g. Gauteng, Western Cape, KZN, and other regions).",
  },
  {
    q: "Can someone install it for me?",
    a: "Yes. You can choose our installer service at checkout. We send a professional to your address; pricing depends on wall size and location.",
  },
  {
    q: "What if I need to return or change my order?",
    a: "Because each order is custom-printed to your dimensions and design, returns are limited. See our Returns & refunds page for the full policy.",
  },
];

export const metadata = {
  title: "FAQ | PaperWalls",
  description: "Frequently asked questions about custom wallpaper, ordering, and delivery.",
};

export default function FAQPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-accent">Common questions</p>
        <h1 className="mt-3 font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">Frequently asked questions</h1>
        <p className="mt-4 text-base sm:text-lg text-pw-ink/80 leading-relaxed">
          Straight answers on file quality, ordering, delivery, and installation.
        </p>
      </div>
      <dl className="mt-10 max-w-4xl space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5">
            <dt className="font-sans text-lg font-semibold text-pw-ink">{faq.q}</dt>
            <dd className="mt-2 text-[15px] text-pw-ink/75 leading-relaxed">{faq.a}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 max-w-4xl rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="font-sans text-lg font-semibold text-pw-ink">Still unsure?</p>
        <p className="mt-1 text-sm text-pw-ink/75">Start the configurator to see pricing and image quality feedback instantly.</p>
        <Link href="/config" className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft">
          Start designing
        </Link>
      </div>
    </PageContainer>
  );
}
