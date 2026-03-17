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

  const isDiy  = application === "diy" || application === "diy_kit";
  const hasKit = application === "diy_kit";
  const proTotal = calculateInstallationCents("pro_installer", totalSqm);

  const handlePrimaryChange = (primary: "diy" | "pro_installer") => {
    onApplicationChange(primary === "diy" ? (hasKit ? "diy_kit" : "diy") : "pro_installer");
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Step header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
          5
        </span>
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Installation</h2>
          <p className="mt-1 text-sm text-stone-500">
            How do you want to apply the wallpaper? You can always change this later.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── DIY primary option ── */}
        <button
          type="button"
          onClick={() => handlePrimaryChange("diy")}
          className={[
            "flex w-full min-h-[52px] touch-manipulation items-start justify-between rounded-2xl border p-5 text-left transition-all",
            isDiy
              ? "border-stone-900 bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1"
              : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white",
          ].join(" ")}
        >
          <div>
            <p className={["text-base font-bold", isDiy ? "text-white" : "text-stone-900"].join(" ")}>
              DIY
            </p>
            <p className={["mt-0.5 text-sm", isDiy ? "text-white/75" : "text-stone-500"].join(" ")}>
              You apply it yourself. Step-by-step guide included with every order.
            </p>
          </div>
          <span className={["ml-4 text-base font-bold shrink-0", isDiy ? "text-white" : "text-stone-900"].join(" ")}>
            Free
          </span>
        </button>

        {/* ── DIY Kit add-on (only visible when DIY is selected) ── */}
        {isDiy && (
          <button
            type="button"
            onClick={() => onApplicationChange(hasKit ? "diy" : "diy_kit")}
            className={[
              "flex w-full min-h-[44px] touch-manipulation items-start gap-4 rounded-2xl border p-4 text-left transition-all ml-0",
              hasKit
                ? "border-stone-400 bg-stone-50 ring-2 ring-stone-400 ring-offset-1"
                : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white",
            ].join(" ")}
          >
            {/* Checkbox */}
            <div
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                hasKit ? "border-stone-900 bg-stone-900" : "border-stone-300",
              ].join(" ")}
              aria-hidden
            >
              {hasKit && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900">
                Add installation kit{" "}
                <span className="font-normal text-stone-400 text-xs">(optional)</span>
              </p>
              <p className="mt-0.5 text-sm text-stone-500">
                Includes wallpaper paste or adhesive activator, squeegee and smoothing brush.
              </p>
            </div>
            <span className="ml-2 text-sm font-bold text-stone-900 shrink-0">
              +{formatZar(60000)}
            </span>
          </button>
        )}

        {/* ── Pro installer ── */}
        <button
          type="button"
          onClick={() => handlePrimaryChange("pro_installer")}
          className={[
            "flex w-full min-h-[52px] touch-manipulation flex-col rounded-2xl border p-5 text-left transition-all",
            application === "pro_installer"
              ? "border-stone-900 bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1"
              : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white",
          ].join(" ")}
        >
          <div className="flex w-full items-start justify-between">
            <div>
              <p className={["text-base font-bold", application === "pro_installer" ? "text-white" : "text-stone-900"].join(" ")}>
                Pro installer
              </p>
              <p className={["mt-0.5 text-sm", application === "pro_installer" ? "text-white/75" : "text-stone-500"].join(" ")}>
                We send a certified installer to your address. All materials included.
              </p>
            </div>
            <div className="ml-4 text-right shrink-0">
              <p className={["text-base font-bold", application === "pro_installer" ? "text-white" : "text-stone-900"].join(" ")}>
                {formatZar(proTotal)}
              </p>
              <p className={["text-xs", application === "pro_installer" ? "text-white/60" : "text-stone-400"].join(" ")}>
                for {totalSqm.toFixed(1)} m²
              </p>
            </div>
          </div>
          <div className={[
            "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs",
            application === "pro_installer" ? "text-white/65" : "text-stone-400",
          ].join(" ")}>
            <span>R250/m² labour</span>
            <span>R500 call-out fee</span>
            <span>All materials included</span>
          </div>
        </button>
      </div>
    </section>
  );
}
