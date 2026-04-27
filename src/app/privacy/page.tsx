import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Privacy policy | PaperWalls",
  description: "How PaperWalls collects, uses, and protects your data. POPIA-aligned.",
};

const SECTIONS = [
  {
    title: "What we collect",
    body:
      "When you place an order: name, email, phone, delivery address, and the image you upload. When you browse: standard server logs, anonymous analytics about which pages you visit, and (if applicable) UTM tags from the link that brought you here. We don&rsquo;t track you across other sites.",
  },
  {
    title: "Why we collect it",
    body:
      "To produce and deliver your order, communicate about it, and answer support questions. The image goes to our press and our courier. The contact details go to our order management system and PayFast (for payment) only.",
  },
  {
    title: "Where it&rsquo;s stored",
    body:
      "On Supabase (database) and PayFast (for payment processing only — we never see your card details). Image files are stored securely in cloud storage. We retain order records for 5 years (legal requirement) and delete them on request after that.",
  },
  {
    title: "Your rights under POPIA",
    body:
      "South Africa&rsquo;s Protection of Personal Information Act gives you the right to: access the data we hold on you, correct anything wrong, request deletion, object to processing, and complain to the Information Regulator. Email hello@paperwalls.co.za to action any of these and we&rsquo;ll respond within 30 days.",
  },
  {
    title: "Sharing",
    body:
      "We don&rsquo;t sell your data. We share order details with PayFast (payment), our print fulfilment team (production), and our courier (delivery). That&rsquo;s it.",
  },
  {
    title: "Updates",
    body:
      "We may update this policy. The latest version is always on this page with the updated date below. Material changes are emailed to existing customers.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Legal</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Privacy policy.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            What we collect, why, and what you can do about it.
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
            We use your details to produce, ship, and support your order. We don&rsquo;t sell
            your data. POPIA-aligned. Email us to access, correct, or delete anything.
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
              <h2
                className="pw-h3 text-pw-ink"
                dangerouslySetInnerHTML={{ __html: s.title }}
              />
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
            <Eyebrow className="text-pw-accent-mid">Question about your data?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Email and we&rsquo;ll respond.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              POPIA gives you 30 days for a response. We aim for one business day.
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
