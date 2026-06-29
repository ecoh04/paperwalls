"use client";

/*
 * THROWAWAY PROTOTYPE — shared dummy data + tiny UI helpers for the three
 * redesign variants. No real data, no cart, no Supabase. All CTAs are stubs.
 * See ./NOTES.md for the question being answered.
 *
 * NOTE: lives in _components/ (leading underscore) so it is NOT a route.
 * The real site header comes from the root layout; these variants render only
 * their PDP body so they read like real product pages.
 */

import React from "react";

// ── Dummy template designs (CSS-gradient placeholders, no real assets needed)
// reused as "start from one of our designs" thumbnails across variants.
export type Template = { id: string; name: string; tag: string; swatch: string };

export const TEMPLATES: Template[] = [
  { id: "fynbos",  name: "Fynbos Botanical", tag: "Botanical", swatch: "linear-gradient(135deg, #3d5a40 0%, #6b8f5e 45%, #c9b89a 100%)" },
  { id: "karoo",   name: "Karoo Dusk",       tag: "Landscape", swatch: "linear-gradient(135deg, #b8561f 0%, #e8795a 40%, #f2e8e1 100%)" },
  { id: "terrazzo",name: "Cape Terrazzo",    tag: "Pattern",   swatch: "radial-gradient(circle at 20% 30%, #c4622d 6%, transparent 7%), radial-gradient(circle at 70% 60%, #8a8175 5%, transparent 6%), radial-gradient(circle at 45% 80%, #1a1714 4%, transparent 5%), #ece5dc" },
  { id: "linen",   name: "Soft Linen",       tag: "Texture",   swatch: "repeating-linear-gradient(0deg, #d4c9be, #d4c9be 3px, #c9bcae 3px, #c9bcae 4px)" },
  { id: "indigo",  name: "Indigo Wash",      tag: "Abstract",  swatch: "linear-gradient(160deg, #2e3a4a 0%, #4a6076 55%, #8a9bab 100%)" },
  { id: "ochre",   name: "Ochre Arches",     tag: "Geometric", swatch: "linear-gradient(135deg, #c4622d 0%, #e0a064 50%, #f2e8e1 100%)" },
];

// A flat, painterly "room" backdrop used by every variant's wall preview.
// Pure CSS so the prototype needs zero new image assets.
export const ROOM_BG =
  "radial-gradient(ellipse at 50% 120%, rgba(26,23,20,0.18) 0%, transparent 55%), linear-gradient(180deg, #efe9e1 0%, #e6dfd8 62%, #d9d0c6 100%)";

// ── Tiny helpers ───────────────────────────────────────────────────────────

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-pw-accent/25 bg-pw-accent-soft px-3.5 py-1.5 pw-overline text-pw-accent">
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  accent = false,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => alert("Prototype stub — no real navigation."))}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-pw px-6 py-3.5 pw-body font-medium text-white transition-transform hover:-translate-y-px active:translate-y-0",
        accent ? "bg-pw-accent hover:bg-[#b8561f]" : "bg-pw-ink hover:bg-pw-ink-soft",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function GhostLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => alert("Prototype stub."))}
      className="pw-small font-medium text-pw-muted underline decoration-pw-ink/20 underline-offset-[6px] transition-colors hover:text-pw-ink hover:decoration-pw-ink/60"
    >
      {children}
    </button>
  );
}

// A reusable wall-preview tile: room backdrop with a chosen design "applied"
// as a centred panel. Used by preview-led sections.
export function WallPreview({
  swatch,
  label,
  className = "",
}: {
  swatch: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={["relative overflow-hidden rounded-pw-card", className].join(" ")}
      style={{ background: ROOM_BG }}
    >
      {/* the "wall" with the design on it */}
      <div className="absolute inset-x-[12%] top-[10%] bottom-[26%] rounded-md shadow-pw-lg" style={{ background: swatch }} />
      {/* a hint of furniture so it reads as a room */}
      <div className="absolute inset-x-[20%] bottom-[8%] h-[12%] rounded-t-xl bg-pw-ink/10" />
      {label && (
        <span className="absolute left-4 top-4 rounded-full bg-pw-ink/75 px-3 py-1 pw-small font-medium text-white backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}

// Trust stats reused in hero footers.
export const TRUST = [
  { num: "Free", label: "Delivery in SA" },
  { num: "5 days", label: "Print & ship" },
  { num: "4.9★", label: "Customer rating" },
];

export function TrustRow() {
  return (
    <div className="flex flex-wrap gap-7 border-t border-pw-ink/10 pt-5">
      {TRUST.map((t) => (
        <div key={t.label} className="flex flex-col gap-0.5">
          <span className="pw-h3 text-pw-ink">{t.num}</span>
          <span className="pw-overline text-pw-muted">{t.label}</span>
        </div>
      ))}
    </div>
  );
}
