"use client";

import type { MultiWallMode, WallSpec } from "@/types/configurator";

type DimensionsStepProps = {
  widthM: number;
  heightM: number;
  wallCount: number;
  multiWallMode: MultiWallMode;
  walls: WallSpec[];
  imageWidthPx?: number;
  imageHeightPx?: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onWallCountChange: (v: number) => void;
  onMultiWallModeChange: (m: MultiWallMode) => void;
  onWallsChange: (walls: WallSpec[]) => void;
};

const MIN_PX_PER_MM = 0.83;
type QualityLevel = "good" | "borderline" | "too_low";

function getQuality(
  imgW: number, imgH: number, widthM: number, heightM: number
): { level: QualityLevel; maxWidthM: number; maxHeightM: number } {
  const pxPerMmW = imgW  / (widthM  * 1000);
  const pxPerMmH = imgH  / (heightM * 1000);
  const pxPerMm  = Math.min(pxPerMmW, pxPerMmH);
  const maxWidthM  = imgW  / (MIN_PX_PER_MM * 1000);
  const maxHeightM = imgH  / (MIN_PX_PER_MM * 1000);
  let level: QualityLevel;
  if      (pxPerMm < MIN_PX_PER_MM * 0.7)  level = "too_low";
  else if (pxPerMm < MIN_PX_PER_MM * 1.2)  level = "borderline";
  else                                       level = "good";
  return { level, maxWidthM, maxHeightM };
}

