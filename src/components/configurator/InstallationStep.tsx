"use client";

import type { ApplicationMethod } from "@/types/order";
import { formatZar, calculateInstallationCents } from "@/lib/pricing";

type InstallationStepProps = {
  totalSqm: number;
  application: ApplicationMethod;
  onApplicationChange: (a: ApplicationMethod) => void;
};

export function InstallationStep({
  totalSqm,
  application,
  onApplicationChange,
}: InstallationStepProps) {
  if (totalSqm <= 0) return null;

  const isDiy = application === "diy" || application === "diy_kit";
  const hasKit = application === "diy_kit";
  const proTotal = calculateInstallationCents("pro_installer", totalSqm);

  const handlePrimaryChange = (primary: "diy" | "pro_installer") => {
    if (primary === "diy") {
      onApplicationChange(hasKit ? "diy_kit" : "diy");
    } else {
      onApplicationChange("pro_installer");
    }
  };

  const handleKitToggle = () => {
    onApplicationChange(hasKit ? "diy" : "diy_kit");
  };

  return (
    <section className="rounded-pw-card border border-pw-stone bg-pw-surface p-4 sm:p-6 shadow-pw-sm">
      <h2 className="text-lg font-semibold text-pw-ink">4. Installation</h2>
      <p className="mt-1 text-sm text-pw-muted">
        How do you want to apply the wallpaper?
      </p>

      <div className="mt-5 space-y-3">
        {/* ── DIY option ── */}
        <button
          type="button"
          onClick={() => handlePrimaryChange("diy")}
          className={`flex w-full min-h-[48px] touch-manipulation items-start justify-between rounded-pw-card border p-4 text-left transition-colors ${
            isDiy
              ? "border-pw-ink bg-pw-bg ring-1 ring-pw-ink"
              : "border-pw-stone hover:border-pw-ink hover:bg-pw-bg active:bg-pw-accent-soft"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-pw-ink">DIY</span>
              <span className="text-xs text-pw-muted">— you apply it yourself</span>
            </div>
            <p className="mt-1 text-xs text-pw-muted">
              We include a full application guide and installation tips with every order.
            </p>
          </div>
          <span className="ml-4 text-sm font-bold text-pw-ink shrink-0">Free</span>
        </button>

        {/* ── DIY Kit add-on (only visible when DIY is selected) ── */}
        {isDiy && (
          <div className="ml-4 pl-3 border-l-2 border-pw-stone">
            <button
              type="button"
              onClick={handleKitToggle}
              className={`flex w-full min-h-[44px] touch-manipulation items-start justify-between rounded-pw-card border p-3 text-left transition-colors ${
                hasKit
                  ? "border-pw-accent bg-pw-accent-soft"
                  : "border-pw-stone hover:border-pw-accent hover:bg-pw-accent-soft"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center ${
                    hasKit ? "border-pw-accent bg-pw-accent" : "border-pw-stone"
                  }`}
                  aria-hidden
                >
                  {hasKit && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-pw-ink">Add installation kit</span>
                  <p className="text-xs text-pw-muted mt-0.5">
                    Includes wallpaper paste or adhesive activator, application squeegee, and a smoothing brush — everything you need.
                  </p>
                </div>
              </div>
              <span className="ml-3 text-sm font-bold text-pw-ink shrink-0">+{formatZar(60000)}</span>
            </button>
          </div>
        )}

        {/* ── Pro installer option ── */}
        <button
          type="button"
          onClick={() => handlePrimaryChange("pro_installer")}
          className={`flex w-full min-h-[48px] touch-manipulation flex-col rounded-pw-card border p-4 text-left transition-colors ${
            application === "pro_installer"
              ? "border-pw-ink bg-pw-bg ring-1 ring-pw-ink"
              : "border-pw-stone hover:border-pw-ink hover:bg-pw-bg active:bg-pw-accent-soft"
          }`}
        >
          <div className="flex w-full items-start justify-between">
            <div>
              <span className="font-semibold text-pw-ink">Pro installer</span>
              <p className="mt-1 text-xs text-pw-muted">
                We send a certified installer to your address. All you need to do is be home.
              </p>
            </div>
            <div className="ml-4 text-right shrink-0">
              <p className="text-sm font-bold text-pw-ink">{formatZar(proTotal)}</p>
              <p className="text-xs text-pw-muted">for {totalSqm.toFixed(1)} m²</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-pw-muted">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-pw-muted inline-block" />
              R250/m² labour
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-pw-muted inline-block" />
              R500 call-out fee
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-pw-muted inline-block" />
              All materials included
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
