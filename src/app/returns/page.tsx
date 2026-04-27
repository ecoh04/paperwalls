import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Returns & refunds | PaperWalls",
  description: "Custom-print returns policy, defects, reprint promise, and cancellations.",
};

const SECTIONS: {
  title: string;
  body: string;
  bulletTitle?: string;
  bullets?: string[];
}[] = [
  {
    title: "Custom print policy",
    body:
      "All wallpaper is printed to order and cut to your exact dimensions. We don&rsquo;t hold stock. So we can&rsquo;t accept returns for: change of mind after production starts, incorrect dimensions you entered yourself, low-resolution images you uploaded (we flag this in the configurator), or colour differences caused by your monitor calibration.",
    bulletTitle: "Before you order",
    bullets: [
      "Double-check your wall measurements",
      "Use the highest-resolution version of your image you have",
      "Order a sample pack first if you&rsquo;re unsure about a finish",
    ],
  },
  {
    title: "Production defects",
    body:
      "If your order arrives with a genuine production defect (misaligned cuts, significant colour banding, missing sections, or damage caused by our packaging), we reprint and reship at no cost or issue a full refund. Your call. Free reprints, no questions, no return shipping.",
    bulletTitle: "To lodge a defect claim",
    bullets: [
      "Contact us within 7 days of receiving your order",
      "Include your order number",
      "Attach clear, well-lit photos showing the full panel",
      "Tell us what&rsquo;s wrong in a sentence or two",
    ],
  },
  {
    title: "Cancellations",
    body:
      "If you need to cancel, contact us as soon as possible. We start reviewing files within hours of payment. If production hasn&rsquo;t started, we issue a full refund. If it has, we can&rsquo;t cancel because your wallpaper is already on the press.",
  },
];

export default function ReturnsPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Policy</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Returns &amp; refunds.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Custom orders are non-returnable, but we reprint or refund any genuine production defect.
          </p>
        </div>
      </header>

      <Section tone="bg" id="summary">
        <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
          <Eyebrow>Plain English</Eyebrow>
          <p className="pw-body-lg mt-3 text-pw-ink">
            Custom orders are non-returnable. But if anything ships imperfect we reprint
            or refund quickly, no quibble.
          </p>
        </div>
      </Section>

      <Section tone="surface" id="policy">
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
              {s.bullets && s.bulletTitle && (
                <div className="mt-5 border-t border-pw-stone pt-5">
                  <p className="pw-overline text-pw-ink">{s.bulletTitle}</p>
                  <ul className="mt-3 space-y-2.5">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pw-accent" />
                        <span
                          className="pw-body text-pw-ink/80"
                          dangerouslySetInnerHTML={{ __html: b }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Need to report an issue?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              We&rsquo;ll resolve it within a business day.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Send your order number and a photo. Reprint on the press within 48 hours.
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
