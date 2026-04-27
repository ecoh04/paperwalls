type SocialProofStripProps = {
  className?: string;
};

/**
 * Honest, factual trust signals only — never fabricated review counts or ratings.
 * If/when real reviews exist, swap to a verified-source widget (Google, Trustpilot).
 */
export function SocialProofStrip({ className = "" }: SocialProofStripProps) {
  return (
    <div
      className={`rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-4 ${className}`.trim()}
      aria-label="Order details"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-semibold text-pw-ink">Made-to-order in Cape Town</span>
        <span className="text-pw-ink/75">Free shipping nationwide</span>
        <span className="text-pw-ink/75">Pay with PayFast</span>
      </div>
    </div>
  );
}
