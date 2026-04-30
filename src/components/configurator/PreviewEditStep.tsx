"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { getQuality, formatMaxSizeCm } from "@/lib/quality";
import { exportCroppedJpeg } from "@/lib/imageCrop";
import { ConfigAlert } from "./ConfigAlert";

type PreviewEditStepProps = {
  /** Optional label, e.g. "Wall 1" */
  wallLabel?:       string;
  imageUrl:         string | null;
  widthM:           number;
  heightM:          number;
  panX:             number;
  panY:             number;
  /** 1 = whole image visible. >1 = zoomed in (tighter crop). */
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

export function PreviewEditStep({
  wallLabel,
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
  const previewRef   = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const rafRef       = useRef<number | null>(null);
  const dragStartRef = useRef<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);

  const [isDragging,   setIsDragging]   = useState(false);
  const [imgSize,      setImgSize]      = useState<Size | null>(null);
  const [previewSize,  setPreviewSize]  = useState<Size | null>(null);

  // Reset image-bound state when the URL changes.
  useEffect(() => {
    setImgSize(null);
  }, [imageUrl]);

  // Measure the preview surface (image is fitted to this — frame sits on top of image).
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setPreviewSize((prev) => {
          if (prev && prev.w === rect.width && prev.h === rect.height) return prev;
          return { w: rect.width, h: rect.height };
        });
      }
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Layout math ─────────────────────────────────────────────────────────
  // Image is contain-fit inside the preview surface at zoom=1, so the customer
  // sees the WHOLE image. The wall frame (at the wall's aspect ratio) is overlaid
  // and sized to fit *inside* the image at zoom=1 — so dragging changes the
  // image position under a fixed frame, and zoom > 1 grows the image (making the
  // frame cover a smaller portion = tighter crop).
  const ready = imgSize !== null && previewSize !== null;

  const wallAspect       = widthM / heightM;
  const baseImageScale   = ready ? Math.min(previewSize.w / imgSize.w, previewSize.h / imgSize.h) : 0;
  const effImageScale    = baseImageScale * zoom;
  const imgDispW         = ready ? imgSize.w * effImageScale : 0;
  const imgDispH         = ready ? imgSize.h * effImageScale : 0;
  const baseImgW         = ready ? imgSize.w * baseImageScale : 0;
  const baseImgH         = ready ? imgSize.h * baseImageScale : 0;

  // Frame size on screen — fixed once imgSize/previewSize are known. The
  // largest wall-aspect rectangle that fits inside the image at zoom=1.
  // Trim 14 px so the user can always see the dimmed image bleed at the edges
  // (otherwise on aspect-matched images the frame would touch the image edges).
  const FRAME_INSET = 14;
  const frameScreenW = ready
    ? Math.max(0, Math.min(baseImgW, baseImgH * wallAspect) - FRAME_INSET * 2)
    : 0;
  const frameScreenH = frameScreenW / wallAspect;

  // Pan bounds: frame must always stay inside the image.
  const maxPanX = Math.max(0, (imgDispW - frameScreenW) / 2);
  const maxPanY = Math.max(0, (imgDispH - frameScreenH) / 2);

  // Re-clamp pan when sizes or zoom change.
  useEffect(() => {
    if (!ready) return;
    const cx = clamp(panX, -maxPanX, maxPanX);
    const cy = clamp(panY, -maxPanY, maxPanY);
    if (cx !== panX || cy !== panY) {
      onPanChange(cx, cy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, maxPanX, maxPanY]);

  // ── Crop blob ───────────────────────────────────────────────────────────
  const getCroppedBlob = useCallback(async (): Promise<Blob | null> => {
    if (!imageUrl || !imgSize || !ready || effImageScale <= 0) return null;

    // Source rectangle in image-natural pixels = the part of the image inside
    // the wall frame at current zoom + pan.
    const sourceW = frameScreenW / effImageScale;
    const sourceH = frameScreenH / effImageScale;
    const sourceX = imgSize.w / 2 - sourceW / 2 - panX / effImageScale;
    const sourceY = imgSize.h / 2 - sourceH / 2 - panY / effImageScale;
    const sx      = clamp(sourceX, 0, Math.max(0, imgSize.w - sourceW));
    const sy      = clamp(sourceY, 0, Math.max(0, imgSize.h - sourceH));
    const sw      = Math.min(sourceW, imgSize.w - sx);
    const sh      = Math.min(sourceH, imgSize.h - sy);

    return exportCroppedJpeg(imageUrl, { x: sx, y: sy, width: sw, height: sh });
  }, [imageUrl, imgSize, ready, effImageScale, frameScreenW, frameScreenH, panX, panY]);

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
    if (!ready) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { panX, panY, clientX: e.clientX, clientY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !ready) return;

    const start = dragStartRef.current;
    const dx = e.clientX - start.clientX;
    const dy = e.clientY - start.clientY;

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

  const widthCm  = widthM  * 100;
  const heightCm = heightM * 100;

  // Quality is based on the source pixels actually getting printed.
  const sourcePxW = ready && effImageScale > 0 ? frameScreenW / effImageScale : 0;
  const sourcePxH = ready && effImageScale > 0 ? frameScreenH / effImageScale : 0;
  const quality = ready && sourcePxW > 0 && sourcePxH > 0
    ? getQuality(sourcePxW, sourcePxH, widthM, heightM)
    : null;

  const showResetLink = zoom > 1.001 || panX !== 0 || panY !== 0;

  // Stable preview-surface aspect — must NOT depend on wall dimensions, or
  // the surface reflows on every keystroke and pushes the inputs around.
  // 75% gives mobile users more vertical crop area than the old 62% without
  // wasting space on landscape walls.
  const previewPaddingTop = "75%";

  const previewBody = (
    <>
      {/* Preview surface — breaks edge-to-edge on mobile inside the flush
          parent FlowSection (overflow-hidden on the section clips the square
          corners to the rounded card edge). On sm+ stays inside normal
          flow with rounded corners. */}
      <div
        ref={previewRef}
        className="relative w-full overflow-hidden bg-pw-ink select-none -mx-6 sm:mx-0 sm:rounded-pw-card"
        style={{ paddingTop: previewPaddingTop }}
      >
        {/* Hidden loader image — triggers onLoad to capture natural dimensions */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          onLoad={handleImgLoad}
          draggable={false}
          className="invisible absolute inset-0 h-full w-full"
          aria-hidden
        />

        {ready ? (
          <>
            {/* Dimmed full image — what's visible OUTSIDE the wall frame won't print */}
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                width:  imgDispW,
                height: imgDispH,
                transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                backgroundImage:  `url(${imageUrl})`,
                backgroundSize:   "100% 100%",
                backgroundRepeat: "no-repeat",
                filter:           "brightness(0.32) saturate(0.85)",
                willChange:       isDragging ? "transform" : undefined,
              }}
              aria-hidden
            />

            {/* Wall frame (the print area) — overlaid on top, fixed screen size */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md ring-2 ring-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] pointer-events-none"
              style={{
                width:  frameScreenW,
                height: frameScreenH,
              }}
            >
              {/* Full-brightness image inside the frame — same screen position
                  as the dimmed backdrop, just clipped by the frame's overflow */}
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width:  imgDispW,
                  height: imgDispH,
                  transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px))`,
                  backgroundImage:  `url(${imageUrl})`,
                  backgroundSize:   "100% 100%",
                  backgroundRepeat: "no-repeat",
                  willChange:       isDragging ? "transform" : undefined,
                }}
                aria-hidden
              />

              {/* 3×3 rule-of-thirds grid — inside the print frame */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute top-0 bottom-0 left-1/3   w-px bg-white/35" />
                <div className="absolute top-0 bottom-0 left-2/3   w-px bg-white/35" />
                <div className="absolute left-0 right-0 top-1/3    h-px bg-white/35" />
                <div className="absolute left-0 right-0 top-2/3    h-px bg-white/35" />
              </div>
            </div>
          </>
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

        {/* Drag overlay — captures pointer events for pan across the whole preview */}
        <div
          className={[
            "absolute inset-0",
            ready
              ? (maxPanX > 0 || maxPanY > 0)
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

        {/* Wall dimension chip — bottom of preview surface */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 pw-overline text-white/85">
            {widthCm.toFixed(0)} × {heightCm.toFixed(0)} cm
          </span>
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
            className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <p className="pw-small mt-2 text-center text-pw-muted-light">
        Drag to choose what gets printed · Slide to zoom in for a tighter crop
      </p>

      {quality && quality.level !== "good" && (
        <div className="mt-5">
          <ConfigAlert
            variant="warning"
            title={
              quality.level === "too_low"
                ? "Will look soft on a wall this big"
                : "Sharpest at slightly smaller sizes"
            }
          >
            {quality.level === "too_low"
              ? "It'll look fine from across the room but soft up close. Zoom in to crop tighter, use a higher-resolution image, or reduce the wall."
              : "Looks fine from normal viewing distance. Zoom in for a tighter crop if you want it sharper up close."}{" "}
            Crispest up to <strong className="text-pw-ink">{formatMaxSizeCm(quality.maxWidthM, quality.maxHeightM)}</strong>.
          </ConfigAlert>
        </div>
      )}
    </>
  );

  return (
    // Sits inside the parent's flush FlowSection. The preview surface itself
    // (inside previewBody) handles the mobile edge-to-edge breakout via -mx-6;
    // everything else flows in the section's normal padding.
    <div>
      {wallLabel && (
        <p className="pw-small font-semibold text-pw-ink mb-3">
          {wallLabel.replace(/^\s*·\s*/, "")}
        </p>
      )}
      {previewBody}
    </div>
  );
}
