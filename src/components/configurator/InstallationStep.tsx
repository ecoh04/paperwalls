"use client";

import type { ApplicationMethod } from "@/types/order";
import { formatZar, calculateInstallationCents } from "@/lib/pricing";
import { ConfigStep } from "./ConfigStep";

type InstallationStepProps = {
  stepNumber: number;
  totalSqm: number;
  application: ApplicationMethod;
  onApplicationChange: (a: ApplicationMethod) => void;
};

function primaryClasses(active: boolean) {
  return [
    "flex w-full min-h-[64px] items-start justify-between gap-4 rounded-pw-card border p-5 text-left transition-colors touch-manipulation",
    active
      ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink/15"
      : "border-pw-stone bg-pw-bg hover:border-pw-ink/40 hover:bg-pw-surface",
  ].join(" ");
}

export function InstallationStep({ stepNumber, totalSqm, application, onApplicationChange }: InstallationStepProps) {
  if (totalSqm <= 0) return null;

  const isDiy         = application === "diy" || application === "diy_kit";
  const hasKit        = application === "diy_kit";
  const proTotal      = calculateInstallationCents("pro_installer", totalSqm);
  const isProSelected = application === "pro_installer";

  const handlePrimary = (p: "diy" | "pro_installer") =>
    onApplicationChange(p === "diy" ? (hasKit ? "diy_kit" : "diy") : "pro_installer");

  return (
    <ConfigStep
      stepNumber={stepNumber}
      eyebrow="Installation"
      title="How will you put it up?"
      subtitle="Hang it yourself with the printed install guide, or have us send a pro installer."
    >
      <div className="space-y-3">
        {/* DIY */}
        <button type="button" onClick={() => handlePrimary("diy")} className={primaryClasses(isDiy)} aria-pressed={isDiy}>
          <div>
            <p className="pw-body font-semibold text-pw-ink">DIY</p>
            <p className="pw-small mt-0.5 text-pw-muted">
              You apply it yourself. Step-by-step guide included with every order.
            </p>
          </div>
          <span className="pw-body shrink-0 font-semibold text-pw-ink">Free</span>
        </button>

        {/* Optional DIY kit add-on — visually nested under DIY */}
        {isDiy && (
          <div className="flex gap-3 pl-4">
            <div className="w-px shrink-0 bg-pw-stone-dark" />
            <button
              type="button"
              onClick={() => onApplicationChange(hasKit ? "diy" : "diy_kit")}
              aria-pressed={hasKit}
              className={[
                "flex w-full min-h-[44px] items-start gap-3 rounded-pw border p-3.5 text-left transition-colors touch-manipulation",
                hasKit
                  ? "border-pw-accent bg-pw-accent-soft"
                  : "border-pw-stone bg-pw-bg hover:border-pw-ink/40 hover:bg-pw-surface",
              ].join(" ")}
            >
              <span
                aria-hidden
                className={[
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                  hasKit ? "border-pw-accent bg-pw-accent" : "border-pw-stone-dark",
                ].join(" ")}
              >
                {hasKit && (
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <div className="flex-1">
                <p className="pw-small font-medium text-pw-ink">
                  Add installation kit
                  <span className="ml-1.5 pw-overline text-pw-muted-light">optional</span>
                </p>
                <p className="pw-small mt-0.5 text-pw-muted">
                  Paste or adhesive activator, squeegee &amp; smoothing brush.
                </p>
              </div>
              <span className="pw-small shrink-0 font-semibold text-pw-ink">+{formatZar(60000)}</span>
            </button>
          </div>
        )}

        {/* Pro installer */}
        <button type="button" onClick={() => handlePrimary("pro_installer")} className={primaryClasses(isProSelected)} aria-pressed={isProSelected}>
          <div>
            <p className="pw-body font-semibold text-pw-ink">Pro installer</p>
            <p className="pw-small mt-0.5 text-pw-muted">
              We send a certified installer to your address. All materials included.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="pw-body font-semibold text-pw-ink">{formatZar(proTotal)}</p>
            <p className="pw-overline text-pw-muted-light">for {totalSqm.toFixed(1)} m²</p>
          </div>
        </button>
      </div>
    </ConfigStep>
  );
}
