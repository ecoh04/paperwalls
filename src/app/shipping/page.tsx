import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = {
  title: "Shipping & delivery | PaperWalls",
  description: "Production lead times, courier delivery windows, and packaging across South Africa.",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "Production lead time",
    body: [
      "Once payment is confirmed we review your file and begin printing within 24 hours. Most orders dispatch within 72 hours of payment.",
      "If you selected the Pro installer option, we contact you within 24 hours of dispatch to schedule the install.",
    ],
  },
  {
    h: "Free delivery across South Africa",
    body: [
      "Free standard delivery on every order, anywhere in South Africa. No minimum.",
      "Typical transit is 2 to 4 business days after dispatch. Remote areas may add 1 to 2 days.",
    ],
  },
  {
    h: "How your order is packed",
    body: [
      "Cut to your exact dimensions, rolled onto a protective core, wrapped in heavy-duty film, and shipped in rigid cardboard tubes so nothing creases in transit.",
      "Multi-panel orders are rolled separately and labelled in hanging order so you know exactly which panel goes where.",
    ],
  },
  {
    h: "Tracking",
    body: [
      "A tracking number lands in your inbox the moment your order leaves our facility.",
      "If you haven’t received the tracking email within 4 business days of payment, email us and we’ll investigate immediately.",
    ],
  },
  {
    h: "Damaged in transit",
    body: [
      "If your courier package arrives visibly damaged, photograph it before opening and email us within 48 hours of delivery. We will reprint and reship at no cost. The Returns & refunds page covers this in full.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <main className="bg-pw-bg pb-20 sm:pb-24">
      <header className="mx-auto max-w-3xl px-5 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8 lg:px-12 lg:pt-16">
        <Eyebrow variant="muted">Delivery</Eyebrow>
        <h1 className="pw-h1 mt-3 text-pw-ink sm:mt-4">Shipping &amp; delivery</h1>
        <p className="pw-body-lg mt-4 text-pw-ink/70 sm:mt-5">
          Printed to order in Cape Town. Shipped free, fully tracked, across all nine provinces.
          Yours in 5 days, door to door.
        </p>
        <p className="pw-overline mt-5 text-pw-muted-light sm:mt-6">
          Last updated: {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </header>

      <article className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
        {SECTIONS.map((s) => (
          <section key={s.h} className="mt-10 first:mt-2 sm:mt-12">
            <h2 className="pw-h3 text-pw-ink">{s.h}</h2>
            <div className="mt-3 space-y-3 sm:mt-4">
              {s.body.map((p, i) => (
                <p key={i} className="pw-body text-pw-ink/80">{p}</p>
              ))}
            </div>
          </section>
        ))}

        <p className="pw-small mt-12 border-t border-pw-stone pt-6 text-pw-muted sm:mt-16">
          Question about your delivery? Email{" "}
          <a
            href="mailto:hello@paperwalls.co.za"
            className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
          >
            hello@paperwalls.co.za
          </a>
          {" "}and we’ll respond within one business day.
        </p>
      </article>
    </main>
  );
}
