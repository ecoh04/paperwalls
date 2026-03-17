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
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
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

  const widthCm = widthM * 100;
  const heightCm = heightM * 100;

  const quality =
    imgSize && widthM > 0 && heightM > 0
      ? describeQuality(imgSize.w, imgSize.h, widthM, heightM)
      : null;

  return (
    <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5 shadow-pw-sm sm:p-8">
      {/* Step header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pw-ink text-sm font-bold text-white">
          3
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-pw-ink">
            Position your image{wallLabel ?? ""}
          </h2>
          <p className="mt-1 text-sm text-pw-muted">
            Drag to reframe. Only what's inside the bordered area will be printed.
          </p>
        </div>
      </div>

      {/* Wall preview and crop area – Photowall-style grey grid with centred wall */}
      <div className="mt-6 flex flex-col">
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="relative w-full rounded-xl border border-pw-stone bg-pw-bg/90 overflow-hidden"
            style={{
              // Subtle diagonal grid in the outer area, similar to Photowall's guides
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(148,148,148,0.18) 0, rgba(148,148,148,0.18) 1px, transparent 1px, transparent 16px)",
            }}
          >
            {/* Faint full-image backdrop so users see what is being cropped away */}
            {imgSize && (
              <div className="pointer-events-none absolute inset-0 opacity-25">
                <img
                  src={imageUrl!}
                  alt=""
                  aria-hidden
                  className="absolute left-1/2 top-1/2 max-w-none select-none object-cover"
                  style={{
                    width: imgSize.w * displayScale,
                    height: imgSize.h * displayScale,
                    transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                  }}
                />
              </div>
            )}

            {/* Wall frame */}
            <div className="relative mx-auto my-8 w-[78%] max-w-[840px]">
              <div
                className="relative w-full bg-pw-stone/80 rounded-md shadow-sm"
                style={{ aspectRatio: `${widthM} / ${heightM}` }}
              >
                <div
                  ref={frameRef}
                  className="absolute inset-0 rounded-md border-[3px] border-pw-ink/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)] overflow-hidden bg-pw-surface/90"
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

                {/* Drag overlay — touch-action:none tells the browser not to scroll
                    on this element so pointer events fire cleanly. Scrolling the
                    page still works by touching outside this frame. */}
                <div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-md"
                  style={{ touchAction: "none" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>

              {/* Bottom width ruler-style label */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-pw-muted" />
                <span className="text-xs font-medium text-pw-ink tracking-wide">
                  {widthCm.toFixed(0)} cm
                </span>
                <div className="h-px flex-1 bg-pw-muted" />
              </div>

              {/* Right-hand height label */}
              <div className="absolute inset-y-0 -right-10 hidden md:flex flex-col items-center justify-center gap-2">
                <div className="w-px flex-1 bg-pw-muted" />
                <span className="text-xs font-medium text-pw-ink rotate-90 whitespace-nowrap tracking-wide">
                  {heightCm.toFixed(0)} cm
                </span>
                <div className="w-px flex-1 bg-pw-muted" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-pw-muted text-center">
          Only what is visible inside the bordered area is printed.
          <span className="sm:hidden"> Drag inside the frame to reposition — scroll outside it to move down the page.</span>
        </p>
      </div>


      {quality && quality.level !== "good" && (
        <div
          className={[
            "mt-5 flex gap-3 rounded-xl border p-4",
            quality.level === "too_low"
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50",
          ].join(" ")}
        >
          <svg
            className={["mt-0.5 h-5 w-5 shrink-0", quality.level === "too_low" ? "text-red-500" : "text-amber-500"].join(" ")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className={["text-sm font-semibold", quality.level === "too_low" ? "text-red-800" : "text-amber-800"].join(" ")}>
              {quality.level === "too_low" ? "Image too low-res for this wall size" : "Quality is close to the limit"}
            </p>
            <p className={["mt-0.5 text-sm", quality.level === "too_low" ? "text-red-700" : "text-amber-700"].join(" ")}>
              {quality.level === "too_low"
                ? "The print may look pixelated. Consider a higher-res file or reduce the wall size."
                : "Will look good from a normal viewing distance. For sharper results, reduce dimensions slightly."}{" "}
              Max recommended:{" "}
              <strong>{quality.maxWidthM.toFixed(2)} x {quality.maxHeightM.toFixed(2)} m</strong>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
