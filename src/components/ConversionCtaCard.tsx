import Link from "next/link";

type ConversionCtaCardProps = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
};

export function ConversionCtaCard({
  title,
  body,
  ctaLabel,
  ctaHref,
  className = "",
}: ConversionCtaCardProps) {
  return (
    <section className={`rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6 ${className}`.trim()}>
      <h2 className="font-sans text-lg font-semibold text-pw-ink">{title}</h2>
      <p className="mt-1 text-sm text-pw-ink/75">{body}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
