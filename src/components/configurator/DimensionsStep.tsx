"use client";

import type { MultiWallMode, WallSpec } from "@/types/configurator";

type DimensionsStepProps = {
  stepNumber:           number;
  widthM:               number;
  heightM:              number;
  wallCount:            number;
  multiWallMode:        MultiWallMode;
  walls:                WallSpec[];
  onWidthChange:        (v: number) => void;
  onHeightChange:       (v: number) => void;
  onWallCountChange:    (v: number) => void;
  onMultiWallModeChange:(m: MultiWallMode) => void;
  onWallsChange:        (walls: WallSpec[]) => void;
  onSwapDimensions:     () => void;
};

const inputCls =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 text-lg text-pw-ink placeholder:text-pw-muted-light focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10 transition";

interface SizePreset {
  label:    string;
  caption:  string;
  widthCm:  number;
  heightCm: number;
}

// Common SA wall sizes — covers the usual customer scenarios so they don't have to measure.
// Custom is always available as a fallback.
const PRESETS: SizePreset[] = [
  { label: "Above the bed",   caption: "180 × 140 cm", widthCm: 180, heightCm: 140 },
  { label: "Bedroom feature", caption: "300 × 270 cm", widthCm: 300, heightCm: 270 },
  { label: "Behind couch",    caption: "400 × 260 cm", widthCm: 400, heightCm: 260 },
  { label: "Whole wall",      caption: "450 × 280 cm", widthCm: 450, heightCm: 280 },
];

