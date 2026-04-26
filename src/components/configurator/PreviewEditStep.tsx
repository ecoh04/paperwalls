"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { getQuality, formatMaxSizeCm } from "@/lib/quality";
import { exportContainCropJpeg } from "@/lib/imageCrop";

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
  /** 1 = whole image visible (contain). >1 zooms in for a tighter crop. */
  zoom:             number;
  onPanChange:      (x: number, y: number) => void;
  onZoomChange:     (zoom: number) => void;
  onCropDataReady?: (getBlob: () => Promise<Blob | null>) => void;
};

type Size = { w: number; h: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Smallest factor at which the whole image fits inside the frame. */
function computeContain(img: Size, frame: Size): number {
  return Math.min(frame.w / img.w, frame.h / img.h);
}

function panBounds(img: Size, frame: Size, effScale: number) {
  const dispW = img.w * effScale;
  const dispH = img.h * effScale;
  return {
    // When the image is smaller than the frame on an axis, lock pan to 0
    // (image stays centred). When larger, allow pan within cover bounds.
    maxPanX: Math.max(0, (dispW - frame.w) / 2),
    maxPanY: Math.max(0, (dispH - frame.h) / 2),
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
  zoom,
  onPanChange,
  onZoomChange,
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
  useEffect(() => {
    setImgSize(null);
  }, [imageUrl]);

  // ── ResizeObserver for the frame element ────────────────────────────────
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
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [widthM, heightM]);

  // ── Re-clamp pan when sizes or zoom change ──────────────────────────────
  useEffect(() => {
    if (!imgSize || !frameSize) return;
    const effScale = computeContain(imgSize, frameSize) * zoom;
    const { maxPanX, maxPanY } = panBounds(imgSize, frameSize, effScale);
    const cx = clamp(panX, -maxPanX, maxPanX);
    const cy = clamp(panY, -maxPanY, maxPanY);
    if (cx !== panX || cy !== panY) {
      onPanChange(cx, cy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize, frameSize, zoom]);

  // ── Crop blob ───────────────────────────────────────────────────────────
  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    const frame = frameRef.current;
    if (!frame || !imageUrl || !imgSize) return null;
    const rect = frame.getBoundingClientRect();
    return exportContainCropJpeg({
      imageUrl,
      imgWidthPx:  imgSize.w,
      imgHeightPx: imgSize.h,
      frameWidth:  rect.width,
      frameHeight: rect.height,
      panX,
      panY,
      zoom,
    });
  }, [imageUrl, imgSize, panX, panY, zoom]);

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

  // ── Drag (pan) ──────────────────────────────────────────────────────────
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

    const effScale = computeContain(imgSize, frameSize) * zoom;
    const { maxPanX, maxPanY } = panBounds(imgSize, frameSize, effScale);

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

  const handleReset = () => {
    onPanChange(0, 0);
    onZoomChange(1);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!imageUrl || widthM <= 0 || heightM <= 0) return null;

  const ready = imgSize !== null && frameSize !== null;
  const effScale = ready ? computeContain(imgSize, frameSize) * zoom : 1;
  const dispW    = ready ? imgSize.w * effScale : 0;
  const dispH    = ready ? imgSize.h * effScale : 0;

  // True if there is letterbox on either axis (image smaller than frame somewhere)
  const hasLetterbox = ready && (dispW < frameSize.w - 0.5 || dispH < frameSize.h - 0.5);

  const widthCm  = widthM  * 100;
  const heightCm = heightM * 100;

  // Quality reflects the image at current zoom — past zoom 1 the printable
  // pixel area shrinks proportionally.
  const effImgW = imgSize ? imgSize.w / Math.max(zoom, 1) : 0;
  const effImgH = imgSize ? imgSize.h / Math.max(zoom, 1) : 0;
  const quality = imgSize && widthM > 0 && heightM > 0 && zoom > 1
    ? getQuality(effImgW, effImgH, widthM, heightM)
    : null;

  const showResetLink = zoom > 1.001 || panX !== 0 || panY !== 0;

  const previewBody = (
    <>
      <div className="relative w-full">
        <div
          className="relative w-full overflow-hidden rounded-pw-card bg-pw-ink"
          style={{ paddingTop: "62%" }}
        >
          {/* Wall frame container */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] max-w-[760px]">
            <div
              className="relative w-full"
              style={{ aspectRatio: `${widthM} / ${heightM}` }}
            >
              {/* Wall surface — white background. This is the "wall" the customer sees their print on. */}
              <div
                ref={frameRef}
                className="absolute inset-0 overflow-hidden rounded-md ring-2 ring-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.4)] bg-white"
              >
                {/* Hidden loader — drives onLoad without showing the unscaled native image */}
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt=""
                  onLoad={handleImgLoad}
                  draggable={false}
                  className="invisible absolute inset-0"
                  aria-hidden
                />

                {ready && imgSize ? (
                  <div
                    className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none"
                    style={{
                      width:  dispW,
                      height: dispH,
                      transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      willChange: isDragging ? "transform" : undefined,
                    }}
                    aria-hidden
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-pw-muted">
                      <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" strokeOpacity="0.25" />
                        <path d="M21 12a9 9 0 0 1-9 9" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* 3×3 rule-of-thirds grid — guides centring without overpowering the image */}
                {ready && (
                  <div className="pointer-events-none absolute inset-0" aria-hidden>
                    <div className="absolute top-0 bottom-0 left-1/3   w-px bg-pw-ink/15" />
                    <div className="absolute top-0 bottom-0 left-2/3   w-px bg-pw-ink/15" />
                    <div className="absolute left-0 right-0 top-1/3    h-px bg-pw-ink/15" />
                    <div className="absolute left-0 right-0 top-2/3    h-px bg-pw-ink/15" />
                  </div>
                )}
              </div>

              {/* Drag overlay — captures pointer events for pan */}
              <div
                className={[
                  "absolute inset-0 rounded-md",
                  ready
                    ? (dispW > frameSize!.w + 0.5 || dispH > frameSize!.h + 0.5)
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-default"
                    : "cursor-progress",
                ].join(" ")}
                style={{ touchAction: "none" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerLeave={endDrag}
              />
            </div>

            {/* Wall dimension chip */}
            <div className="mt-3 flex items-center justify-center">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85 tracking-wide">
                {widthCm.toFixed(0)} × {heightCm.toFixed(0)} cm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onZoomChange(clamp(zoom - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          disabled={zoom <= MIN_ZOOM + 0.001}
          aria-label="Zoom out"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pw-stone bg-pw-surface text-pw-ink hover:bg-pw-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          aria-label="Zoom"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-pw-stone accent-pw-accent"
        />
        <button
          type="button"
          onClick={() => onZoomChange(clamp(zoom + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
          disabled={zoom >= MAX_ZOOM - 0.001}
          aria-label="Zoom in"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pw-stone bg-pw-surface text-pw-ink hover:bg-pw-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
        </button>
        {showResetLink && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-pw-muted hover:text-pw-ink underline underline-offset-2 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-pw-muted-light text-center">
        {hasLetterbox && zoom <= 1.001
          ? "Whole image shown — white edges will print as white. Use the slider to zoom in."
          : "Drag to reposition · Use the slider to zoom in for a tighter crop."}
      </p>

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
                ? "Image is a bit small for this crop"
                : "Sharpness is on the edge"}
            </p>
            <p className="mt-0.5 text-sm text-amber-800">
              {quality.level === "too_low"
                ? "We can't print this sharply at the current zoom. Use a higher-resolution image, zoom out a little, or reduce the wall."
                : "It'll look fine from a normal viewing distance. For sharper results, zoom out slightly or use a higher-res image."}{" "}
              Best up to: <strong>{formatMaxSizeCm(quality.maxWidthM, quality.maxHeightM)}</strong>.
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (compact) {
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
            See your whole image fitted to the wall. Slide the zoom up for a tighter crop.
          </p>
        </div>
      </div>

      {previewBody}
    </section>
  );
}
