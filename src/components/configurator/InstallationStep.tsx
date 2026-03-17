"use client";

import type { ApplicationMethod } from "@/types/order";
import { formatZar, calculateInstallationCents } from "@/lib/pricing";

type InstallationStepProps = {
  totalSqm: number;
  application: ApplicationMethod;
  onApplicationChange: (a: ApplicationMethod) => void;
};

export function InstallationStep({ totalSqm, application, onApplicationChange }: InstallationStepProps) {
  if (totalSqm <= 0) return null;

  const isDiy    = application === "diy" || application === "diy_kit";
  const hasKit   = application === "diy_kit";
  const proTotal = calculateInstallationCents("pro_installer", totalSqm);
  const isProSelected = application === "pro_installer";

  const handlePrimary = (p: "diy" | "pro_installer") =>
    onApplicationChange(p === "diy" ? (hasKit ? "diy_kit" : "diy") : "pro_installer");

  const primaryBtn = (active: boolean) =>
    [
      "flex w-full min-h-[52px] touch-manipulation items-start justify-between rounded-pw-card border p-5 text-left transition-all",
      active
        ? "border-pw-ink bg-pw-ink"
        : "border-pw-stone bg-pw-bg hover:border-pw-stone-dark hover:bg-pw-surface",
    ].join(" ");

  return (
    <section className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 shadow-pw-sm sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pw-ink text-sm font-bold text-white">
          5
        </span>
        <div>
          <h2 className="text-xl font-semibold text-pw-ink">Installation</h2>
          <p className="mt-1 text-sm text-pw-muted">
            How do you want to apply the wallpaper?
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* DIY */}
        <button type="button" onClick={() => handlePrimary("diy")} className={primaryBtn(isDiy)}>
          <div>
            <p className={["text-base font-semibold", isDiy ? "text-white" : "text-pw-ink"].join(" ")}>
              DIY
            </p>
            <p className={["mt-0.5 text-sm", isDiy ? "text-white/70" : "text-pw-muted"].join(" ")}>
              You apply it yourself. Step-by-step guide included with every order.
            </p>
          </div>
          <span className={["ml-4 text-base font-bold shrink-0", isDiy ? "text-white" : "text-pw-ink"].join(" ")}>
            Free
          </span>
        </button>

        {/* Optional DIY kit add-on — visually nested under DIY */}
        {isDiy && (
          <div className="flex gap-2 pl-4">
            {/* Connector line */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <div className="w-px flex-1 bg-pw-stone-dark" />
            </div>
            <button
              type="button"
              onClick={() => onApplicationChange(hasKit ? "diy" : "diy_kit")}
              className={[
                "flex w-full min-h-[44px] touch-manipulation items-start gap-3 rounded-pw border p-3.5 text-left transition-all",
                hasKit
                  ? "border-pw-accent bg-pw-accent-soft"
                  : "border-pw-stone bg-pw-bg hover:border-pw-stone-dark hover:bg-pw-surface",
              ].join(" ")}
            >
              <div
                className={[
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                  hasKit ? "border-pw-accent bg-pw-accent" : "border-pw-stone-dark",
                ].join(" ")}
                aria-hidden
              >
                {hasKit && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-pw-ink">
                  Add installation kit
                  <span className="ml-1.5 text-xs font-normal text-pw-muted-light">optional</span>
                </p>
                <p className="mt-0.5 text-xs text-pw-muted">
                  Paste or adhesive activator, squeegee &amp; smoothing brush.
                </p>
              </div>
              <span className="ml-2 text-sm font-semibold text-pw-ink shrink-0">+{formatZar(60000)}</span>
            </button>
          </div>
        )}

        {/* Pro installer */}
        <button type="button" onClick={() => handlePrimary("pro_installer")} className={[primaryBtn(isProSelected), "flex-col"].join(" ")}>
          <div className="flex w-full items-start justify-between">
            <div>
              <p className={["text-base font-semibold", isProSelected ? "text-white" : "text-pw-ink"].join(" ")}>
                Pro installer
              </p>
              <p className={["mt-0.5 text-sm", isProSelected ? "text-white/70" : "text-pw-muted"].join(" ")}>
                We send a certified installer to your address. All materials included.
              </p>
            </div>
            <div className="ml-4 text-right shrink-0">
              <p className={["text-base font-bold", isProSelected ? "text-white" : "text-pw-ink"].join(" ")}>
                {formatZar(proTotal)}
              </p>
              <p className={["text-xs", isProSelected ? "text-white/60" : "text-pw-muted-light"].join(" ")}>
                for {totalSqm.toFixed(1)} m²
              </p>
            </div>
          </div>
          <div className={["mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs", isProSelected ? "text-white/60" : "text-pw-muted-light"].join(" ")}>
            <span>R250/m² labour</span>
            <span>R500 call-out fee</span>
            <span>All materials included</span>
          </div>
        </button>
      </div>
    </section>
  );
}
