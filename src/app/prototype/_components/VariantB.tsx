"use client";

/*
 * VARIANT B — "Preview-first / see it on your wall" (visual-led).
 * THROWAWAY PROTOTYPE. See ./NOTES.md.
 *
 * Thesis: people don't open the configurator / don't upload because they can't
 * picture the result. So the PDP hero IS a big room mockup with a design
 * already on the wall, plus a thumbnail strip to swap designs instantly
 * (template-led, zero upload). Primary CTA: "See it on your wall." The
 * configurator-entry keeps the room preview as the centrepiece; a template is
 * already applied by default and "upload your own" lives INSIDE the preview as
 * an option, never a gate.
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
  ROOM_BG,
} from "./shared";

function ThumbStrip({
  picked,
  setPicked,
}: {
  picked: string;
  setPicked: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {TEMPLATES.map((t) => {
        const isActive = t.id === picked;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setPicked(t.id)}
            title={t.name}
            className={[
              "h-14 w-14 flex-shrink-0 rounded-pw border-2 transition-all",
              isActive ? "border-pw-accent ring-2 ring-pw-accent/30" : "border-white/70 hover:border-pw-accent/60",
            ].join(" ")}
            style={{ background: t.swatch }}
          />
        );
      })}
    </div>
  );
}

export default function VariantB() {
  const [picked, setPicked] = useState(TEMPLATES[1].id);
  const active = TEMPLATES.find((t) => t.id === picked) ?? TEMPLATES[1];

  return (
    <div className="min-h-screen bg-pw-bg text-pw-ink">
      {/* ── PDP HERO — the room mockup IS the hero ───────────────────────── */}
      <section className="relative">
        {/* big room preview, design already on the wall */}
        <div className="relative h-[68vh] min-h-[460px] w-full overflow-hidden" style={{ background: ROOM_BG }}>
          {/* the wall with the live design */}
          <div
            className="absolute inset-x-[8%] top-[8%] bottom-[30%] rounded-md shadow-pw-lg transition-[background] duration-300 md:inset-x-[14%]"
            style={{ background: active.swatch }}
          />
          {/* furniture hint */}
          <div className="absolute inset-x-[18%] bottom-[10%] h-[14%] rounded-t-2xl bg-pw-ink/10" />

          {/* overlay copy + CTA, bottom-left, buyer-psychology led */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-pw-ink/70 via-pw-ink/20 to-transparent px-6 pb-8 pt-24 md:px-12">
            <div className="max-w-xl">
              <Pill>See it before you buy</Pill>
              <h1 className="pw-display mt-3 text-white">See it on your wall.</h1>
              <p className="pw-body-lg mt-2 max-w-md text-white/85">
                Tap a design and watch the room change. When it looks right, make it yours.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <PrimaryButton accent>See it on your wall</PrimaryButton>
                <span className="pw-small text-white/70">Now showing: {active.name}</span>
              </div>
            </div>
          </div>

          {/* the swap strip, floating on the preview */}
          <div className="absolute right-4 top-4 rounded-pw-card bg-pw-surface/85 p-3 shadow-pw-lg backdrop-blur md:right-12">
            <div className="mb-2 pw-overline text-pw-muted">Swap the design</div>
            <ThumbStrip picked={picked} setPicked={setPicked} />
          </div>
        </div>

        <div className="px-6 py-8 md:px-12">
          <TrustRow />
        </div>
      </section>

      {/* ── CONFIGURATOR ENTRY — preview is the centrepiece ──────────────── */}
      <section className="border-t border-pw-ink/10 bg-pw-surface px-6 py-16 md:px-12">
        <div className="mb-8 flex flex-col gap-3">
          <Pill>Design your own</Pill>
          <h2 className="pw-h1 max-w-xl">Make this wall yours.</h2>
          <p className="pw-body max-w-lg text-pw-muted">
            A design is already on the wall, so there's nothing to figure out.
            Swap it, or upload your own photo right inside the preview.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* the centrepiece preview */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-pw-card shadow-pw-lg" style={{ background: ROOM_BG }}>
            <div
              className="absolute inset-x-[10%] top-[8%] bottom-[28%] rounded-md shadow-pw-lg transition-[background] duration-300"
              style={{ background: active.swatch }}
            />
            <div className="absolute inset-x-[20%] bottom-[8%] h-[12%] rounded-t-xl bg-pw-ink/10" />

            {/* "upload your own" as an option INSIDE the preview, never a gate */}
            <button
              type="button"
              onClick={() => alert("Prototype stub — upload your own photo.")}
              className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-pw-surface/90 px-4 py-2 pw-small font-medium text-pw-ink shadow-pw-sm backdrop-blur transition-colors hover:bg-pw-surface"
            >
              <span className="text-pw-accent">＋</span> Upload your own photo
            </button>
            <span className="absolute bottom-4 left-4 rounded-full bg-pw-ink/75 px-3 py-1 pw-small font-medium text-white backdrop-blur">
              {active.name}
            </span>
          </div>

          {/* swap + commit panel */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div className="rounded-pw-card border border-pw-ink/10 bg-pw-bg p-5">
              <div className="mb-3 pw-overline text-pw-muted">Choose a design</div>
              <ThumbStrip picked={picked} setPicked={setPicked} />
            </div>
            <div className="rounded-pw-card border border-pw-ink/10 bg-pw-surface p-5 shadow-pw-sm">
              <div className="mb-1 pw-small text-pw-muted">On the wall now</div>
              <div className="mb-4 pw-h3">{active.name}</div>
              <PrimaryButton accent className="w-full">Continue with this</PrimaryButton>
              <div className="mt-4 border-t border-pw-ink/10 pt-4 text-center">
                <GhostLink>or upload your own photo</GhostLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

VariantB.displayName = "Preview-first";
