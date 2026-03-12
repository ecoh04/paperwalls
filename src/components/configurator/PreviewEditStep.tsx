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

// Photowall-style rule: minimum quality threshold is ~21 dpi.
// 21 dpi ≈ 0.83 px/mm. We use this as our minimum safe threshold.
const MIN_PX_PER_MM = 0.83;

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
    if (!isDragging || !dragStart || !imgSize || !frameSize) return;

    const dx = e.clientX - dragStart.clientX;
    const dy = e.clientY - dragStart.clientY;

    const wallAspect = widthM > 0 && heightM > 0 ? widthM / heightM : 1;
    const imgAspect = imgSize.w / imgSize.h;
    // Decide primary drag axis, mirroring Photowall:
    // if image is wider than wall -> drag along X; otherwise along Y.
    const dragAxis: "x" | "y" = imgAspect > wallAspect ? "x" : "y";

    // Compute scaled image size inside the wall frame.
    const displayScale = Math.max(frameSize.w / imgSize.w, frameSize.h / imgSize.h);
    const imgDisplayW = imgSize.w * displayScale;
    const imgDisplayH = imgSize.h * displayScale;
    const halfFrameW = frameSize.w / 2;
    const halfFrameH = frameSize.h / 2;
    const halfImgW = imgDisplayW / 2;
    const halfImgH = imgDisplayH / 2;

    // Allowed pan range so that the image always fully covers the wall frame
    // (no white space can appear inside).
    const minPanX = halfFrameW - halfImgW;
    const maxPanX = halfImgW - halfFrameW;
    const minPanY = halfFrameH - halfImgH;
    const maxPanY = halfImgH - halfFrameH;

    const nextPanXRaw = dragStart.panX + dx;
    const nextPanYRaw = dragStart.panY + dy;

    const nextPanX =
      dragAxis === "x"
        ? Math.min(Math.max(nextPanXRaw, minPanX), maxPanX)
        : 0;
    const nextPanY =
      dragAxis === "y"
        ? Math.min(Math.max(nextPanYRaw, minPanY), maxPanY)
        : 0;

    onPanChange(nextPanX, nextPanY);
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

      {/* Wall preview and crop area – Photowall-style grey grid with centred wall */}
      <div className="mt-6 flex flex-col">
        <div className="mx-auto w-full max-w-4xl">
          <div
            className="relative w-full rounded-xl border border-stone-200 bg-stone-100/90 overflow-hidden"
            style={{
              // Subtle diagonal grid in the outer area, similar to Photowall's guides
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(148,148,148,0.18) 0, rgba(148,148,148,0.18) 1px, transparent 1px, transparent 16px)",
            }}
          >
            {/* Centre guidelines (faint diagonals) */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-0 top-0 h-px w-full bg-stone-300/40" />
              <div className="absolute right-0 bottom-0 h-px w-full bg-stone-300/40" />
            </div>

            {/* Wall frame */}
            <div className="relative mx-auto my-10 w-[72%] max-w-[720px]">
              <div
                className="relative w-full bg-stone-200/95 rounded-md shadow-sm"
                style={{ aspectRatio: `${widthM} / ${heightM}` }}
              >
                <div
                  ref={frameRef}
                  className="absolute inset-0 rounded-md border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.15)] overflow-hidden bg-stone-100"
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

                {/* Drag overlay */}
                <div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing touch-manipulation rounded-md"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>

              {/* Bottom width ruler-style label */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-stone-400" />
                <span className="text-xs font-medium text-stone-700">
                  {widthCm.toFixed(0)} cm
                </span>
                <div className="h-px flex-1 bg-stone-400" />
              </div>

              {/* Right-hand height label */}
              <div className="absolute inset-y-0 -right-10 hidden md:flex flex-col items-center justify-center gap-2">
                <div className="w-px flex-1 bg-stone-400" />
                <span className="text-xs font-medium text-stone-700 rotate-90 whitespace-nowrap">
                  {heightCm.toFixed(0)} cm
                </span>
                <div className="w-px flex-1 bg-stone-400" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-stone-500 text-center">
          Only what is visible inside the inner framed wall area is saved and printed.
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
