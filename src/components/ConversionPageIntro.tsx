import Link from "next/link";

type ConversionPageIntroProps = {
  eyebrow:      string;
  title:        string;
  description:  string;
  ctaLabel?:    string;
  ctaHref?:     string;
};

/**
 * Standard page intro: eyebrow + page title + lede + optional CTA.
 * Uses design-system typography classes — no bespoke font sizes here.
 */
export function ConversionPageIntro({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
}: ConversionPageIntroProps) {
  return (
    <section className="max-w-3xl">
      <p className="pw-overline text-pw-accent">{eyebrow}</p>
      <h1 className="pw-h2 mt-4 text-pw-ink">{title}</h1>
      <p className="pw-body-lg mt-4 text-pw-ink/70">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-pw bg-pw-ink px-5 text-sm font-medium text-white hover:bg-pw-ink-soft transition-colors"
        >
          {ctaLabel}
        </Link>
      )}
    </section>
  );
}
