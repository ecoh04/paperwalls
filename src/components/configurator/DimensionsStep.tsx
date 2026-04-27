"use client";

import type { MultiWallMode, WallSpec } from "@/types/configurator";
import { ConfigStep } from "./ConfigStep";

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

const INPUT_CLASSES =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10";

const FIELD_LABEL = "pw-overline block text-pw-muted mb-2";

function pillClasses(active: boolean) {
  return [
    "rounded-pw border px-5 py-2.5 pw-small font-medium transition-colors touch-manipulation",
    active
      ? "border-pw-ink bg-pw-surface text-pw-ink ring-1 ring-pw-ink/15"
      : "border-pw-stone bg-pw-bg text-pw-muted hover:border-pw-ink/40 hover:text-pw-ink",
  ].join(" ");
}

export function DimensionsStep({
  stepNumber,
  widthM, heightM, wallCount, multiWallMode, walls,
  onWidthChange, onHeightChange, onWallCountChange,
  onMultiWallModeChange, onWallsChange, onSwapDimensions,
}: DimensionsStepProps) {
  const isMulti           = wallCount > 1;
  const usingDifferent    = isMulti && multiWallMode === "different";
  const widthCm           = widthM  > 0 ? Math.round(widthM  * 100) : 0;
  const heightCm          = heightM > 0 ? Math.round(heightM * 100) : 0;
  const totalSqmSame      = widthM * heightM * Math.max(1, wallCount);
  const totalSqmDifferent = walls.length > 0 ? walls.reduce((s, w) => s + w.widthM * w.heightM, 0) : 0;
  const totalSqm          = usingDifferent ? totalSqmDifferent : totalSqmSame;

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

  return (
    <ConfigStep
      stepNumber={stepNumber}
      eyebrow="Wall size"
      title="Tell us your wall size."
      subtitle="Measure floor to ceiling, edge to edge, in centimetres. Add a few cm of bleed each side for a clean trim."
    >
      {/* ── Wall count ── */}
      <div>
        <p className="pw-overline text-pw-ink mb-3">How many walls?</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleWallCountChange(n)}
              className={pillClasses(wallCount === n)}
              aria-pressed={wallCount === n}
            >
              {n} wall{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Multi-wall mode ── */}
      {isMulti && (
        <div className="mt-7">
          <p className="pw-overline text-pw-ink mb-1">Same design and size on all walls?</p>
          <p className="pw-small text-pw-muted mb-3">
            Same: one image repeated at the same size on every wall. Different: configure each wall on its own.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleMultiWallMode("same")}
              className={pillClasses(multiWallMode === "same")}
              aria-pressed={multiWallMode === "same"}
            >
              Same for all
            </button>
            <button
              type="button"
              onClick={() => handleMultiWallMode("different")}
              className={pillClasses(multiWallMode === "different")}
              aria-pressed={multiWallMode === "different"}
            >
              Different per wall
            </button>
          </div>
        </div>
      )}

      {/* ── Single-size inputs (1 wall, or "same" mode) ── */}
      {(!isMulti || multiWallMode === "same") && (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="pw-overline text-pw-ink">
              {isMulti ? "Size of each wall" : "Width and height"}
            </p>
            {widthCm > 0 && heightCm > 0 && (
              <button
                type="button"
                onClick={onSwapDimensions}
                className="inline-flex items-center gap-1.5 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
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
              <label htmlFor="dim-w" className={FIELD_LABEL}>
                Width (cm)
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
                className={INPUT_CLASSES}
              />
              {widthCm > 0 && (
                <p className="pw-small mt-1.5 text-pw-muted-light">{widthCm} cm = {(widthCm / 100).toFixed(2)} m</p>
              )}
            </div>
            <div>
              <label htmlFor="dim-h" className={FIELD_LABEL}>
                Height (cm)
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
                className={INPUT_CLASSES}
              />
              {heightCm > 0 && (
                <p className="pw-small mt-1.5 text-pw-muted-light">{heightCm} cm = {(heightCm / 100).toFixed(2)} m</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Per-wall inputs (different mode) ── */}
      {usingDifferent && (
        <div className="mt-7 space-y-4">
          {Array.from({ length: wallCount }, (_, i) => {
            const w   = walls[i] ?? { widthM: 0, heightM: 0 };
            const cmW = Math.round(w.widthM  * 100);
            const cmH = Math.round(w.heightM * 100);
            return (
              <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4 sm:p-5">
                <p className="pw-small font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={FIELD_LABEL}>Width (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={cmW > 0 ? cmW : ""}
                      onChange={(e) => setWall(i, "widthM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                      placeholder="e.g. 400"
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL}>Height (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={cmH > 0 ? cmH : ""}
                      onChange={(e) => setWall(i, "heightM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                      placeholder="e.g. 240"
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>
                {w.widthM > 0 && w.heightM > 0 && (
                  <p className="pw-small mt-2 font-medium text-pw-muted">
                    {(w.widthM * w.heightM).toFixed(1)} m²
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Total area ── */}
      {showTotal && totalSqm > 0 && (
        <div className="mt-7 flex items-center justify-between rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5">
          <div>
            <p className="pw-small text-pw-muted">Total print area</p>
            {isMulti && multiWallMode === "same" && (
              <p className="pw-overline text-pw-muted-light">
                {widthCm} × {heightCm} cm × {wallCount} walls
              </p>
            )}
            {usingDifferent && (
              <p className="pw-overline text-pw-muted-light">
                {wallCount} walls, varying sizes
              </p>
            )}
          </div>
          <span className="pw-h3 text-pw-ink">{totalSqm.toFixed(2)} m²</span>
        </div>
      )}
    </ConfigStep>
  );
}
