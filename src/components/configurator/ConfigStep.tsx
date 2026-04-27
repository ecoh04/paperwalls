import type { ReactNode } from "react";

type ConfigStepProps = {
  stepNumber:  number;
  /** Defaults to 5 (Dimensions / Upload / Preview / Material / Installation). */
  totalSteps?: number;
  eyebrow:     string;
  title:       string;
  subtitle?:   string;
  children:    ReactNode;
  className?:  string;
};

const DEFAULT_TOTAL = 5;

export function ConfigStep({
  stepNumber, totalSteps = DEFAULT_TOTAL, eyebrow, title, subtitle, children, className = "",
}: ConfigStepProps) {
  return (
    <section
      className={[
        "rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8",
        className,
      ].join(" ").trim()}
    >
      <header className="mb-6 sm:mb-8">
        <p className="pw-overline text-pw-muted">
          Step {stepNumber} of {totalSteps} · {eyebrow}
        </p>
        <h2 className="pw-h3 mt-2 text-pw-ink">{title}</h2>
        {subtitle && (
          <p className="pw-body mt-3 max-w-xl text-pw-ink/65">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}
