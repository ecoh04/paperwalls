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
  imageWidthPx: number,
  imageHeightPx: number,
  widthM: number,
  heightM: number
): { level: QualityLevel; maxWidthM: number; maxHeightM: number; pxPerMm: number } {
  const wallWidthMm  = widthM  * 1000;
  const wallHeightMm = heightM * 1000;
  const pxPerMmW = imageWidthPx  / wallWidthMm;
  const pxPerMmH = imageHeightPx / wallHeightMm;
  const pxPerMm  = Math.min(pxPerMmW, pxPerMmH);
  const maxWidthM  = imageWidthPx  / (MIN_PX_PER_MM * 1000);
  const maxHeightM = imageHeightPx / (MIN_PX_PER_MM * 1000);
  let level: QualityLevel;
  if      (pxPerMm < MIN_PX_PER_MM * 0.7)  level = "too_low";
  else if (pxPerMm < MIN_PX_PER_MM * 1.2)  level = "borderline";
  else                                       level = "good";
  return { level, maxWidthM, maxHeightM, pxPerMm };
}

function QualityBadge({
  level, maxWidthM, maxHeightM,
}: { level: QualityLevel; maxWidthM: number; maxHeightM: number }) {
  if (level === "good") {
    return (
      <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-800">Image quality looks great</p>
          <p className="mt-0.5 text-sm text-green-700">
            Your image has enough resolution for a sharp, professional print at this size.
          </p>
        </div>
      </div>
    );
  }
  if (level === "borderline") {
    return (
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">Quality is on the limit</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Your image will look fine from a normal viewing distance, but won't be razor-sharp up close.
            For maximum crispness, reduce the wall size slightly or use a higher-res file.
            Max recommended: <strong>{(maxWidthM * 100).toFixed(0)} × {(maxHeightM * 100).toFixed(0)} cm</strong>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-red-800">Image too low-res for this wall size</p>
        <p className="mt-0.5 text-sm text-red-700">
          The print will look pixelated at this size. We strongly recommend using a higher-resolution
          image or reducing the dimensions. Max recommended: <strong>{(maxWidthM * 100).toFixed(0)} × {(maxHeightM * 100).toFixed(0)} cm</strong>.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "block w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-lg text-stone-900 placeholder:text-stone-300 focus:border-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition";

export function DimensionsStep({
  widthM, heightM, wallCount, multiWallMode, walls,
  imageWidthPx, imageHeightPx,
  onWidthChange, onHeightChange, onWallCountChange,
  onMultiWallModeChange, onWallsChange,
}: DimensionsStepProps) {
  const isMulti = wallCount > 1;
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
    const next: WallSpec[] = [];
    for (let i = 0; i < n; i++) next.push(walls[i] ?? { widthM: 0, heightM: 0 });
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

  const setWall = (index: number, field: "widthM" | "heightM", value: number) => {
    const next = [...walls];
    if (!next[index]) next[index] = { widthM: 0, heightM: 0 };
    next[index] = { ...next[index], [field]: value };
    onWallsChange(next);
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Step header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
          2
        </span>
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Wall dimensions</h2>
          <p className="mt-1 text-sm text-stone-500">
            Enter the width and height of your wall in centimetres.
            Add 5–10 cm on each side for trimming.
          </p>
        </div>
      </div>

      {/* Wall count */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-3">
          How many walls?
        </label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleWallCountChange(n)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                wallCount === n
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
              }`}
            >
              {n} wall{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-wall mode */}
      {isMulti && (
        <div className="mt-6">
          <label className="block text-sm font-semibold text-stone-700 mb-1">
            Same image and size for all walls?
          </label>
          <p className="text-sm text-stone-500 mb-3">
            If all walls are the same, we print one design across all of them at the same size.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "same", label: "Yes, same for all" },
              { id: "different", label: "No, different per wall" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleMultiWallMode(opt.id as MultiWallMode)}
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  multiWallMode === opt.id
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single size inputs */}
      {(!isMulti || multiWallMode === "same") && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dim-width" className="block text-sm font-semibold text-stone-700 mb-2">
              Width <span className="font-normal text-stone-400">(cm)</span>
            </label>
            <input
              id="dim-width"
              type="number"
              min={10}
              max={2000}
              step={1}
              value={widthM > 0 ? Math.round(widthM * 100) : ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageWidthPx) {
                  const maxM = imageWidthPx / (MIN_PX_PER_MM * 1000);
                  if (m > maxM) m = Math.round(maxM * 100) / 100;
                }
                onWidthChange(m);
              }}
              placeholder="e.g. 400"
              className={inputClass}
            />
            {widthM > 0 && (
              <p className="mt-1.5 text-xs text-stone-400">{(widthM * 100).toFixed(0)} cm = {widthM.toFixed(2)} m</p>
            )}
          </div>
          <div>
            <label htmlFor="dim-height" className="block text-sm font-semibold text-stone-700 mb-2">
              Height <span className="font-normal text-stone-400">(cm)</span>
            </label>
            <input
              id="dim-height"
              type="number"
              min={10}
              max={2000}
              step={1}
              value={heightM > 0 ? Math.round(heightM * 100) : ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageHeightPx) {
                  const maxM = imageHeightPx / (MIN_PX_PER_MM * 1000);
                  if (m > maxM) m = Math.round(maxM * 100) / 100;
                }
                onHeightChange(m);
              }}
              placeholder="e.g. 240"
              className={inputClass}
            />
            {heightM > 0 && (
              <p className="mt-1.5 text-xs text-stone-400">{(heightM * 100).toFixed(0)} cm = {heightM.toFixed(2)} m</p>
            )}
          </div>
        </div>
      )}

      {/* Per-wall inputs for different mode */}
      {isMulti && multiWallMode === "different" && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: wallCount }, (_, i) => {
            const w = walls[i] ?? { widthM: 0, heightM: 0 };
            return (
              <div key={i} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-700 mb-3">Wall {i + 1}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">Width (cm)</label>
                    <input
                      type="number"
                      min={10}
                      max={2000}
                      step={1}
                      value={w.widthM > 0 ? Math.round(w.widthM * 100) : ""}
                      onChange={(e) => setWall(i, "widthM", (parseFloat(e.target.value) || 0) / 100)}
                      placeholder="e.g. 400"
                      className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-300 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1.5">Height (cm)</label>
                    <input
                      type="number"
                      min={10}
                      max={2000}
                      step={1}
                      value={w.heightM > 0 ? Math.round(w.heightM * 100) : ""}
                      onChange={(e) => setWall(i, "heightM", (parseFloat(e.target.value) || 0) / 100)}
                      placeholder="e.g. 240"
                      className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-300 focus:border-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition"
                    />
                  </div>
                </div>
                {w.widthM > 0 && w.heightM > 0 && (
                  <p className="mt-2 text-xs text-stone-500 font-medium">
                    {(w.widthM * w.heightM).toFixed(1)} m²
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total area display */}
      {totalSqm > 0 && (
        ((!isMulti && isValidSame) ||
         (isMulti && multiWallMode === "same" && isValidSame) ||
         (isMulti && multiWallMode === "different" && isValidDifferent)) && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
            <span className="text-sm text-stone-600">Total print area</span>
            <span className="text-lg font-bold text-stone-900">{totalSqm.toFixed(2)} m²</span>
          </div>
        )
      )}

      {/* Quality indicator */}
      {!isMulti && quality && (
        <div className="mt-4">
          <QualityBadge
            level={quality.level}
            maxWidthM={quality.maxWidthM}
            maxHeightM={quality.maxHeightM}
          />
        </div>
      )}
    </section>
  );
}
