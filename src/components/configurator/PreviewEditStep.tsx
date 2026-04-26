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

type Size = { w: number; h: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Cover-scale fit: the smallest scale factor at which the image fully covers
 * a frame of `frame` size (so there is never empty space inside the frame).
 */
function computeCover(img: Size, frame: Size): number {
  return Math.max(frame.w / img.w, frame.h / img.h);
}

/**
 * Pan range that keeps `img` fully covering `frame` on both axes.
 * Returns 0 on an axis where the image fits the frame exactly (no slack).
 */
function panBounds(img: Size, frame: Size, cover: number): { maxPanX: number; maxPanY: number } {
  return {
    maxPanX: Math.max(0, (img.w * cover - frame.w) / 2),
    maxPanY: Math.max(0, (img.h * cover - frame.h) / 2),
  };
}

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
  const rafRef   = useRef<number | null>(null);
  const dragStartRef = useRef<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [imgSize,    setImgSize]    = useState<Size | null>(null);
  const [frameSize,  setFrameSize]  = useState<Size | null>(null);

  // ── Reset image-bound state when the URL changes ────────────────────────
  // Without this, when the user picks a new image we render the new image
  // src at the *previous* image's natural dimensions until the new onLoad
  // fires — visually jumpy and gives a wrong cover scale during the gap.
  useEffect(() => {
    setImgSize(null);
  }, [imageUrl]);

  // ── ResizeObserver on the frame ─────────────────────────────────────────
  // ResizeObserver catches all container size changes (window resize, layout
  // reflow, sidebar toggling, mobile keyboard). `window.resize` only fires
  // for actual viewport changes, missing layout-driven reflows.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize((prev) => {
          if (prev && prev.w === rect.width && prev.h === rect.height) return prev;
          return { w: rect.width, h: rect.height };
        });
      }
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(frame);
      return () => ro.disconnect();
    }
    // Fallback for older browsers
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [widthM, heightM]);

  // ── Re-clamp pan when sizes change ──────────────────────────────────────
  // When the user changes wall dimensions or the layout reflows, the pan
  // range can shrink. Without this, the image can drift outside the cover
  // bounds (showing empty space inside the frame).
  useEffect(() => {
    if (!imgSize || !frameSize) return;
    const cover = computeCover(imgSize, frameSize);
    const { maxPanX, maxPanY } = panBounds(imgSize, frameSize, cover);
    const cx = clamp(panX, -maxPanX, maxPanX);
    const cy = clamp(panY, -maxPanY, maxPanY);
    if (cx !== panX || cy !== panY) {
      onPanChange(cx, cy);
    }
    // Intentionally only re-runs when sizes change. Including panX/panY/onPanChange
    // would create a feedback loop with the parent's state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize, frameSize]);

  // ── Crop blob (exact pixels visible in frame, exported as JPEG) ─────────
  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    const frame = frameRef.current;
    const img   = imgRef.current;
    if (!frame || !img || !img.naturalWidth || !img.naturalHeight || !imgSize) return null;

    const rect    = frame.getBoundingClientRect();
    const frameW  = rect.width;
    const frameH  = rect.height;
    const natW    = img.naturalWidth;
    const natH    = img.naturalHeight;
    const cover   = Math.max(frameW / natW, frameH / natH);

    // Map the visible-frame rectangle from display space back into source pixels.
    const sourceW = frameW / cover;
    const sourceH = frameH / cover;
    const sourceX = natW / 2 - sourceW / 2 - panX / cover;
    const sourceY = natH / 2 - sourceH / 2 - panY / cover;
    const sx      = clamp(sourceX, 0, Math.max(0, natW - sourceW));
    const sy      = clamp(sourceY, 0, Math.max(0, natH - sourceH));
    const sw      = Math.min(sourceW, natW - sx);
    const sh      = Math.min(sourceH, natH - sy);

    // Cap longest edge at 4000 px so the cart's localStorage blob stays manageable
    // (4000 px covers a 4.8 m wall at the 0.83 px/mm sharpness threshold).
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

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w > 0 && h > 0) setImgSize({ w, h });
  };

  // ── Drag handling ───────────────────────────────────────────────────────
  // We compute pan into a ref each frame and commit via requestAnimationFrame
  // so rapid pointer events don't trigger 60+ React renders per second.
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!imgSize || !frameSize) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { panX, panY, clientX: e.clientX, clientY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !imgSize || !frameSize) return;

    const start = dragStartRef.current;
    const dx = e.clientX - start.clientX;
    const dy = e.clientY - start.clientY;

    const cover = computeCover(imgSize, frameSize);
    const { maxPanX, maxPanY } = panBounds(imgSize, frameSize, cover);

    const nextX = clamp(start.panX + dx, -maxPanX, maxPanX);
    const nextY = clamp(start.panY + dy, -maxPanY, maxPanY);

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onPanChange(nextX, nextY);
    });
  };

  const endDrag = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!imageUrl || widthM <= 0 || heightM <= 0) return null;

  // Both sizes must be known before we render the positioned image; until
  // then we show a soft placeholder with the same aspect ratio as the wall.
  const ready = imgSize !== null && frameSize !== null;

  const cover = ready ? computeCover(imgSize, frameSize) : 1;

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
            {ready && imgSize && (
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
                    willChange: isDragging ? "transform" : undefined,
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
                  {/*
                    Hidden loader image: drives onLoad without ever being visible
                    at the wrong size. The visible image only renders once both
                    image natural size AND frame size are known.
                  */}
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Your design"
                    onLoad={handleImgLoad}
                    draggable={false}
                    className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
                    style={{ visibility: ready ? "hidden" : "hidden" }}
                  />

                  {ready && imgSize ? (
                    <div
                      className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none"
                      style={{
                        width:  imgSize.w * cover,
                        height: imgSize.h * cover,
                        transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                        willChange: isDragging ? "transform" : undefined,
                      }}
                      aria-hidden
                    />
                  ) : (
                    /* Loading skeleton shown until image + frame both measured */
                    <div className="absolute inset-0 flex items-center justify-center bg-pw-stone/50">
                      <div className="flex flex-col items-center gap-2 text-pw-muted">
                        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth="2" strokeOpacity="0.25" />
                          <path d="M21 12a9 9 0 0 1-9 9" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span className="text-xs">Loading preview…</span>
                      </div>
                    </div>
                  )}
                </div>

                {/*
                  Drag overlay — touch-action: none stops the OS from
                  scrolling/zooming on touchstart so pointermove fires cleanly.
                  Pointer events on this element capture the drag.
                */}
                <div
                  className={[
                    "absolute inset-0 rounded-md",
                    ready ? "cursor-grab active:cursor-grabbing" : "cursor-progress",
                  ].join(" ")}
                  style={{ touchAction: "none" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onPointerLeave={endDrag}
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