export function DimensionsStep({
  stepNumber,
  widthM, heightM, wallCount, multiWallMode, walls,
  onWidthChange, onHeightChange, onWallCountChange,
  onMultiWallModeChange, onWallsChange, onSwapDimensions,
}: DimensionsStepProps) {
  const isMulti          = wallCount > 1;
  const usingDifferent   = isMulti && multiWallMode === "different";
  const widthCm          = widthM  > 0 ? Math.round(widthM  * 100) : 0;
  const heightCm         = heightM > 0 ? Math.round(heightM * 100) : 0;
  const totalSqmSame     = widthM * heightM * Math.max(1, wallCount);
  const totalSqmDifferent= walls.length > 0 ? walls.reduce((s, w) => s + w.widthM * w.heightM, 0) : 0;
  const totalSqm         = usingDifferent ? totalSqmDifferent : totalSqmSame;

  const isValidSame      = widthM > 0 && heightM > 0;
  const isValidDifferent = walls.length === wallCount && walls.every((w) => w.widthM > 0 && w.heightM > 0);
  const showTotal        = (!isMulti && isValidSame) ||
                           (isMulti && multiWallMode === "same" && isValidSame) ||
                           (usingDifferent && isValidDifferent);

  const ensureWallsLength = (n: number) => {
    if (walls.length === n) return;
    const next: WallSpec[] = Array.from({ length: n }, (_, i) => walls[i] ?? { widthM: 0, heightM: 0 });
    onWallsChange(next);
  };

  const handleWallCountChange = (n: number) => {
    onWallCountChange(n);
    if (multiWallMode === "different") ensureWallsLength(n);
  };

  const handleMultiWallMode = (mode: MultiWallMode) => {
    onMultiWallModeChange(mode);
    if (mode === "different") ensureWallsLength(wallCount);
  };

  const setWall = (index: number, field: "widthM" | "heightM", cm: number) => {
    const next = [...walls];
    if (!next[index]) next[index] = { widthM: 0, heightM: 0 };
    next[index] = { ...next[index], [field]: cm / 100 };
    onWallsChange(next);
  };

  // Detect which preset (if any) matches the current entry, so we can highlight it.
  const matchedPreset = PRESETS.find((p) => p.widthCm === widthCm && p.heightCm === heightCm);

  const applyPreset = (p: SizePreset) => {
    onWidthChange(p.widthCm  / 100);
    onHeightChange(p.heightCm / 100);
  };

  const pillBtn = (active: boolean) =>
    [
      "rounded-pw border px-5 py-2.5 text-sm font-medium transition-colors touch-manipulation",
      active
        ? "border-pw-ink bg-pw-surface text-pw-ink shadow-pw-sm ring-1 ring-pw-ink/20"
        : "border-[rgba(26,23,20,0.1)] bg-pw-bg text-pw-muted hover:border-pw-stone-dark hover:text-pw-ink",
    ].join(" ");

  return (
    <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5 shadow-pw-sm sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pw-ink text-sm font-bold text-white">
          {stepNumber}
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-pw-ink">Wall dimensions</h2>
          <p className="mt-1 text-sm text-pw-muted">
            Pick a common size or enter your own. Add 5–10 cm bleed each side for a clean trimmed edge.
          </p>
        </div>
      </div>

      {/* ── Wall count ─────────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-semibold text-pw-ink mb-3">How many walls?</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button key={n} type="button" onClick={() => handleWallCountChange(n)} className={pillBtn(wallCount === n)}>
              {n} wall{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Multi-wall mode ────────────────────────────────────────────────────── */}
      {isMulti && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-pw-ink mb-1">Same image and size for all?</label>
          <p className="text-sm text-pw-muted mb-3">
            Same: one design, equal size on every wall. Different: each wall configured separately.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleMultiWallMode("same")} className={pillBtn(multiWallMode === "same")}>
              Same for all
            </button>
            <button type="button" onClick={() => handleMultiWallMode("different")} className={pillBtn(multiWallMode === "different")}>
              Different per wall
            </button>
          </div>
        </div>
      )}

      {/* ── Single-size inputs (1 wall, or "same" mode) ────────────────────────── */}
      {(!isMulti || multiWallMode === "same") && (
        <>
          {/* Common-size presets */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-pw-muted-light mb-3">
              Common sizes
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => {
                const active = matchedPreset?.label === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={[
                      "flex flex-col gap-0.5 rounded-pw border px-3 py-3 text-left transition-colors touch-manipulation",
                      active
                        ? "border-pw-ink bg-pw-surface shadow-pw-sm ring-1 ring-pw-ink/20"
                        : "border-[rgba(26,23,20,0.1)] bg-pw-bg hover:border-pw-stone-dark hover:bg-pw-surface",
                    ].join(" ")}
                  >
                    <span className="text-sm font-semibold text-pw-ink">{p.label}</span>
                    <span className="text-xs text-pw-muted">{p.caption}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-pw-muted-light">
              {matchedPreset
                ? `Using preset: ${matchedPreset.label}.`
                : widthCm > 0 || heightCm > 0
                  ? "Custom size — adjust the inputs below."
                  : "Or enter your own measurements below."}
            </p>
          </div>

          {/* Custom inputs */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-pw-muted-light">
                Or enter your size
              </p>
              {widthCm > 0 && heightCm > 0 && (
                <button
                  type="button"
                  onClick={onSwapDimensions}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-pw-muted hover:text-pw-ink transition-colors"
                  title="Swap width and height"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  Swap W ↔ H
                </button>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="dim-w" className="block text-sm font-semibold text-pw-ink mb-2">
                  Width <span className="font-normal text-pw-muted">(cm)</span>
                </label>
                <input
                  id="dim-w"
                  type="number"
                  min={10} max={2000} step={1}
                  value={widthCm > 0 ? widthCm : ""}
                  onChange={(e) => {
                    const cm = Math.max(0, Math.floor(parseFloat(e.target.value) || 0));
                    onWidthChange(cm / 100);
                  }}
                  placeholder="e.g. 400"
                  className={inputCls}
                />
                {widthCm > 0 && (
                  <p className="mt-1.5 text-xs text-pw-muted-light">{widthCm} cm = {(widthCm / 100).toFixed(2)} m</p>
                )}
              </div>
              <div>
                <label htmlFor="dim-h" className="block text-sm font-semibold text-pw-ink mb-2">
                  Height <span className="font-normal text-pw-muted">(cm)</span>
                </label>
                <input
                  id="dim-h"
                  type="number"
                  min={10} max={2000} step={1}
                  value={heightCm > 0 ? heightCm : ""}
                  onChange={(e) => {
                    const cm = Math.max(0, Math.floor(parseFloat(e.target.value) || 0));
                    onHeightChange(cm / 100);
                  }}
                  placeholder="e.g. 240"
                  className={inputCls}
                />
                {heightCm > 0 && (
                  <p className="mt-1.5 text-xs text-pw-muted-light">{heightCm} cm = {(heightCm / 100).toFixed(2)} m</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Per-wall inputs (different mode) ───────────────────────────────────── */}
      {usingDifferent && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: wallCount }, (_, i) => {
            const w = walls[i] ?? { widthM: 0, heightM: 0 };
            const cmW = Math.round(w.widthM  * 100);
            const cmH = Math.round(w.heightM * 100);
            return (
              <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4">
                <p className="text-sm font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-pw-muted mb-1.5">Width (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={cmW > 0 ? cmW : ""}
                      onChange={(e) => setWall(i, "widthM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                      placeholder="e.g. 400"
                      className="block w-full rounded-pw border border-pw-stone bg-pw-surface px-4 py-3 text-base text-pw-ink placeholder:text-pw-muted-light focus:border-pw-ink focus:outline-none focus:ring-2 focus:ring-pw-ink/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pw-muted mb-1.5">Height (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={cmH > 0 ? cmH : ""}
                      onChange={(e) => setWall(i, "heightM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                      placeholder="e.g. 240"
                      className="block w-full rounded-pw border border-pw-stone bg-pw-surface px-4 py-3 text-base text-pw-ink placeholder:text-pw-muted-light focus:border-pw-ink focus:outline-none focus:ring-2 focus:ring-pw-ink/10 transition"
                    />
                  </div>
                </div>
                {w.widthM > 0 && w.heightM > 0 && (
                  <p className="mt-2 text-xs text-pw-muted font-medium">{(w.widthM * w.heightM).toFixed(1)} m²</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Total area ─────────────────────────────────────────────────────────── */}
      {showTotal && totalSqm > 0 && (
        <div className="mt-5 flex items-center justify-between rounded-pw bg-pw-bg border border-pw-stone px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm text-pw-muted">Total print area</span>
            {isMulti && multiWallMode === "same" && (
              <span className="text-xs text-pw-muted-light">
                {widthCm} × {heightCm} cm × {wallCount} walls
              </span>
            )}
            {usingDifferent && (
              <span className="text-xs text-pw-muted-light">
                {wallCount} walls, varying sizes
              </span>
            )}
          </div>
          <span className="text-lg font-bold text-pw-ink">{totalSqm.toFixed(2)} m²</span>
        </div>
      )}
    </section>
  );
}
