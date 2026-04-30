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

type Size    = { w: number; h: number };
type Pointer = { id: number; x: number; y: number };

const MIN_ZOOM  = 1;
const MAX_ZOOM  = 3;
const ZOOM_STEP = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function distance(a: Pointer, b: Pointer): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
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
  const previewRef    = useRef<HTMLDivElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const rafRef        = useRef<number | null>(null);

  // Active pointers tracked by id. One pointer = pan, two pointers = pinch-zoom.
  const pointersRef    = useRef<Pointer[]>([]);
  const panStartRef    = useRef<{ panX: number; panY: number; clientX: number; clientY: number } | null>(null);
  const pinchStartRef  = useRef<{ distance: number; zoom: number } | null>(null);

  // Coalesce gesture updates: collect the latest values, flush on next frame.
  const pendingPanRef  = useRef<{ x: number; y: number } | null>(null);
  const pendingZoomRef = useRef<number | null>(null);

  const [imgSize,     setImgSize]     = useState<Size | null>(null);
  const [previewSize, setPreviewSize] = useState<Size | null>(null);

  // Reset image-bound state when the URL changes.
  useEffect(() => {
    setImgSize(null);
  }, [imageUrl]);

  // Measure the preview surface — frame and image are sized off these dims.
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
  // Standard photo-cropper model: the wall frame fills the preview (largest
  // wall-aspect rectangle inside it), and the image cover-fits the frame at
  // zoom=1 so there's never empty space inside the print area. Image may
  // extend beyond the preview surface — overflow-hidden clips it and the
  // user pans to reveal the off-screen parts.
  //
  // Why not contain-fit-to-preview? When the image and wall aspects don't
  // match (portrait image + landscape wall), the image got letter-boxed and
  // the frame could only be as big as the image — making the print frame
  // tiny instead of the image-being-cropped tiny.
  //
  // Image renders at a FIXED base size; zoom is applied via CSS transform:
  // scale() so the browser GPU-composites changes instead of repainting.
  const ready = imgSize !== null && previewSize !== null;

  const wallAspect = widthM / heightM;

  // Frame size on screen — derived from preview alone (not image), so an
  // aspect mismatch with the image doesn't shrink the print area.
  const FRAME_INSET = 14;
  const frameMaxW = ready ? Math.max(0, previewSize.w - FRAME_INSET * 2) : 0;
  const frameMaxH = ready ? Math.max(0, previewSize.h - FRAME_INSET * 2) : 0;
  const frameScreenW = ready ? Math.min(frameMaxW, frameMaxH * wallAspect) : 0;
  const frameScreenH = frameScreenW / wallAspect;

  // Image: cover-fits the frame at zoom=1 (= the smallest scale at which
  // the image fully covers the print area). Math.max picks whichever axis
  // requires the larger scale.
  const baseImageScale = ready && imgSize.w > 0 && imgSize.h > 0 && frameScreenW > 0
    ? Math.max(frameScreenW / imgSize.w, frameScreenH / imgSize.h)
    : 0;
  const baseImgW = ready ? imgSize.w * baseImageScale : 0;
  const baseImgH = ready ? imgSize.h * baseImageScale : 0;

  // Effective rendered image size after CSS scale — used for pan bounds + crop math only.
  const effImageScale = baseImageScale * zoom;
  const imgDispW      = baseImgW * zoom;
  const imgDispH      = baseImgH * zoom;

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

  // ── Gesture handling: pan (1 finger) + pinch-zoom (2 fingers) ─────────
  // Coalesce updates onto rAF so we re-render at most once per frame
  // regardless of how many pointer/range-input events fire.
  const flush = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pendingPan  = pendingPanRef.current;
      const pendingZoom = pendingZoomRef.current;
      pendingPanRef.current  = null;
      pendingZoomRef.current = null;
      if (pendingZoom !== null) onZoomChange(pendingZoom);
      if (pendingPan)           onPanChange(pendingPan.x, pendingPan.y);
    });
  }, [onPanChange, onZoomChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!ready) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    const next = pointersRef.current.filter(p => p.id !== e.pointerId);
    next.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
    pointersRef.current = next;

    if (next.length === 1) {
      panStartRef.current   = { panX, panY, clientX: e.clientX, clientY: e.clientY };
      pinchStartRef.current = null;
    } else if (next.length >= 2) {
      const [p1, p2] = next;
      pinchStartRef.current = { distance: distance(p1, p2), zoom };
      panStartRef.current   = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!ready) return;
    const idx = pointersRef.current.findIndex(p => p.id === e.pointerId);
    if (idx === -1) return;
    pointersRef.current[idx] = { id: e.pointerId, x: e.clientX, y: e.clientY };

    if (pointersRef.current.length === 1 && panStartRef.current) {
      const start = panStartRef.current;
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      pendingPanRef.current = {
        x: clamp(start.panX + dx, -maxPanX, maxPanX),
        y: clamp(start.panY + dy, -maxPanY, maxPanY),
      };
      flush();
    } else if (pointersRef.current.length >= 2 && pinchStartRef.current) {
      const [p1, p2] = pointersRef.current;
      const d = distance(p1, p2);
      const ratio = d / pinchStartRef.current.distance;
      pendingZoomRef.current = clamp(pinchStartRef.current.zoom * ratio, MIN_ZOOM, MAX_ZOOM);
      flush();
    }
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    pointersRef.current = pointersRef.current.filter(p => p.id !== e.pointerId);

    if (pointersRef.current.length === 0) {
      panStartRef.current   = null;
      pinchStartRef.current = null;
    } else if (pointersRef.current.length === 1) {
      // Coming back from a pinch with one finger still down — restart pan
      // tracking from the remaining finger's current position.
      pinchStartRef.current = null;
      const remaining = pointersRef.current[0];
      panStartRef.current = { panX, panY, clientX: remaining.x, clientY: remaining.y };
    }
  };

  // ── Slider zoom (button + range input). Same rAF coalescing path. ─────
  const setZoomThrottled = useCallback((z: number) => {
    pendingZoomRef.current = clamp(z, MIN_ZOOM, MAX_ZOOM);
    flush();
  }, [flush]);

  const handleReset = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingPanRef.current  = null;
    pendingZoomRef.current = null;
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

  // Image style is shared by the dimmed backdrop and the bright in-frame copy.
  // Fixed box dimensions; zoom applied via transform scale so the browser can
  // composite changes on the GPU instead of repainting at each new size.
  const imageStyle: React.CSSProperties = {
    width:            baseImgW,
    height:           baseImgH,
    transform:        `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
    backgroundImage:  `url(${imageUrl})`,
    backgroundSize:   "100% 100%",
    backgroundRepeat: "no-repeat",
    willChange:       "transform",
  };

  const previewBody = (
    <>
      {/* Preview surface. width:auto + -mx-6 means the box stretches by 48px
          on mobile (cancelling the FlowSection's p-6 to go edge-to-edge). On
          sm+ it stays inside the section's normal padding with rounded
          corners. aspect-[4/3] gives a stable 75%-of-width height regardless
          of wall dimensions, so typing in size doesn't reflow the page. */}
      <div
        ref={previewRef}
        className="relative overflow-hidden bg-pw-ink select-none -mx-6 sm:mx-0 sm:rounded-pw-card aspect-[4/3]"
      >
        {/* Hidden loader — onLoad captures the natural dimensions */}
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
            {/* Dimmed backdrop — what's outside the wall frame won't print */}
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                ...imageStyle,
                filter: "brightness(0.32) saturate(0.85)",
              }}
              aria-hidden
            />

            {/* Wall frame — the actual print area */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md ring-2 ring-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.45)] pointer-events-none"
              style={{ width: frameScreenW, height: frameScreenH }}
            >
              {/* Full-brightness image clipped by the frame */}
              <div
                className="absolute left-1/2 top-1/2"
                style={imageStyle}
                aria-hidden
              />

              {/* Rule-of-thirds grid */}
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

        {/* Gesture overlay — captures pointer events for pan + pinch-zoom */}
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
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />

        {/* Wall dimension chip */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <span className="rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 pw-overline text-white/85">
            {widthCm.toFixed(0)} × {heightCm.toFixed(0)} cm
          </span>
        </div>
      </div>

      {/* Zoom controls. Bigger touch targets (h-11 w-11 ≈ 44pt) so they're
          comfortable to tap on mobile. */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setZoomThrottled(zoom - ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM + 0.001}
          aria-label="Zoom out"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pw-stone bg-pw-surface text-pw-ink active:bg-pw-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          onChange={(e) => setZoomThrottled(parseFloat(e.target.value))}
          aria-label="Zoom"
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-pw-stone accent-pw-accent"
        />
        <button
          type="button"
          onClick={() => setZoomThrottled(zoom + ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM - 0.001}
          aria-label="Zoom in"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pw-stone bg-pw-surface text-pw-ink active:bg-pw-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        Drag to position · Pinch or use the slider to zoom
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
