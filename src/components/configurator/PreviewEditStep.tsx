"use client";

import { useCallback, useRef, useState, useEffect } from "react";

type PreviewEditStepProps = {
  imageUrl: string | null;
  widthM: number;
  heightM: number;
  wallCount?: number;
  wallLabel?: string;
  panX: number;
  panY: number;
  scale: number;
  onPanChange: (x: number, y: number) => void;
  onScaleChange: (s: number) => void;
  onCropDataReady?: (getBlob: () => Promise<Blob | null>) => void;
};

const OVERFLOW_SCALE = 1.2;
const FRAME_PCT = 100 / OVERFLOW_SCALE;
const OVERFLOW_PCT = ((OVERFLOW_SCALE - 1) / 2 / OVERFLOW_SCALE) * 100;

/** Generate tick positions for a ruler (0 to max in m). */
function rulerTicks(maxM: number): number[] {
  if (maxM <= 0) return [0];
  const step = maxM <= 1 ? 0.25 : maxM <= 3 ? 0.5 : 1;
  const ticks: number[] = [0];
  let v = step;
  while (v < maxM - 0.01) {
    ticks.push(v);
    v += step;
  }
  ticks.push(maxM);
  return ticks;
}

export function PreviewEditStep({
  imageUrl,
  widthM,
  heightM,
  wallCount = 1,
  wallLabel,
  panX,
  panY,
  scale,
  onPanChange,
  onScaleChange,
  onCropDataReady,
}: PreviewEditStepProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [showRuler, setShowRuler] = useState(false);

  const aspectRatio = widthM > 0 && heightM > 0 ? widthM / heightM : 16 / 9;

  /**
   * Exports exactly the pixels visible inside the print frame as a JPEG.
   * This blob is what we store in the cart and send to the factory—no further cropping.
   */
  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img || !img.naturalWidth || !imgSize) return null;
    const rect = frame.getBoundingClientRect();
    const frameW = rect.width;
    const frameH = rect.height;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const coverScale = Math.max(frameW / natW, frameH / natH);
    const displayScale = coverScale * scale;
    const sourceW = frameW / displayScale;
    const sourceH = frameH / displayScale;
    const sourceX = natW / 2 - sourceW / 2 - panX / displayScale;
    const sourceY = natH / 2 - sourceH / 2 - panY / displayScale;
    const sx = Math.max(0, Math.min(natW - sourceW, sourceX));
    const sy = Math.max(0, Math.min(natH - sourceH, sourceY));
    const sw = Math.min(sourceW, natW - sx);
    const sh = Math.min(sourceH, natH - sy);
    const outMax = 2000;
    const outW = Math.min(outMax, Math.round((sw / natW) * outMax));
    const outH = Math.min(outMax, Math.round((sh / natH) * outMax));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }, [panX, panY, scale, imgSize]);

  useEffect(() => {
    if (onCropDataReady) onCropDataReady(getCroppedBlob);
  }, [onCropDataReady, getCroppedBlob]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (img) setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ panX, panY, clientX: e.clientX, clientY: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;
    onPanChange(
      dragStart.panX + (e.clientX - dragStart.clientX),
      dragStart.panY + (e.clientY - dragStart.clientY)
    );
  };

  const handlePointerUp = () => setIsDragging(false);

  if (!imageUrl || widthM <= 0 || heightM <= 0) return null;

  const coverScale = imgSize
    ? Math.max(400 / imgSize.w, (400 / aspectRatio) / imgSize.h)
    : 1;
  const displayScale = coverScale * scale;

  const widthTicks = rulerTicks(widthM);
  const heightTicks = rulerTicks(heightM);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">3. Preview & adjust</h2>
      <p className="mt-2 text-sm text-stone-600">
        Drag to position and use the slider to zoom. The white frame is your exact print area.
      </p>

      {/* Optional ruler + preview area */}
      <div className="mt-6 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setShowRuler((r) => !r)}
            className={`text-sm font-medium px-3 py-1.5 rounded-md border transition-colors ${showRuler ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"}`}
          >
            {showRuler ? "Hide ruler" : "Show ruler"}
          </button>
        </div>

        <div className="flex items-stretch gap-0 mx-auto w-full max-w-2xl">
          {/* Y-axis: only when showRuler */}
          {showRuler && (
            <div className="relative shrink-0 w-14 border-r border-stone-300 bg-stone-50/80 rounded-l-lg py-2 pr-2 self-stretch">
              <span className="absolute top-0 right-2 text-[10px] font-medium uppercase tracking-wider text-stone-400">Height</span>
              <div className="absolute inset-0 pt-6 pr-2">
                {heightTicks.map((t) => (
                  <div
                    key={t}
                    className="absolute flex items-center justify-end gap-1 -translate-y-1/2 right-0"
                    style={{ top: `${heightM > 0 ? (1 - t / heightM) * 100 : 0}%` }}
                  >
                    <span className="text-[10px] tabular-nums text-stone-500">{t}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`flex-1 min-w-0 ${showRuler ? "" : "rounded-lg"}`}>
            <div
              className={`relative w-full bg-stone-200/90 ${showRuler ? "rounded-r-lg rounded-l-none" : "rounded-lg"}`}
              style={{ aspectRatio: `${widthM * OVERFLOW_SCALE} / ${heightM * OVERFLOW_SCALE}` }}
            >
              <div className={`absolute inset-0 overflow-hidden ${showRuler ? "rounded-r-lg" : "rounded-lg"}`}>
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Your design"
                  onLoad={handleImgLoad}
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none object-cover"
                  style={{
                    width: imgSize ? imgSize.w * displayScale : "100%",
                    height: imgSize ? imgSize.h * displayScale : "100%",
                    transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                  }}
                />
              </div>

              <div className={`absolute inset-0 pointer-events-none ${showRuler ? "rounded-r-lg" : "rounded-lg"}`}>
                <div className={`absolute left-0 top-0 right-0 h-[9.1%] bg-black/50 ${showRuler ? "rounded-tr-lg" : "rounded-t-lg"}`} />
                <div className={`absolute bottom-0 left-0 right-0 h-[9.1%] bg-black/50 ${showRuler ? "rounded-br-lg" : "rounded-b-lg"}`} />
                <div className="absolute left-0 top-[9.1%] bottom-[9.1%] w-[9.1%] bg-black/50" />
                <div className={`absolute right-0 top-[9.1%] bottom-[9.1%] w-[9.1%] bg-black/50 ${showRuler ? "rounded-r-lg" : "rounded-r-lg"}`} />
              </div>

              {/* Print frame – no black bar; this exact area is exported and printed */}
              <div
                ref={frameRef}
                className="absolute rounded-md border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.15)] overflow-hidden"
                style={{
                  left: `${OVERFLOW_PCT}%`,
                  top: `${OVERFLOW_PCT}%`,
                  width: `${FRAME_PCT}%`,
                  height: `${FRAME_PCT}%`,
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none object-cover"
                  style={{
                    width: imgSize ? imgSize.w * displayScale : "100%",
                    height: imgSize ? imgSize.h * displayScale : "100%",
                    transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                  }}
                />
              </div>

              <div
                className={`absolute inset-0 cursor-grab active:cursor-grabbing touch-manipulation ${showRuler ? "rounded-r-lg" : "rounded-lg"}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>

            {showRuler && (
              <div className="flex mt-1 pl-14 items-end border-t border-stone-300 bg-stone-50/80 rounded-b-lg pt-2 h-12">
                <span className="absolute left-2 text-[10px] font-medium uppercase tracking-wider text-stone-400 top-3">Width</span>
                <div
                  className="relative h-full flex-1 min-w-0"
                  style={{ marginLeft: `${OVERFLOW_PCT}%`, width: `${FRAME_PCT}%` }}
                >
                  {widthTicks.map((t) => (
                    <div
                      key={t}
                      className="absolute flex flex-col items-center -translate-x-1/2 bottom-0"
                      style={{ left: `${widthM > 0 ? (t / widthM) * 100 : 0}%` }}
                    >
                      <span className="w-px h-2 bg-stone-400 shrink-0" />
                      <span className="text-[10px] tabular-nums mt-1 text-stone-500">{t}m</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-stone-500">
          Grey area is outside your print. Only the white-framed area is saved and printed.
        </p>
      </div>

      {/* Zoom */}
      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="preview-zoom" className="text-sm font-medium text-stone-800">
            Zoom
          </label>
          <span className="text-xs text-stone-500">
            {scale <= 0.75 ? "Zoomed out" : scale >= 1.5 ? "Zoomed in" : "Default"}
          </span>
        </div>
        <input
          id="preview-zoom"
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="mt-2 w-full accent-stone-800 h-3 touch-manipulation"
          aria-label="Zoom in or out"
        />
      </div>
    </section>
  );
}
