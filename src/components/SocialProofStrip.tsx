type SocialProofStripProps = {
  className?: string;
};

export function SocialProofStrip({ className = "" }: SocialProofStripProps) {
  return (
    <div
      className={`rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-4 ${className}`.trim()}
      aria-label="Customer trust indicators"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-semibold text-pw-ink">4.9/5 customer rating</span>
        <span className="text-pw-ink/75">500+ SA orders printed</span>
        <span className="text-pw-ink/75">Printed in Cape Town</span>
      </div>
    </div>
  );
}
