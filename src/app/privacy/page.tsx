import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = {
  title: "Privacy policy | PaperWalls",
  description: "How PaperWalls collects, uses, and protects your data. POPIA-aligned.",
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "What we collect",
    body: [
      "When you place an order: name, email, phone, delivery address, and the image you upload.",
      "When you browse: standard server logs, anonymous analytics about which pages you visit, and (if applicable) UTM tags from the link that brought you here. We don’t track you across other sites.",
    ],
  },
  {
    h: "Why we collect it",
    body: [
      "To produce and deliver your order, communicate about it, and answer support questions.",
      "The image goes to our press and our courier. The contact details go to our order management system and to PayFast for payment processing only.",
    ],
  },
  {
    h: "Where it is stored",
    body: [
      "On Supabase (database) and PayFast (for payment processing only — we never see your card details).",
      "Image files are stored securely in cloud storage. We retain order records for 5 years (legal requirement) and delete them on request after that.",
    ],
  },
  {
    h: "Your rights under POPIA",
    body: [
      "South Africa’s Protection of Personal Information Act gives you the right to access the data we hold on you, correct anything wrong, request deletion, object to processing, and complain to the Information Regulator.",
      "Email hello@paperwalls.co.za to action any of these and we’ll respond within 30 days.",
    ],
  },
  {
    h: "Sharing",
    body: [
      "We don’t sell your data. We share order details with PayFast (payment), our print fulfilment team (production), and our courier (delivery). That’s it.",
    ],
  },
  {
    h: "Updates to this policy",
    body: [
      "We may update this policy from time to time. The latest version is always on this page with the updated date below the title. Material changes are emailed to existing customers.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-pw-bg pb-20 sm:pb-24">
      <header className="mx-auto max-w-3xl px-5 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8 lg:px-12 lg:pt-16">
        <Eyebrow variant="muted">Legal</Eyebrow>
        <h1 className="pw-h1 mt-3 text-pw-ink sm:mt-4">Privacy policy</h1>
        <p className="pw-body-lg mt-4 text-pw-ink/70 sm:mt-5">
          How we collect, use, and protect your data when you browse and order.
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
          Questions about your data? Email{" "}
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
