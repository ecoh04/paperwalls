"use client";

/*
 * VARIANT A — "Samples-first" (lower the commitment).
 * THROWAWAY PROTOTYPE. See ./NOTES.md.
 *
 * Thesis: 87% never open the configurator and 79% never upload because we ask
 * for a buying/creative decision before earning trust. So the PDP hero leads
 * with the SAMPLE PACK as the easy, low-risk entry (R300, R150 back on first
 * order). The configurator-entry then leads with "start from one of our
 * designs" (no upload needed); uploading your own photo is the secondary path,
 * never a gate.
 *
 * Renders only the PDP body — the real site header comes from the root layout.
 */

import React, { useState } from "react";
import {
  TEMPLATES,
  Pill,
  PrimaryButton,
  GhostLink,
  TrustRow,
  WallPreview,
} from "./shared";

const HOW_IT_WORKS = [
  { n: "1", t: "Order a sample pack", b: "Five finishes posted to your door so you can feel the paper before you commit." },
  { n: "2", t: "Pick or upload a design", b: "Start from one of our designs, or upload your own photo. We size it to your wall." },
  { n: "3", t: "We print and ship", b: "Made to measure and delivered free across South Africa in about five days." },
];

export default function VariantA() {
  const [picked, setPicked] = useState(TEMPLATES[0].id);
  const active = TEMPLATES.find((t) => t.id === picked) ?? TEMPLATES[0];

  return (
    <div className="min-h-screen bg-pw-bg text-pw-ink">
      {/* ── PDP HERO — sample pack as the easy entry ─────────────────────── */}
      <section className="grid gap-10 px-6 py-14 md:grid-cols-2 md:items-center md:px-12 md:py-20">
        <div className="flex flex-col gap-5">
          <Pill>Not ready to commit?</Pill>
          <h1 className="pw-display text-pw-ink">
            Try it on your wall <em className="text-pw-accent">before</em> you buy.
          </h1>
          <p className="pw-body-lg max-w-md text-pw-muted">
            Order a sample pack for R300 and feel all five finishes in your own light.
            Get R150 back on your first order, so the real risk is basically nothing.
          </p>

          {/* the easy entry, made the primary affordance */}
          <div className="mt-2 flex flex-col gap-3 rounded-pw-card border border-pw-ink/10 bg-pw-surface p-5 shadow-pw-md">
            <div className="flex items-baseline justify-between">
              <span className="pw-h3">Sample pack</span>
              <span className="pw-h3 text-pw-accent">R300</span>
            </div>
            <p className="pw-small text-pw-muted">
              Five finishes, posted free. R150 credited back on your first wallpaper order.
            </p>
            <PrimaryButton accent>Order samples</PrimaryButton>
            <div className="pt-1 text-center">
              <GhostLink>or design your own now</GhostLink>
            </div>
          </div>

          <TrustRow />
        </div>

        {/* visual: the physical sample pack */}
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-pw-card shadow-pw-lg"
          style={{ background: "linear-gradient(160deg, #e6dfd8 0%, #d4c9be 100%)" }}
        >
          <div className="absolute inset-0 grid grid-cols-2 gap-3 p-8">
            {TEMPLATES.slice(0, 4).map((t) => (
              <div key={t.id} className="rounded-md shadow-pw-sm" style={{ background: t.swatch }} />
            ))}
          </div>
          <span className="absolute bottom-5 left-5 rounded-full bg-pw-ink/80 px-3 py-1 pw-small font-medium text-white backdrop-blur">
            Posted to your door
          </span>
        </div>
      </section>

      {/* ── HOW IT WORKS — 3 crisp steps ─────────────────────────────────── */}
      <section className="border-y border-pw-ink/10 bg-pw-surface px-6 py-16 md:px-12">
        <p className="pw-overline mb-8 text-pw-accent">How it works</p>
        <div className="grid gap-px overflow-hidden rounded-pw-card border border-pw-ink/10 bg-pw-ink/10 md:grid-cols-3">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 bg-pw-surface p-8">
              <span className="text-4xl font-black text-pw-stone-dark">{s.n}</span>
              <span className="pw-h3">{s.t}</span>
              <span className="pw-small text-pw-muted">{s.b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONFIGURATOR ENTRY — designs first, upload secondary ─────────── */}
      <section className="px-6 py-16 md:px-12">
        <div className="mb-8 flex flex-col gap-3">
          <Pill>Design your own</Pill>
          <h2 className="pw-h1 max-w-xl">Start from one of our designs.</h2>
          <p className="pw-body max-w-lg text-pw-muted">
            No photo to hand? Pick a design and we will size it to your wall.
            You can always swap in your own image later.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* template gallery — the primary, no-upload path */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TEMPLATES.map((t) => {
              const isActive = t.id === picked;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPicked(t.id)}
                  className={[
                    "group flex flex-col gap-2 rounded-pw-card border bg-pw-surface p-2.5 text-left transition-all",
                    isActive
                      ? "border-pw-accent shadow-pw-md ring-1 ring-pw-accent"
                      : "border-pw-ink/10 hover:border-pw-ink/40 hover:shadow-pw-sm",
                  ].join(" ")}
                >
                  <div className="aspect-square rounded-md" style={{ background: t.swatch }} />
                  <div className="px-1 pb-1">
                    <div className="pw-small font-medium">{t.name}</div>
                    <div className="pw-overline text-pw-muted">{t.tag}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* live preview of the picked design + the secondary upload path */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <WallPreview swatch={active.swatch} label={active.name} className="aspect-[4/3]" />
            <div className="rounded-pw-card border border-pw-ink/10 bg-pw-surface p-5 shadow-pw-sm">
              <div className="mb-1 pw-small text-pw-muted">Selected design</div>
              <div className="mb-4 pw-h3">{active.name}</div>
              <PrimaryButton accent className="w-full">Use this design</PrimaryButton>
              <div className="mt-4 border-t border-pw-ink/10 pt-4 text-center">
                <GhostLink>or upload your own photo instead</GhostLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

VariantA.displayName = "Samples-first";
