import Link from "next/link";

type ConversionPageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function ConversionPageIntro({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
}: ConversionPageIntroProps) {
  return (
    <section className="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-accent">{eyebrow}</p>
      <h1 className="mt-3 font-sans text-4xl font-bold tracking-tight text-pw-ink sm:text-5xl">{title}</h1>
      <p className="mt-3 text-base leading-relaxed text-pw-ink/80 sm:text-lg">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
        >
          {ctaLabel}
        </Link>
      )}
    </section>
  );
}
