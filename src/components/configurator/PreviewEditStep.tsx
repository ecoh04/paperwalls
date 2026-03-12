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

// Photowall-style rule: at least 1 pixel per millimetre of wallpaper.
// 1 px / mm ≈ 25.4 dpi. We treat this as the minimum safe threshold.
const MIN_PX_PER_MM = 1;

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

function describeQuality(
  imgW: number,
  imgH: number,
  widthM: number,
  heightM: number
): {
  pxPerMm: number;
  maxWidthM: number;
  maxHeightM: number;
  level: "too_low" | "borderline" | "good";
} {
  const widthMm = widthM * 1000;
  const heightMm = heightM * 1000;
  const pxPerMmW = imgW / widthMm;
  const pxPerMmH = imgH / heightMm;
  const pxPerMm = Math.min(pxPerMmW, pxPerMmH);
  const maxWidthM = imgW / MIN_PX_PER_MM / 1000;
  const maxHeightM = imgH / MIN_PX_PER_MM / 1000;

  let level: "too_low" | "borderline" | "good";
  if (pxPerMm < MIN_PX_PER_MM * 0.7) level = "too_low";
  else if (pxPerMm < MIN_PX_PER_MM * 1.1) level = "borderline";
  else level = "good";

  return { pxPerMm, maxWidthM, maxHeightM, level };
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
  const [frameSize, setFrameSize] = useState<{ w: number; h: number } | null>(null);

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
    // Fix zoom at the minimum cover scale so the image always fills the wall area
    // and users cannot zoom in past the natural resolution.
    const displayScale = coverScale;
    const sourceW = frameW / displayScale;
    const sourceH = frameH / displayScale;
    const sourceX = natW / 2 - sourceW / 2 - panX / displayScale;
    const sourceY = natH / 2 - sourceH / 2 - panY / displayScale;
    const sx = Math.max(0, Math.min(natW - sourceW, sourceX));
    const sy = Math.max(0, Math.min(natH - sourceH, sourceY));
    const sw = Math.min(sourceW, natW - sx);
    const sh = Math.min(sourceH, natH - sy);
    // Export as high‑resolution as possible while keeping dimensions reasonable for the browser.
    // We take the cropped source region (sw × sh) in the original image space and scale it down
    // only if it exceeds our safety cap. This keeps wallpapers crisp while avoiding 20k+ px exports.
    const OUT_MAX = 8000; // cap longest edge at 8000px, which is already suitable for large walls
    const scaleFactor = Math.min(OUT_MAX / sw, OUT_MAX / sh, 1);
    const outW = Math.max(1, Math.round(sw * scaleFactor));
    const outH = Math.max(1, Math.round(sh * scaleFactor));
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

  // Track the on-screen size of the wall frame so we can ensure the
  // image always fully covers it (no dead space inside the crop area).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const rect = frame.getBoundingClientRect();
      setFrameSize({ w: rect.width, h: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [widthM, heightM]);

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

  const displayScale =
    imgSize && frameSize
      ? Math.max(frameSize.w / imgSize.w, frameSize.h / imgSize.h)
      : 1;

  const quality =
    imgSize && widthM > 0 && heightM > 0
      ? describeQuality(imgSize.w, imgSize.h, widthM, heightM)
      : null;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">3. Preview & crop</h2>
      <p className="mt-2 text-sm text-stone-600">
        Drag to position your image inside the wall area. What you see here is exactly what will be printed.
        {quality && (
          <>
            {" "}
            Your image is{" "}
            <span className="font-medium">
              {imgSize!.w}×{imgSize!.h} px
            </span>
            , which gives about{" "}
            <span className="font-medium">
              {quality.pxPerMm.toFixed(2)} px/mm
            </span>{" "}
            at {widthM.toFixed(2)}×{heightM.toFixed(2)} m.
          </>
        )}
      </p>

      {/* Wall preview and crop area */}
      <div className="mt-6 flex flex-col">
        <div className="mx-auto w-full max-w-2xl">
          <div
            className="relative w-full bg-stone-200/90 rounded-lg"
            style={{ aspectRatio: `${widthM} / ${heightM}` }}
          >
            <div
              ref={frameRef}
              className="absolute inset-0 rounded-md border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.15)] overflow-hidden"
            >
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

            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-manipulation rounded-lg"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-stone-500">
          Only what is visible inside the outlined area is saved and printed.
        </p>
      </div>

      {quality && (
        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs text-stone-600">
            {quality.level === "good" && "Quality looks good for this size."}
            {quality.level === "borderline" &&
              "Quality is on the edge for this size. Consider reducing the wall size a bit for a crisper print."}
            {quality.level === "too_low" &&
              "Image resolution is low for this size. We recommend using a higher-resolution file or reducing the wall size."}
            {" Max recommended size at 1 px/mm is roughly "}
            <span className="font-medium">
              {quality.maxWidthM.toFixed(2)}×{quality.maxHeightM.toFixed(2)} m
            </span>
            .
          </p>
        </div>
      )}
    </section>
  );
}
