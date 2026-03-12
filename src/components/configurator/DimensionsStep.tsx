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

export function DimensionsStep({
  widthM,
  heightM,
  wallCount,
  multiWallMode,
  walls,
  imageWidthPx,
  imageHeightPx,
  onWidthChange,
  onHeightChange,
  onWallCountChange,
  onMultiWallModeChange,
  onWallsChange,
}: DimensionsStepProps) {
  const isMulti = wallCount > 1;
  const totalSqmSame = widthM * heightM * Math.max(1, wallCount);
  const totalSqmDifferent =
    walls.length > 0
      ? walls.reduce((sum, w) => sum + w.widthM * w.heightM, 0)
      : 0;
  const totalSqm = isMulti && multiWallMode === "different" ? totalSqmDifferent : totalSqmSame;
  const isValidSame = widthM > 0 && heightM > 0;
  const isValidDifferent =
    walls.length === wallCount &&
    walls.every((w) => w.widthM > 0 && w.heightM > 0);

  const widthCm = widthM * 100;
  const heightCm = heightM * 100;

  let qualityText: string | null = null;
  if (imageWidthPx && imageHeightPx && widthM > 0 && heightM > 0) {
    const wallWidthMm = widthM * 1000;
    const wallHeightMm = heightM * 1000;
    const pxPerMmW = imageWidthPx / wallWidthMm;
    const pxPerMmH = imageHeightPx / wallHeightMm;
    const pxPerMm = Math.min(pxPerMmW, pxPerMmH);
    const maxWidthM = imageWidthPx / 1000;
    const maxHeightM = imageHeightPx / 1000;

    let level: "good" | "borderline" | "too_low";
    if (pxPerMm < 0.7) level = "too_low";
    else if (pxPerMm < 1.1) level = "borderline";
    else level = "good";

    const base = `At this size your image has about ${pxPerMm.toFixed(2)} px/mm. `;
    const maxText = `Max recommended size at 1 px/mm is approximately ${(maxWidthM * 100).toFixed(0)} × ${(maxHeightM * 100).toFixed(0)} cm.`;
    if (level === "good") {
      qualityText = base + "Quality looks good for this wall size. " + maxText;
    } else if (level === "borderline") {
      qualityText =
        base +
        "Quality is on the edge for this wall size. Consider reducing the dimensions slightly for a crisper print. " +
        maxText;
    } else {
      qualityText =
        base +
        "Image resolution is low for this wall size. We recommend using a higher‑resolution file or reducing the dimensions. " +
        maxText;
    }
  }

  const ensureWallsLength = (n: number) => {
    if (walls.length === n) return;
    const next: WallSpec[] = [];
    for (let i = 0; i < n; i++) {
      next.push(walls[i] ?? { widthM: 0, heightM: 0 });
    }
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
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">2. Wall dimensions</h2>
      <p className="mt-1 text-sm text-stone-600">
        Enter the width and height of your wall(s) in centimetres. We’ll convert to meters and area for pricing.
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium text-stone-700">How many walls?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleWallCountChange(n)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                wallCount === n
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {n} wall{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {isMulti && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-stone-700">
            Same size and image for all walls?
          </label>
          <p className="mt-0.5 text-xs text-stone-500">
            Same: one size and one image, we print that for each wall. Different: enter dimensions (and later image) for each wall.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleMultiWallMode("same")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                multiWallMode === "same"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              Yes, same for all
            </button>
            <button
              type="button"
              onClick={() => handleMultiWallMode("different")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                multiWallMode === "different"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              No, different sizes
            </button>
          </div>
        </div>
      )}

      {(!isMulti || multiWallMode === "same") && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-stone-700">
              Width (cm)
            </label>
            <input
              id="width"
              type="number"
              min={10}
              max={2000}
              step={1}
              value={widthCm || ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageWidthPx) {
                  const maxM = imageWidthPx / 1000;
                  if (m > maxM) m = maxM;
                }
                onWidthChange(m);
              }}
              placeholder="e.g. 400"
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
            {widthM > 0 && (
              <p className="mt-1 text-xs text-stone-500">{widthCm.toFixed(0)} cm = {widthM.toFixed(2)} m</p>
            )}
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-stone-700">
              Height (cm)
            </label>
            <input
              id="height"
              type="number"
              min={10}
              max={2000}
              step={1}
              value={heightCm || ""}
              onChange={(e) => {
                const cm = parseFloat(e.target.value) || 0;
                let m = cm / 100;
                if (imageHeightPx) {
                  const maxM = imageHeightPx / 1000;
                  if (m > maxM) m = maxM;
                }
                onHeightChange(m);
              }}
              placeholder="e.g. 240"
              className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
            {heightM > 0 && (
              <p className="mt-1 text-xs text-stone-500">{heightCm.toFixed(0)} cm = {heightM.toFixed(2)} m</p>
            )}
          </div>
        </div>
      )}

      {isMulti && multiWallMode === "different" && (
        <div className="mt-6 space-y-6">
          {Array.from({ length: wallCount }, (_, i) => {
            const w = walls[i] ?? { widthM: 0, heightM: 0 };
            return (
              <div
                key={i}
                className="rounded-lg border border-stone-200 bg-stone-50/50 p-4"
              >
                <h3 className="text-sm font-medium text-stone-800">Wall {i + 1}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-600">Width (m)</label>
                    <input
                      type="number"
                      min={0.1}
                      max={20}
                      step={0.1}
                      value={w.widthM || ""}
                      onChange={(e) => setWall(i, "widthM", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 3.5"
                      className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600">Height (m)</label>
                    <input
                      type="number"
                      min={0.1}
                      max={20}
                      step={0.1}
                      value={w.heightM || ""}
                      onChange={(e) => setWall(i, "heightM", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 2.4"
                      className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
                    />
                  </div>
                </div>
                {w.widthM > 0 && w.heightM > 0 && (
                  <p className="mt-2 text-xs text-stone-600">
                    {(w.widthM * w.heightM).toFixed(1)} m²
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {((!isMulti && isValidSame) || (isMulti && multiWallMode === "same" && isValidSame) || (isMulti && multiWallMode === "different" && isValidDifferent)) && (
        <p className="mt-6 text-sm font-medium text-stone-700">
          Total area: <span className="text-stone-900">{totalSqm.toFixed(1)} m²</span>
        </p>
      )}
      {!isMulti && qualityText && (
        <p className="mt-2 text-xs text-stone-600">
          {qualityText}{" "}
          <span className="block text-[11px] text-pink-600 mt-1">
            Tip: add 6–10 cm to both width and height so you can trim the wallpaper perfectly on site.
          </span>
        </p>
      )}
    </section>
  );
}
