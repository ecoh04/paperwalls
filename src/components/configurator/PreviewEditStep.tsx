"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { getQuality, formatMaxSizeCm } from "@/lib/quality";

type PreviewEditStepProps = {
  /** Step chip label. Not shown when `compact` is true. */
  stepNumber?:      number;
  /** Optional sub-heading suffix, e.g. " · Wall 1" */
  wallLabel?:       string;
  /** Skips the outer card + heading (useful when nested inside a multi-wall wrapper). */
  compact?:         boolean;
  imageUrl:         string | null;
  widthM:           number;
  heightM:          number;
  panX:             number;
  panY:             number;
  onPanChange:      (x: number, y: number) => void;
  onCropDataReady?: (getBlob: () => Promise<Blob | null>) => void;
};

export function PreviewEditStep({
  stepNumber,
  wallLabel,
  compact = false,
  imageUrl,
  widthM,
  heightM,
  panX,
  panY,
  onPanChange,
  onCropDataReady,
}: PreviewEditStepProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart,  setDragStart]  = useState<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);
  const [imgSize,    setImgSize]    = useState<{ w: number; h: number } | null>(null);
  const [frameSize,  setFrameSize]  = useState<{ w: number; h: number } | null>(null);

  /**
   * Exports exactly the pixels visible inside the print frame as a JPEG.
   * Display always uses cover scale (no zoom) — the image fills the frame edge-to-edge,
   * panning lets the user choose which portion is kept.
   */
  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    const frame = frameRef.current;
    const img   = imgRef.current;
    if (!frame || !img || !img.naturalWidth || !imgSize) return null;

    const rect    = frame.getBoundingClientRect();
    const frameW  = rect.width;
    const frameH  = rect.height;
    const natW    = img.naturalWidth;
    const natH    = img.naturalHeight;
    const cover   = Math.max(frameW / natW, frameH / natH);

    const sourceW = frameW / cover;
    const sourceH = frameH / cover;
    const sourceX = natW / 2 - sourceW / 2 - panX / cover;
    const sourceY = natH / 2 - sourceH / 2 - panY / cover;
    const sx      = Math.max(0, Math.min(natW - sourceW, sourceX));
    const sy      = Math.max(0, Math.min(natH - sourceH, sourceY));
    const sw      = Math.min(sourceW, natW - sx);
    const sh      = Math.min(sourceH, natH - sy);

    // Cap longest edge at 4000 px to keep cart localStorage workable while staying sharp
    // (covers a 4.8m wall at the 0.83 px/mm threshold).
    const OUT_MAX     = 4000;
    const scaleFactor = Math.min(OUT_MAX / sw, OUT_MAX / sh, 1);
    const outW        = Math.max(1, Math.round(sw * scaleFactor));
    const outH        = Math.max(1, Math.round(sh * scaleFactor));

    const canvas = document.createElement("canvas");
    canvas.width  = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  }, [panX, panY, imgSize]);

  useEffect(() => {
    if (onCropDataReady) onCropDataReady(getCroppedBlob);
  }, [onCropDataReady, getCroppedBlob]);

  // Track on-screen frame size so the image always fully covers it (no dead space inside crop area).
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

    const cover       = Math.max(frameSize.w / imgSize.w, frameSize.h / imgSize.h);
    const imgDisplayW = imgSize.w * cover;
    const imgDisplayH = imgSize.h * cover;

    // Pan range that keeps image fully covering the frame on each axis.
    const maxPanX = Math.max(0, (imgDisplayW - frameSize.w) / 2);
    const maxPanY = Math.max(0, (imgDisplayH - frameSize.h) / 2);

    const nextX = Math.min(maxPanX, Math.max(-maxPanX, dragStart.panX + dx));
    const nextY = Math.min(maxPanY, Math.max(-maxPanY, dragStart.panY + dy));

    onPanChange(nextX, nextY);
  };

  const handlePointerUp = () => setIsDragging(false);

  if (!imageUrl || widthM <= 0 || heightM <= 0) return null;

  const cover =
    imgSize && frameSize
      ? Math.max(frameSize.w / imgSize.w, frameSize.h / imgSize.h)
      : 1;

  const widthCm  = widthM  * 100;
  const heightCm = heightM * 100;

  const quality = imgSize && widthM > 0 && heightM > 0
    ? getQuality(imgSize.w, imgSize.h, widthM, heightM)
    : null;

  const previewBody = (
    <>
      {/* Wall preview and crop area */}
      <div className="flex flex-col">
        <div className="mx-auto w-full max-w-5xl">
          <div
            className="relative w-full rounded-xl border border-pw-stone bg-pw-bg/90 overflow-hidden"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(148,148,148,0.14) 0, rgba(148,148,148,0.14) 1px, transparent 1px, transparent 16px)",
            }}
          >
            {/* Faint full-image backdrop so users see what's being cropped away */}
            {imgSize && (
              <div className="pointer-events-none absolute inset-0 opacity-25">
                <img
                  src={imageUrl}
                  alt=""
                  aria-hidden
                  className="absolute left-1/2 top-1/2 max-w-none select-none object-cover"
                  style={{
                    width:  imgSize.w * cover,
                    height: imgSize.h * cover,
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
                  className="absolute inset-0 rounded-md border-[3px] border-pw-ink/80 shadow-[0_0_0_1px_rgba(0,0,0,0.18)] overflow-hidden bg-pw-surface/90"
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Your design"
                    onLoad={handleImgLoad}
                    draggable={false}
                    className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none object-cover"
                    style={{
                      width:  imgSize ? imgSize.w * cover : "100%",
                      height: imgSize ? imgSize.h * cover : "100%",
                      transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                    }}
                  />
                </div>

                <div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-md"
                  style={{ touchAction: "none" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
              </div>

              {/* Bottom width label */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-pw-stone-dark" />
                <span className="text-xs font-medium text-pw-muted tracking-wide">
                  {widthCm.toFixed(0)} cm
                </span>
                <div className="h-px flex-1 bg-pw-stone-dark" />
              </div>

              {/* Right-hand height label */}
              <div className="absolute inset-y-0 -right-10 hidden md:flex flex-col items-center justify-center gap-2">
                <div className="w-px flex-1 bg-pw-stone-dark" />
                <span className="text-xs font-medium text-pw-muted rotate-90 whitespace-nowrap tracking-wide">
                  {heightCm.toFixed(0)} cm
                </span>
                <div className="w-px flex-1 bg-pw-stone-dark" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-pw-muted-light text-center">
          Drag to reposition. Only what's inside the frame will be printed.
        </p>
      </div>

      {quality && quality.level !== "good" && (
        <div
          className={[
            "mt-5 flex gap-3 rounded-xl border p-4",
            quality.level === "too_low"
              ? "border-amber-300 bg-amber-50"
              : "border-amber-200 bg-amber-50/60",
          ].join(" ")}
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {quality.level === "too_low"
                ? "Image is a bit small for this wall size"
                : "Sharpness is on the edge"}
            </p>
            <p className="mt-0.5 text-sm text-amber-800">
              {quality.level === "too_low"
                ? "We can't print this sharply at this size. Use a higher-resolution image, or reduce the wall a little."
                : "It'll look fine from a normal viewing distance. For sharper results, reduce the wall slightly or use a higher-res image."}{" "}
              Best up to: <strong>{formatMaxSizeCm(quality.maxWidthM, quality.maxHeightM)}</strong>.
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (compact) {
    // Sub-block inside a parent multi-wall wrapper — no card, no step chip.
    return (
      <div className="rounded-pw border border-pw-stone bg-pw-bg/40 p-4">
        {wallLabel && (
          <p className="text-sm font-semibold text-pw-ink mb-3">{wallLabel.replace(/^\s*·\s*/, "")}</p>
        )}
        {previewBody}
      </div>
    );
  }

  return (
    <section className="rounded-pw-card border border-[rgba(26,23,20,0.08)] bg-pw-surface p-5 shadow-pw-sm sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        {stepNumber !== undefined && (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-pw-accent bg-pw-accent-soft text-sm font-semibold text-pw-accent">
            {stepNumber}
          </span>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-pw-ink">
            Place it on your wall{wallLabel ?? ""}
          </h2>
          <p className="mt-1 text-sm text-pw-muted">
            Drag the image to reframe. We'll print exactly what's inside the bordered area.
          </p>
        </div>
      </div>

      {previewBody}
    </section>
  );
}
