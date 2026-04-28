import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = {
  title: "Returns & refunds | PaperWalls",
  description: "Custom-print returns, defects, reprint promise, and cancellations.",
};

const SECTIONS: { h: string; body: string[]; bullets?: string[] }[] = [
  {
    h: "Custom print policy",
    body: [
      "Every wallpaper order is printed to your dimensions and cropped to your image. We don’t hold stock. Because of this, we cannot accept returns for change of mind once production has started, for incorrect dimensions you entered, for low-resolution images you uploaded (we flag this in the configurator), or for colour differences caused by your monitor calibration.",
    ],
    bullets: [
      "Double-check your wall measurements before confirming.",
      "Use the highest-resolution version of your image you have.",
      "Order a sample pack first if you’re unsure about a finish.",
    ],
  },
  {
    h: "Production defects",
    body: [
      "If your order arrives with a genuine production defect — misaligned cuts, significant colour banding, missing sections, or damage caused by our packaging — we will reprint and reship at no cost or issue a full refund. Your choice. Free reprints, no questions, no return shipping required.",
    ],
    bullets: [
      "Contact us within 7 days of receiving your order.",
      "Include your order number.",
      "Attach clear, well-lit photos showing the full panel and the defect.",
      "Tell us briefly what’s wrong.",
    ],
  },
  {
    h: "Cancellations",
    body: [
      "If you need to cancel, contact us as soon as possible. We start reviewing files within hours of payment.",
      "If production has not yet started, we issue a full refund. If it has started, we can no longer cancel because your wallpaper is already on the press.",
    ],
  },
  {
    h: "How refunds are paid",
    body: [
      "Refunds are paid back to the same card or account used for the original payment, via PayFast. They typically clear within 5 to 10 business days, depending on your bank.",
    ],
  },
];

export default function ReturnsPage() {
  return (
    <main className="bg-pw-bg pb-20 sm:pb-24">
      <header className="mx-auto max-w-3xl px-5 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8 lg:px-12 lg:pt-16">
        <Eyebrow variant="muted">Policy</Eyebrow>
        <h1 className="pw-h1 mt-3 text-pw-ink sm:mt-4">Returns &amp; refunds</h1>
        <p className="pw-body-lg mt-4 text-pw-ink/70 sm:mt-5">
          Custom orders are non-returnable, but we reprint or refund any genuine production defect.
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
            {s.bullets && (
              <ul className="mt-4 space-y-2.5">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pw-accent" />
                    <span className="pw-body text-pw-ink/80">{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="pw-small mt-12 border-t border-pw-stone pt-6 text-pw-muted sm:mt-16">
          Need to report an issue? Email{" "}
          <a
            href="mailto:hello@paperwalls.co.za"
            className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
          >
            hello@paperwalls.co.za
          </a>
          {" "}with your order number and a photo. Reply within one business day.
        </p>
      </article>
    </main>
  );
}
