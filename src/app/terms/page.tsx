import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = {
  title: "Terms of service | PaperWalls",
  description: "The terms that govern purchases, custom-print specifications, and use of paperwalls.co.za.",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "Acceptance",
    body: [
      "By using paperwalls.co.za and placing an order, you agree to these terms. If you do not agree, please do not use the site or place an order.",
      "These terms work alongside our Privacy Policy, Shipping & delivery, and Returns & refunds pages. Together they form the full agreement.",
    ],
  },
  {
    h: "Your responsibilities",
    body: [
      "You must provide accurate contact and delivery details. We rely on these to ship your order and answer your support questions.",
      "You must own the rights to any image you upload, or have permission from the rights-holder to print it. We will not produce copyrighted imagery without consent.",
      "You must verify the dimensions and image you confirm at checkout. Once production starts, the order cannot be amended.",
    ],
  },
  {
    h: "Pricing and payment",
    body: [
      "Prices are in South African Rand (ZAR) and include all amounts shown at checkout unless stated otherwise. Free delivery applies to all orders within South Africa.",
      "Payment is processed by PayFast on a secure external page. We do not store card details ourselves. By submitting an order you authorise PayFast to debit your nominated card or bank account for the total displayed.",
    ],
  },
  {
    h: "Production and quality",
    body: [
      "Every order is custom-printed to the dimensions and image you confirm. We print at commercial-grade resolution on substrate appropriate to the finish you selected.",
      "We are not responsible for design choices you make at checkout (including image resolution, cropping, or your final dimension entries) once you have confirmed the order.",
      "If your order ships with a genuine production defect (cuts, banding, packaging damage), the Returns & refunds policy applies. Free reprint or full refund, your choice.",
    ],
  },
  {
    h: "Delivery",
    body: [
      "Delivery is via tracked courier across South Africa. See the Shipping & delivery page for production lead time and transit windows.",
      "Risk transfers to you on delivery. Damage that occurs after the courier has delivered is not covered.",
    ],
  },
  {
    h: "Cancellations",
    body: [
      "We start preparing orders within hours of payment. If production has not yet started we will issue a full refund. If production has started, the order cannot be cancelled.",
    ],
  },
  {
    h: "Right to refuse",
    body: [
      "We may refuse or cancel any order at our discretion. For example, if the uploaded image appears to infringe third-party rights, contains illegal content, or if delivery to the supplied address is not possible.",
    ],
  },
  {
    h: "Updates to these terms",
    body: [
      "We may update these terms from time to time. The latest version is always on this page with the updated date below the title. Continued use of the site after changes constitutes acceptance.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-pw-bg pb-20 sm:pb-24">
      <header className="mx-auto max-w-3xl px-5 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8 lg:px-12 lg:pt-16">
        <Eyebrow variant="muted">Legal</Eyebrow>
        <h1 className="pw-h1 mt-3 text-pw-ink sm:mt-4">Terms of service</h1>
        <p className="pw-body-lg mt-4 text-pw-ink/70 sm:mt-5">
          The key terms that govern purchases, custom-print specifications, and use of paperwalls.co.za.
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
          Questions? Email{" "}
          <a
            href="mailto:hello@paperwalls.co.za"
            className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
          >
            hello@paperwalls.co.za
          </a>
          .
        </p>
      </article>
    </main>
  );
}