function QualityBadge({ level, maxWidthM, maxHeightM }: { level: QualityLevel; maxWidthM: number; maxHeightM: number }) {
  if (level === "good") {
    return (
      <div className="flex gap-3 rounded-pw border border-green-200 bg-green-50 p-4">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-800">Great image quality</p>
          <p className="mt-0.5 text-sm text-green-700">Your file has enough resolution for a sharp, professional print at this size.</p>
        </div>
      </div>
    );
  }
  if (level === "borderline") {
    return (
      <div className="flex gap-3 rounded-pw border border-amber-200 bg-amber-50 p-4">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">Quality is on the limit</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Looks fine from a normal viewing distance. For maximum crispness, reduce dimensions slightly or use a higher-res file.
            Max recommended: <strong>{(maxWidthM * 100).toFixed(0)} × {(maxHeightM * 100).toFixed(0)} cm</strong>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 rounded-pw border border-red-200 bg-red-50 p-4">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-red-800">Image too low-res for this size</p>
        <p className="mt-0.5 text-sm text-red-700">
          The print will likely look pixelated. Use a higher-resolution image or reduce the wall dimensions.
          Max recommended: <strong>{(maxWidthM * 100).toFixed(0)} × {(maxHeightM * 100).toFixed(0)} cm</strong>.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 text-lg text-pw-ink placeholder:text-pw-muted-light focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10 transition";

export function DimensionsStep({
  widthM, heightM, wallCount, multiWallMode, walls,
  imageWidthPx, imageHeightPx,
  onWidthChange, onHeightChange, onWallCountChange,
  onMultiWallModeChange, onWallsChange,
}: DimensionsStepProps) {
  const isMulti            = wallCount > 1;
  const totalSqmSame       = widthM * heightM * Math.max(1, wallCount);
  const totalSqmDifferent  = walls.length > 0 ? walls.reduce((s, w) => s + w.widthM * w.heightM, 0) : 0;
  const totalSqm           = isMulti && multiWallMode === "different" ? totalSqmDifferent : totalSqmSame;
  const isValidSame        = widthM > 0 && heightM > 0;
  const isValidDifferent   = walls.length === wallCount && walls.every((w) => w.widthM > 0 && w.heightM > 0);

  const quality =
    imageWidthPx && imageHeightPx && widthM > 0 && heightM > 0
      ? getQuality(imageWidthPx, imageHeightPx, widthM, heightM)
      : null;

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
          2
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-pw-ink">Wall dimensions</h2>
          <p className="mt-1 text-sm text-pw-muted">
            Enter the width and height in centimetres. Add 5–10 cm each side for a trimmed edge.
          </p>
        </div>
      </div>

      {/* Wall count */}
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

      {/* Multi-wall mode */}
      {isMulti && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-pw-ink mb-1">Same image and size for all?</label>
          <p className="text-sm text-pw-muted mb-3">
            Same: one design printed at equal size for every wall. Different: configure each wall individually.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleMultiWallMode("same")} className={pillBtn(multiWallMode === "same")}>
              Yes, same for all
            </button>
            <button type="button" onClick={() => handleMultiWallMode("different")} className={pillBtn(multiWallMode === "different")}>
              No, different per wall
            </button>
          </div>
        </div>
      )}

      {/* Single-size inputs */}
      {(!isMulti || multiWallMode === "same") && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dim-w" className="block text-sm font-semibold text-pw-ink mb-2">
              Width <span className="font-normal text-pw-muted">(cm)</span>
            </label>
            <input
              id="dim-w"
              type="number"
              min={10} max={2000} step={1}
              value={widthM > 0 ? Math.round(widthM * 100) : ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageWidthPx) m = Math.min(m, imageWidthPx / (MIN_PX_PER_MM * 1000));
                onWidthChange(Math.round(m * 100) / 100);
              }}
              placeholder="e.g. 400"
              className={inputCls}
            />
            {widthM > 0 && (
              <p className="mt-1.5 text-xs text-pw-muted-light">{(widthM * 100).toFixed(0)} cm = {widthM.toFixed(2)} m</p>
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
              value={heightM > 0 ? Math.round(heightM * 100) : ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageHeightPx) m = Math.min(m, imageHeightPx / (MIN_PX_PER_MM * 1000));
                onHeightChange(Math.round(m * 100) / 100);
              }}
              placeholder="e.g. 240"
              className={inputCls}
            />
            {heightM > 0 && (
              <p className="mt-1.5 text-xs text-pw-muted-light">{(heightM * 100).toFixed(0)} cm = {heightM.toFixed(2)} m</p>
            )}
          </div>
        </div>
      )}

      {/* Per-wall inputs */}
      {isMulti && multiWallMode === "different" && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: wallCount }, (_, i) => {
            const w = walls[i] ?? { widthM: 0, heightM: 0 };
            return (
              <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4">
                <p className="text-sm font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-pw-muted mb-1.5">Width (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={w.widthM > 0 ? Math.round(w.widthM * 100) : ""}
                      onChange={(e) => setWall(i, "widthM", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 400"
                      className="block w-full rounded-pw border border-pw-stone bg-pw-surface px-4 py-3 text-base text-pw-ink placeholder:text-pw-muted-light focus:border-pw-ink focus:outline-none focus:ring-2 focus:ring-pw-ink/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pw-muted mb-1.5">Height (cm)</label>
                    <input
                      type="number" min={10} max={2000} step={1}
                      value={w.heightM > 0 ? Math.round(w.heightM * 100) : ""}
                      onChange={(e) => setWall(i, "heightM", parseFloat(e.target.value) || 0)}
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

      {/* Total area */}
      {totalSqm > 0 && ((!isMulti && isValidSame) || (isMulti && multiWallMode === "same" && isValidSame) || (isMulti && multiWallMode === "different" && isValidDifferent)) && (
        <div className="mt-5 flex items-center justify-between rounded-pw bg-pw-bg border border-pw-stone px-4 py-3">
          <span className="text-sm text-pw-muted">Total print area</span>
          <span className="text-lg font-bold text-pw-ink">{totalSqm.toFixed(2)} m²</span>
        </div>
      )}

      {/* Quality indicator */}
      {!isMulti && quality && (
        <div className="mt-4">
          <QualityBadge level={quality.level} maxWidthM={quality.maxWidthM} maxHeightM={quality.maxHeightM} />
        </div>
      )}
    </section>
  );
}
