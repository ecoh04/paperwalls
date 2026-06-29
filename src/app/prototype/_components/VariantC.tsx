"use client";

/*
 * VARIANT C — "Guided steps / clarity-led".
 * THROWAWAY PROTOTYPE. See ./NOTES.md.
 *
 * Thesis: people stall because the path is unclear and the upload feels like a
 * commitment. So the PDP hero leads with a crisp value prop and a prominent
 * 3-step "how it works", one strong CTA: "Design yours in 2 minutes." The
 * configurator-entry is a guided stepper; step 1 presents "Use our designs" and
 * "Upload your own" SIDE BY SIDE as equal choices (upload is never the only
 * door), plus an "email me my design and price" save-progress capture so an
 * undecided visitor isn't lost.
 *
 * Renders only the PDP body — the real site header comes from the root layout.
 */

import React, { useState } from "react";
import {
  TEMPLATES,
  Pill,
  PrimaryButton,
  TrustRow,
} from "./shared";

const STEPS = [
  { n: "1", t: "Pick or upload a design", b: "Choose one of our designs or upload your own photo. Both take seconds." },
  { n: "2", t: "Enter your wall size", b: "Two numbers, width and height. We size and price it instantly." },
  { n: "3", t: "We print and ship in 5 days", b: "Made to measure, delivered free across South Africa." },
];

export default function VariantC() {
  const [path, setPath] = useState<"designs" | "upload" | null>(null);
  const [pickedTpl, setPickedTpl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen bg-pw-bg text-pw-ink">
      {/* ── PDP HERO — value prop + prominent 3-step how-it-works ────────── */}
      <section className="px-6 py-14 md:px-12 md:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Pill>Custom wallpaper, made simple</Pill>
          <h1 className="pw-display mt-4">
            Your wall, <em className="text-pw-accent">your design</em>, in three steps.
          </h1>
          <p className="pw-body-lg mt-3 max-w-xl text-pw-muted">
            No design skills, no decorator, no guesswork. Pick or upload a design,
            enter your wall size, and we print and ship it in about five days.
          </p>
          <div className="mt-6">
            <PrimaryButton accent onClick={() => {
              document.getElementById("proto-c-stepper")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Design yours in 2 minutes
            </PrimaryButton>
          </div>
        </div>

        {/* the prominent 3-step strip */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-px overflow-hidden rounded-pw-card border border-pw-ink/10 bg-pw-ink/10 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 bg-pw-surface p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pw-accent-soft pw-h3 text-pw-accent">
                {s.n}
              </div>
              <span className="pw-h3">{s.t}</span>
              <span className="pw-small text-pw-muted">{s.b}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-4xl">
          <TrustRow />
        </div>
      </section>

      {/* ── CONFIGURATOR ENTRY — guided stepper, step 1 = equal choices ──── */}
      <section id="proto-c-stepper" className="border-t border-pw-ink/10 bg-pw-surface px-6 py-16 md:px-12">
        <div className="mx-auto max-w-4xl">
          {/* stepper rail */}
          <div className="mb-8 flex items-center gap-3 pw-small text-pw-muted">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pw-ink pw-overline text-white">1</span>
            <span className="font-medium text-pw-ink">Choose your design</span>
            <span className="h-px flex-1 bg-pw-ink/15" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-pw-ink/15">2</span>
            <span>Wall size</span>
            <span className="h-px flex-1 bg-pw-ink/15" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-pw-ink/15">3</span>
            <span>Finish</span>
          </div>

          <h2 className="pw-h1">Step 1 — how do you want to start?</h2>
          <p className="mt-2 max-w-lg pw-body text-pw-muted">
            Both paths take seconds. There's no wrong choice, and nothing to commit to yet.
          </p>

          {/* two EQUAL choices, side by side */}
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPath("designs")}
              className={[
                "flex flex-col gap-3 rounded-pw-card border-2 bg-pw-bg p-6 text-left transition-all",
                path === "designs" ? "border-pw-accent shadow-pw-md" : "border-pw-ink/10 hover:border-pw-ink/40",
              ].join(" ")}
            >
              <span className="text-3xl">🎨</span>
              <span className="pw-h3">Use our designs</span>
              <span className="pw-small text-pw-muted">Browse ready-made designs. No photo needed, sized to your wall automatically.</span>
            </button>

            <button
              type="button"
              onClick={() => setPath("upload")}
              className={[
                "flex flex-col gap-3 rounded-pw-card border-2 bg-pw-bg p-6 text-left transition-all",
                path === "upload" ? "border-pw-accent shadow-pw-md" : "border-pw-ink/10 hover:border-pw-ink/40",
              ].join(" ")}
            >
              <span className="text-3xl">🖼️</span>
              <span className="pw-h3">Upload your own</span>
              <span className="pw-small text-pw-muted">Got a photo or artwork? Upload it and we will fit it to your wall.</span>
            </button>
          </div>

          {/* contextual continuation under the chosen path */}
          {path === "designs" && (
            <div className="mt-6 rounded-pw-card border border-pw-ink/10 bg-pw-bg p-5">
              <div className="mb-3 pw-overline text-pw-muted">Pick a design</div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPickedTpl(t.id)}
                    title={t.name}
                    className={[
                      "aspect-square rounded-pw border-2 transition-all",
                      pickedTpl === t.id ? "border-pw-accent ring-2 ring-pw-accent/30" : "border-transparent hover:border-pw-ink/30",
                    ].join(" ")}
                    style={{ background: t.swatch }}
                  />
                ))}
              </div>
              <div className="mt-4">
                <PrimaryButton accent>Continue to wall size</PrimaryButton>
              </div>
            </div>
          )}

          {path === "upload" && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-pw-card border-[1.5px] border-dashed border-pw-stone-dark bg-pw-bg p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pw-stone text-pw-accent">⤴</div>
              <div className="pw-body font-medium">Drop your photo here, or browse</div>
              <div className="pw-small text-pw-muted">JPG or PNG. We'll fit it to your wall in the next step.</div>
              <div className="mt-3">
                <PrimaryButton accent>Continue to wall size</PrimaryButton>
              </div>
            </div>
          )}

          {/* save-my-progress capture — keeps the undecided visitor */}
          <div className="mt-8 rounded-pw-card border border-pw-ink/10 bg-pw-accent-soft p-5">
            <div className="mb-1 pw-h3">Not ready to decide?</div>
            <p className="mb-3 pw-small text-pw-muted">
              Email me my design and price so I can come back to it. No spam, just your saved progress.
            </p>
            {saved ? (
              <div className="pw-body font-medium text-pw-accent">Saved. Check your inbox (prototype stub).</div>
            ) : (
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSaved(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 rounded-pw border border-pw-ink/15 bg-pw-surface px-4 py-3 pw-body text-pw-ink outline-none focus:border-pw-ink"
                />
                <button
                  type="submit"
                  className="rounded-pw bg-pw-ink px-6 py-3 pw-body font-medium text-white transition-colors hover:bg-pw-ink-soft"
                >
                  Email me my design
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

VariantC.displayName = "Guided steps";
