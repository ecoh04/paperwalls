"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  calculateSubtotalCents,
  calculateInstallationCents,
  formatZar,
  getPricePerSqmCents,
} from "@/lib/pricing";
import { MIN_PX_PER_MM, getQuality } from "@/lib/quality";
import { DEFAULT_CONFIG, type ConfiguratorState, type WallSpec } from "@/types/configurator";
import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";
import type { CartItemQuality } from "@/types/cart";
import { PreviewEditStep } from "./PreviewEditStep";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { ConfigAlert } from "./ConfigAlert";
import { track } from "@/lib/analytics";

const MAX_SIZE_MB = 50;
const ACCEPT      = "image/jpeg,image/png,image/webp";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Snapshot the resolution verdict the buyer is accepting, so it persists onto
// the order for the print team (and as a dispute/CPA defence).
const QUALITY_RANK = { too_low: 0, borderline: 1, good: 2 } as const;
function cartQuality(
  widthPx: number | null, heightPx: number | null, wallW: number, wallH: number,
): CartItemQuality | null {
  if (!widthPx || !heightPx || wallW <= 0 || wallH <= 0) return null;
  const q = getQuality(widthPx, heightPx, wallW, wallH);
  return { level: q.level, pxPerMm: q.pxPerMm, widthPx, heightPx };
}
function worstQuality(items: (CartItemQuality | null)[]): CartItemQuality | null {
  const valid = items.filter((x): x is CartItemQuality => !!x);
  if (!valid.length) return null;
  return valid.reduce((worst, cur) =>
    QUALITY_RANK[cur.level] < QUALITY_RANK[worst.level] ||
    (cur.level === worst.level && cur.pxPerMm < worst.pxPerMm) ? cur : worst
  );
}

function loadImageDimensions(url: string): Promise<{ widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ widthPx: img.naturalWidth || img.width, heightPx: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

const FLOW_INPUT_CLASSES =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10";

/* ──────────────────────────────────────────────────────────────────────── */

export function Configurator() {
  const { addItem } = useCart();

  // Single-mode crop blob; per-wall blobs for multi-different mode.
  const getCroppedBlobRef  = useRef<(() => Promise<Blob | null>) | null>(null);
  const getCroppedBlobRefs = useRef<((() => Promise<Blob | null>) | null)[]>([]);

  const [state, setState]             = useState<ConfiguratorState>(DEFAULT_CONFIG);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [moreWalls,   setMoreWalls]   = useState(false);

  // Funnel: configurator entered.
  useEffect(() => {
    track("config.viewed");
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────
  const isMultiDifferent =
    state.wallCount > 1 &&
    state.multiWallMode === "different" &&
    state.walls.length === state.wallCount;

  const totalSqm = isMultiDifferent
    ? state.walls.reduce((sum, w) => sum + w.widthM * w.heightM, 0)
    : state.widthM * state.heightM * Math.max(1, state.wallCount);

  const subtotalCents = useMemo(
    () => calculateSubtotalCents(totalSqm, state.wallpaperType, state.material, state.application),
    [totalSqm, state.wallpaperType, state.material, state.application]
  );

  const resolutionHint = useMemo(() => {
    if (state.widthM <= 0 || state.heightM <= 0) return undefined;
    const minW = Math.ceil(state.widthM  * 1000 * MIN_PX_PER_MM);
    const minH = Math.ceil(state.heightM * 1000 * MIN_PX_PER_MM);
    return `For ${Math.round(state.widthM * 100)} × ${Math.round(state.heightM * 100)} cm, use at least ${minW} × ${minH} px for the sharpest print.`;
  }, [state.widthM, state.heightM]);

  // ── Wall-count and multi-mode handlers ─────────────────────────────────
  const ensureWallsLength = useCallback((n: number, currentWalls: WallSpec[], currentW: number, currentH: number): WallSpec[] => {
    return Array.from({ length: n }, (_, i) =>
      currentWalls[i] ?? { widthM: currentW, heightM: currentH }
    );
  }, []);

  const handleWallCountChange = useCallback((n: number) => {
    setState((s) => ({
      ...s,
      wallCount: n,
      ...(n === 1 ? { multiWallMode: "same" as const, walls: [] } : {}),
      ...(n > 1 && s.multiWallMode === "different"
        ? { walls: ensureWallsLength(n, s.walls, s.widthM, s.heightM) }
        : {}),
    }));
  }, [ensureWallsLength]);

  const handleMultiWallMode = useCallback((mode: "same" | "different") => {
    setState((s) => ({
      ...s,
      multiWallMode: mode,
      ...(mode === "different"
        ? { walls: ensureWallsLength(s.wallCount, s.walls, s.widthM, s.heightM) }
        : { walls: [] }),
    }));
  }, [ensureWallsLength]);

  // ── Single-image upload ────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (file: File | null) => {
      setUploadError(null);
      if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
      if (!file) {
        setState((s) => ({
          ...s,
          imageFile: null,
          imagePreviewUrl: null,
          imageWidthPx: null,
          imageHeightPx: null,
          panX: 0, panY: 0, zoom: 1,
        }));
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`File must be under ${MAX_SIZE_MB} MB.`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      loadImageDimensions(objectUrl)
        .then(({ widthPx, heightPx }) => {
          setState((s) => ({
            ...s,
            imageFile:       file,
            imagePreviewUrl: objectUrl,
            imageWidthPx:    widthPx,
            imageHeightPx:   heightPx,
            panX: 0, panY: 0, zoom: 1,
          }));
        })
        .catch(() => {
          URL.revokeObjectURL(objectUrl);
          setUploadError("Could not read this image. Try a different file (JPG, PNG, or WebP).");
        });
    },
    [state.imagePreviewUrl]
  );

  // ── Per-wall image upload (multi-different mode) ───────────────────────
  const handleWallFileSelect = useCallback((wallIndex: number, file: File | null) => {
    setState((s) => {
      const next = [...s.walls];
      const prev = next[wallIndex];
      if (prev?.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl);
      if (!next[wallIndex]) next[wallIndex] = { widthM: 0, heightM: 0 };
      next[wallIndex] = {
        ...next[wallIndex],
        imageFile:       file ?? null,
        imagePreviewUrl: file ? URL.createObjectURL(file) : null,
        imageWidthPx:    null,
        imageHeightPx:   null,
        panX: 0, panY: 0, zoom: 1,
      };
      return { ...s, walls: next };
    });

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      loadImageDimensions(objectUrl)
        .then(({ widthPx, heightPx }) => {
          setState((s) => {
            const next = [...s.walls];
            if (!next[wallIndex]) return s;
            next[wallIndex] = { ...next[wallIndex], imageWidthPx: widthPx, imageHeightPx: heightPx };
            return { ...s, walls: next };
          });
        })
        .catch(() => {})
        .finally(() => URL.revokeObjectURL(objectUrl));
    }
  }, []);

  // ── Per-wall dimension setter ──────────────────────────────────────────
  const setWallSize = useCallback((wallIndex: number, field: "widthM" | "heightM", cm: number) => {
    setState((s) => {
      const next = [...s.walls];
      if (!next[wallIndex]) next[wallIndex] = { widthM: 0, heightM: 0 };
      next[wallIndex] = { ...next[wallIndex], [field]: cm / 100 };
      return { ...s, walls: next };
    });
  }, []);

  // ── Pan + zoom ─────────────────────────────────────────────────────────
  const setPan      = useCallback((x: number, y: number) => setState((s) => ({ ...s, panX: x, panY: y })), []);
  const setZoom     = useCallback((z: number)             => setState((s) => ({ ...s, zoom: z })),         []);
  const setWallPan  = useCallback((wallIndex: number, x: number, y: number) => {
    setState((s) => {
      const next = [...s.walls];
      if (!next[wallIndex]) return s;
      next[wallIndex] = { ...next[wallIndex], panX: x, panY: y };
      return { ...s, walls: next };
    });
  }, []);
  const setWallZoom = useCallback((wallIndex: number, z: number) => {
    setState((s) => {
      const next = [...s.walls];
      if (!next[wallIndex]) return s;
      next[wallIndex] = { ...next[wallIndex], zoom: z };
      return { ...s, walls: next };
    });
  }, []);

  // ── Crop blob registration ─────────────────────────────────────────────
  const setCropReady     = useCallback((getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRef.current = getBlob;
  }, []);
  const setCropReadyWall = useCallback((wallIndex: number, getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRefs.current[wallIndex] = getBlob;
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
      state.walls.forEach((w) => { if (w.imagePreviewUrl) URL.revokeObjectURL(w.imagePreviewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────
  const dimensionsValid = isMultiDifferent
    ? state.walls.every((w) => w.widthM > 0 && w.heightM > 0)
    : state.widthM > 0 && state.heightM > 0;

  const imageUploaded = isMultiDifferent
    ? state.walls.every((w) => w.imagePreviewUrl)
    : !!state.imagePreviewUrl;

  // Quality only WARNS. We never block add-to-cart on resolution — buyer
  // decides, reprint guarantee covers genuine defects, and cold traffic
  // uploads phone photos that look fine on a feature wall.
  const canAddToCart = dimensionsValid && imageUploaded;

  const blockedReason = useMemo(() => {
    if (canAddToCart) return null;
    if (!dimensionsValid) return "Enter your wall size to continue.";
    if (!imageUploaded)   return "Add your image to continue.";
    return "Finish setting up to continue.";
  }, [canAddToCart, dimensionsValid, imageUploaded]);

  // ── Add to cart ────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    setSubmitError(null);
    if (!canAddToCart || submitting) return;
    setSubmitting(true);

    try {
      if (isMultiDifferent) {
        getCroppedBlobRefs.current = getCroppedBlobRefs.current.slice(0, state.walls.length);
        const blobs = await Promise.all(
          getCroppedBlobRefs.current.map((getBlob) => (getBlob ? getBlob() : Promise.resolve(null)))
        );
        if (blobs.some((b) => !b)) {
          setSubmitError("Couldn't generate one of the print files. Reposition the image and try again.");
          return;
        }
        const imageDataUrls = await Promise.all(blobs.map((b) => blobToDataUrl(b!)));
        const imageQuality = worstQuality(
          state.walls.map((w) => cartQuality(w.imageWidthPx ?? null, w.imageHeightPx ?? null, w.widthM, w.heightM)),
        );
        addItem({
          type:          "wallpaper",
          widthM:        state.walls[0].widthM,
          heightM:       state.walls[0].heightM,
          wallCount:     state.wallCount,
          walls:         state.walls.map((w) => ({ widthM: w.widthM, heightM: w.heightM })),
          totalSqm,
          wallpaperType: state.wallpaperType,
          material:      state.material,
          application:   state.application,
          subtotalCents,
          imageDataUrls,
          imageQuality,
        });
      } else {
        if (!state.imagePreviewUrl) return;
        const getBlob = getCroppedBlobRef.current;
        let imageDataUrl: string;
        if (getBlob) {
          const blob = await getBlob();
          if (!blob) {
            setSubmitError("Couldn't generate the print file. Reposition the image and try again.");
            return;
          }
          imageDataUrl = await blobToDataUrl(blob);
        } else {
          imageDataUrl = state.imagePreviewUrl;
        }
        addItem({
          type:          "wallpaper",
          widthM:        state.widthM,
          heightM:       state.heightM,
          wallCount:     state.wallCount,
          totalSqm,
          wallpaperType: state.wallpaperType,
          material:      state.material,
          application:   state.application,
          subtotalCents,
          imageDataUrl,
          imageQuality:  cartQuality(state.imageWidthPx ?? null, state.imageHeightPx ?? null, state.widthM, state.heightM),
        });
      }
      // Cart drawer auto-opens via CartContext.addItem so the buyer sees
      // their new item without losing their place on the configurator.
      track("config.added_to_cart", {
        wall_count:    state.wallCount,
        total_sqm:     totalSqm,
        material:      state.material,
        application:   state.application,
        subtotal_cents: subtotalCents,
      });
    } catch (err) {
      console.error("Add-to-cart failed:", err);
      setSubmitError("Something went wrong while preparing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canAddToCart, submitting, state, totalSqm, subtotalCents, isMultiDifferent, addItem]);

  // First-available image for the desktop summary thumbnail.
  const summaryImageUrl = isMultiDifferent
    ? (state.walls[0]?.imagePreviewUrl ?? null)
    : state.imagePreviewUrl;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="pb-12 lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start lg:pb-10">
      <div className="space-y-5 sm:space-y-6">

        {/* 1 — Image */}
        <FlowSection
          title={
            isMultiDifferent
              ? `Your designs (${state.wallCount})`
              : (state.imagePreviewUrl ? "Your image" : "Add your image")
          }
          subtitle={
            isMultiDifferent
              ? "Upload one image per wall. We'll print and cut each to its size."
              : (state.imagePreviewUrl
                  ? "Looks great. Add your wall size next and we'll show you how it sits on the wall."
                  : "Any photo, artwork or pattern. We'll print it to fit your wall.")
          }
        >
          {!isMultiDifferent ? (
            <UploadCard
              imagePreviewUrl={state.imagePreviewUrl}
              imageWidthPx={state.imageWidthPx ?? null}
              imageHeightPx={state.imageHeightPx ?? null}
              uploadError={uploadError}
              hint={resolutionHint}
              onFileSelect={handleFileSelect}
            />
          ) : (
            <div className="space-y-4">
              {state.walls.map((wall, i) => (
                <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4 sm:p-5">
                  <p className="pw-small font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
                  <UploadCard
                    imagePreviewUrl={wall.imagePreviewUrl ?? null}
                    imageWidthPx={wall.imageWidthPx ?? null}
                    imageHeightPx={wall.imageHeightPx ?? null}
                    uploadError={null}
                    onFileSelect={(file) => handleWallFileSelect(i, file)}
                  />
                </div>
              ))}
            </div>
          )}

        </FlowSection>

        {/* 2 — Wall size */}
        <FlowSection
          title="Your wall size"
          subtitle="Measure floor to ceiling, edge to edge, in centimetres. Add a few cm of bleed each side for a clean trim."
        >
          <DimensionsBlock
            state={state}
            setState={setState}
            moreWalls={moreWalls}
            setMoreWalls={setMoreWalls}
            onWallCountChange={handleWallCountChange}
            onMultiWallModeChange={handleMultiWallMode}
            onWallSize={setWallSize}
          />
        </FlowSection>

        {/* 3 — How it'll look (preview + crop). Renders only after image and
             dimensions are both set, so it appears exactly where the buyer is
             looking — right after they finish typing their wall size. */}
        {!isMultiDifferent && state.imagePreviewUrl && dimensionsValid && (
          <FlowSection
            title="How it'll look on your wall"
            subtitle="Drag to choose what gets printed. Pinch or use the slider to zoom in for a tighter crop."
            flush
          >
            <PreviewEditStep
              imageUrl={state.imagePreviewUrl}
              widthM={state.widthM}
              heightM={state.heightM}
              panX={state.panX}
              panY={state.panY}
              zoom={state.zoom}
              onPanChange={setPan}
              onZoomChange={setZoom}
              onCropDataReady={setCropReady}
            />
          </FlowSection>
        )}

        {isMultiDifferent && state.walls.some((w) => w.imagePreviewUrl && w.widthM > 0 && w.heightM > 0) && (
          <FlowSection
            title="How it'll look on your walls"
            subtitle="Drag each one to position the image. Each wall gets its own crop."
            flush
          >
            <div className="space-y-6">
              {state.walls.map((wall, i) => {
                const hasContent = !!wall.imagePreviewUrl && wall.widthM > 0 && wall.heightM > 0;
                if (!hasContent) return null;
                return (
                  <PreviewEditStep
                    key={i}
                    wallLabel={`Wall ${i + 1}`}
                    imageUrl={wall.imagePreviewUrl ?? null}
                    widthM={wall.widthM}
                    heightM={wall.heightM}
                    panX={wall.panX ?? 0}
                    panY={wall.panY ?? 0}
                    zoom={wall.zoom ?? 1}
                    onPanChange={(x, y) => setWallPan(i, x, y)}
                    onZoomChange={(z)    => setWallZoom(i, z)}
                    onCropDataReady={(getBlob) => setCropReadyWall(i, getBlob)}
                  />
                );
              })}
            </div>
          </FlowSection>
        )}

        {/* 4 — Material & finish */}
        <FlowSection
          title="Material & finish"
          subtitle="How it sticks, how it feels. Price updates live."
        >
          <MaterialBlock state={state} setState={setState} totalSqm={totalSqm} />
        </FlowSection>

        {/* 4 — Installation (DIY default + optional kit, or pro toggle) */}
        <InstallSection
          state={state}
          setState={setState}
          totalSqm={totalSqm}
        />

        {/* Sample nudge for hesitant cold traffic — disappears when ready */}
        {!canAddToCart && !submitting && <SampleNudge />}

        {submitError && (
          <ConfigAlert variant="error" title="Something went wrong">{submitError}</ConfigAlert>
        )}
      </div>

      {/* Desktop sticky right-column summary */}
      <div className="mt-5 sm:mt-6 lg:mt-0">
        <OrderSummaryPanel
          imagePreviewUrl={summaryImageUrl}
          widthM={state.widthM}
          heightM={state.heightM}
          wallCount={state.wallCount}
          walls={isMultiDifferent ? state.walls.map((w) => ({ widthM: w.widthM, heightM: w.heightM })) : undefined}
          isMultiDifferent={isMultiDifferent}
          totalSqm={totalSqm}
          wallpaperType={state.wallpaperType}
          material={state.material}
          application={state.application}
          canAddToCart={canAddToCart && !submitting}
          blockedReason={submitting ? "Preparing your print files…" : blockedReason}
          onAddToCart={handleAddToCart}
        />
      </div>

    </div>
  );
}

/* ── FlowSection ──────────────────────────────────────────────────────── */
function FlowSection({
  title, subtitle, children, flush,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** When the section contains content that breaks out edge-to-edge (-mx-6),
   * set this to clip the breakout to the section's rounded interior. */
  flush?: boolean;
}) {
  return (
    <section
      className={[
        "rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8",
        flush ? "overflow-hidden" : "",
      ].filter(Boolean).join(" ")}
    >
      <header className="mb-5 sm:mb-6">
        <h2 className="pw-h3 text-pw-ink">{title}</h2>
        {subtitle && (
          <p className="pw-small mt-1.5 text-pw-muted">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

/* ── UploadCard ───────────────────────────────────────────────────────── */
function UploadCard({
  imagePreviewUrl, imageWidthPx, imageHeightPx, uploadError, hint, onFileSelect,
}: {
  imagePreviewUrl: string | null;
  imageWidthPx:    number | null;
  imageHeightPx:   number | null;
  uploadError:     string | null;
  hint?:           string;
  onFileSelect:    (file: File | null) => void;
}) {
  const [drag, setDrag] = useState(false);

  if (!imagePreviewUrl) {
    return (
      <div className="space-y-3">
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFileSelect(f); }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-pw-card border-2 border-dashed px-5 py-7 transition-colors touch-manipulation sm:py-9",
            drag ? "border-pw-ink bg-pw-accent-soft/60" : "border-pw-stone hover:border-pw-ink/40 hover:bg-pw-bg",
          ].join(" ")}
        >
          <input
            type="file"
            accept={ACCEPT}
            onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <span className="flex h-11 w-11 items-center justify-center rounded-pw border border-pw-stone bg-pw-surface">
            <svg className="h-6 w-6 text-pw-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
          </span>
          <div className="text-center">
            <p className="pw-body font-medium text-pw-ink">
              {drag ? "Drop it here" : "Drag & drop, or tap to browse"}
            </p>
            <p className="pw-small mt-1 text-pw-muted">
              JPG, PNG or WebP, up to 50 MB.
            </p>
          </div>
          {hint && (
            <p className="pw-small mx-auto max-w-sm text-center text-pw-muted-light">{hint}</p>
          )}
        </label>
        {uploadError && (
          <ConfigAlert variant="error" title="Image issue">{uploadError}</ConfigAlert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4 rounded-pw-card border border-pw-stone bg-pw-bg p-4">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-stone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreviewUrl} alt="Your image" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="pw-small font-semibold text-pw-ink">Image ready</p>
            {imageWidthPx && imageHeightPx && (
              <span className="pw-overline text-pw-muted-light">
                {imageWidthPx} × {imageHeightPx} px
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="mt-2 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
          >
            Replace image
          </button>
        </div>
      </div>
      {uploadError && (
        <ConfigAlert variant="error" title="Image issue">{uploadError}</ConfigAlert>
      )}
    </div>
  );
}

/* ── DimensionsBlock ──────────────────────────────────────────────────── */
function DimensionsBlock({
  state, setState, moreWalls, setMoreWalls,
  onWallCountChange, onMultiWallModeChange, onWallSize,
}: {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  moreWalls: boolean;
  setMoreWalls: React.Dispatch<React.SetStateAction<boolean>>;
  onWallCountChange: (n: number) => void;
  onMultiWallModeChange: (m: "same" | "different") => void;
  onWallSize: (i: number, field: "widthM" | "heightM", cm: number) => void;
}) {
  const widthCm  = state.widthM  > 0 ? Math.round(state.widthM  * 100) : 0;
  const heightCm = state.heightM > 0 ? Math.round(state.heightM * 100) : 0;
  const isMulti        = state.wallCount > 1;
  const usingDifferent = isMulti && state.multiWallMode === "different";

  const totalSame = state.widthM * state.heightM * Math.max(1, state.wallCount);
  const totalDiff = state.walls.reduce((s, w) => s + w.widthM * w.heightM, 0);
  const totalSqm  = usingDifferent ? totalDiff : totalSame;

  return (
    <div>
      {/* Single / "same" mode width + height */}
      {(!isMulti || state.multiWallMode === "same") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="v2-w" className="pw-overline mb-2 block text-pw-muted">Width (cm)</label>
            <input
              id="v2-w"
              type="number" min={10} max={2000} step={1}
              value={widthCm > 0 ? widthCm : ""}
              placeholder="300"
              onChange={(e) => {
                const cm = Math.max(0, Math.floor(parseFloat(e.target.value) || 0));
                setState((s) => ({ ...s, widthM: cm / 100, panX: 0, panY: 0, zoom: 1 }));
              }}
              className={FLOW_INPUT_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="v2-h" className="pw-overline mb-2 block text-pw-muted">Height (cm)</label>
            <input
              id="v2-h"
              type="number" min={10} max={2000} step={1}
              value={heightCm > 0 ? heightCm : ""}
              placeholder="270"
              onChange={(e) => {
                const cm = Math.max(0, Math.floor(parseFloat(e.target.value) || 0));
                setState((s) => ({ ...s, heightM: cm / 100, panX: 0, panY: 0, zoom: 1 }));
              }}
              className={FLOW_INPUT_CLASSES}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {totalSqm > 0 && (
          <p className="pw-small text-pw-muted">{totalSqm.toFixed(1)} m² total</p>
        )}
        {!moreWalls && !isMulti && (
          <button
            type="button"
            onClick={() => setMoreWalls(true)}
            className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
          >
            More than one wall?
          </button>
        )}
      </div>

      {(moreWalls || isMulti) && (
        <div className="mt-5 space-y-5 border-t border-pw-stone pt-5">
          {/* Wall count */}
          <div>
            <p className="pw-overline text-pw-ink mb-3">How many walls?</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((n) => {
                const active = state.wallCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onWallCountChange(n)}
                    aria-pressed={active}
                    className={[
                      "rounded-pw border px-5 py-2.5 pw-small font-medium transition-colors touch-manipulation",
                      active
                        ? "border-pw-ink bg-pw-surface text-pw-ink ring-1 ring-pw-ink/15"
                        : "border-pw-stone bg-pw-bg text-pw-muted hover:border-pw-ink/40 hover:text-pw-ink",
                    ].join(" ")}
                  >
                    {n} wall{n > 1 ? "s" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Same / different mode */}
          {isMulti && (
            <div>
              <p className="pw-overline text-pw-ink mb-1">Same image and size on every wall?</p>
              <p className="pw-small text-pw-muted mb-3">
                Same: one image, repeated at the size you set above. Different: each wall on its own.
              </p>
              <div className="flex flex-wrap gap-2">
                {(["same", "different"] as const).map((mode) => {
                  const active = state.multiWallMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onMultiWallModeChange(mode)}
                      aria-pressed={active}
                      className={[
                        "rounded-pw border px-5 py-2.5 pw-small font-medium transition-colors touch-manipulation",
                        active
                          ? "border-pw-ink bg-pw-surface text-pw-ink ring-1 ring-pw-ink/15"
                          : "border-pw-stone bg-pw-bg text-pw-muted hover:border-pw-ink/40 hover:text-pw-ink",
                      ].join(" ")}
                    >
                      {mode === "same" ? "Same on all" : "Different per wall"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-wall dimension inputs */}
          {usingDifferent && (
            <div className="space-y-4">
              {Array.from({ length: state.wallCount }, (_, i) => {
                const w   = state.walls[i] ?? { widthM: 0, heightM: 0 };
                const cmW = Math.round(w.widthM  * 100);
                const cmH = Math.round(w.heightM * 100);
                return (
                  <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4 sm:p-5">
                    <p className="pw-small font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="pw-overline mb-2 block text-pw-muted">Width (cm)</label>
                        <input
                          type="number" min={10} max={2000} step={1}
                          value={cmW > 0 ? cmW : ""}
                          placeholder="300"
                          onChange={(e) => onWallSize(i, "widthM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                          className={FLOW_INPUT_CLASSES}
                        />
                      </div>
                      <div>
                        <label className="pw-overline mb-2 block text-pw-muted">Height (cm)</label>
                        <input
                          type="number" min={10} max={2000} step={1}
                          value={cmH > 0 ? cmH : ""}
                          placeholder="270"
                          onChange={(e) => onWallSize(i, "heightM", Math.max(0, Math.floor(parseFloat(e.target.value) || 0)))}
                          className={FLOW_INPUT_CLASSES}
                        />
                      </div>
                    </div>
                    {w.widthM > 0 && w.heightM > 0 && (
                      <p className="pw-small mt-2 font-medium text-pw-muted">
                        {(w.widthM * w.heightM).toFixed(1)} m²
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── MaterialBlock ────────────────────────────────────────────────────── */
function MaterialBlock({
  state, setState, totalSqm,
}: {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  totalSqm: number;
}) {
  const TYPES: { id: WallpaperType; label: string; sub: string }[] = [
    { id: "traditional",     label: "Traditional",  sub: "Paste-the-wall" },
    { id: "peel_and_stick",  label: "Peel & Stick", sub: "Renter-friendly" },
  ];

  const MATERIALS: {
    id: WallpaperMaterial;
    label: string;
    description: string;
    image: string;
    badge?: string;
  }[] = [
    {
      id: "satin", label: "Satin",
      description: "Subtle sheen. Easy to clean.",
      image: "/images/product/pdp-07-satin.jpg",
    },
    {
      id: "matte", label: "Matte",
      description: "Flat, non-reflective. Great in bright rooms.",
      image: "/images/product/pdp-08-matte.jpg",
      badge: "Most ordered",
    },
    {
      id: "linen", label: "Linen",
      description: "Textured fabric feel. Adds depth.",
      image: "/images/product/pdp-09-linen.jpg",
      badge: "Most premium",
    },
  ];

  return (
    <div>
      <p className="pw-overline text-pw-ink mb-3">Application</p>
      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t) => {
          const active = state.wallpaperType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setState((s) => ({ ...s, wallpaperType: t.id }))}
              aria-pressed={active}
              className={[
                "rounded-pw border p-4 text-left transition-colors touch-manipulation",
                active ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink/15" : "border-pw-stone bg-pw-bg hover:border-pw-ink/40",
              ].join(" ")}
            >
              <span className="pw-small block font-semibold text-pw-ink">{t.label}</span>
              <span className="pw-small block text-pw-muted">{t.sub}</span>
            </button>
          );
        })}
      </div>

      <p className="pw-overline text-pw-ink mt-6 mb-3">Finish</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {MATERIALS.map((m) => {
          const active   = state.material === m.id;
          const perSqm   = getPricePerSqmCents(state.wallpaperType, m.id);
          const subtotal = totalSqm * perSqm;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setState((s) => ({ ...s, material: m.id }))}
              aria-pressed={active}
              className={[
                "flex flex-col overflow-hidden rounded-pw-card border text-left transition-colors touch-manipulation",
                active ? "border-pw-ink ring-1 ring-pw-ink/15" : "border-pw-stone hover:border-pw-ink/40",
              ].join(" ")}
            >
              <div className="relative h-24 w-full overflow-hidden bg-pw-stone sm:h-28">
                <NextImage
                  src={m.image}
                  alt={`${m.label} finish texture`}
                  fill
                  sizes="(min-width: 640px) 30vw, 100vw"
                  className="object-cover"
                />
                {m.badge && (
                  <span className="absolute right-2 top-2 pw-overline rounded-full bg-pw-accent px-2 py-0.5 text-white">
                    {m.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="pw-body font-semibold text-pw-ink">{m.label}</span>
                <p className="pw-small mt-1 text-pw-muted">{m.description}</p>
                <div className="mt-auto pt-3">
                  {totalSqm > 0 ? (
                    <>
                      <p className="pw-overline text-pw-muted-light">{formatZar(perSqm)}/m²</p>
                      <p className="pw-h3 text-pw-ink">{formatZar(Math.round(subtotal))}</p>
                    </>
                  ) : (
                    <p className="pw-h3 text-pw-ink">
                      {formatZar(perSqm)}
                      <span className="pw-small font-normal text-pw-muted-light">/m²</span>
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── InstallSection — binary DIY vs Pro choice ──────────────────────── */
function InstallSection({
  state, setState, totalSqm,
}: {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  totalSqm: number;
}) {
  const proCost = calculateInstallationCents("pro_installer", totalSqm);

  const OPTIONS: {
    id:   ApplicationMethod;
    label:string;
    sub:  string;
    body: string;
    price: string;
    priceSub?: string;
  }[] = [
    {
      id:    "diy",
      label: "Hang it yourself",
      sub:   "DIY",
      body:  "Step-by-step printed install guide ships with every roll.",
      price: "Free",
    },
    {
      id:    "pro_installer",
      label: "Send a pro installer",
      sub:   "We come to you",
      body:  "Certified installer to your address. All materials included.",
      price: totalSqm > 0 ? `+${formatZar(proCost)}` : "Quote on size",
      priceSub: totalSqm > 0 ? `for ${totalSqm.toFixed(1)} m²` : undefined,
    },
  ];

  // diy_kit was a previous option that's no longer offered. Coerce it to diy
  // so the binary choice always renders cleanly.
  const active: ApplicationMethod =
    state.application === "pro_installer" ? "pro_installer" : "diy";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
      {OPTIONS.map((opt) => {
        const isActive = opt.id === active;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setState((s) => ({ ...s, application: opt.id }))}
            aria-pressed={isActive}
            className={[
              "flex w-full items-start gap-3 rounded-pw-card border p-4 text-left transition-colors touch-manipulation",
              isActive
                ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink/15"
                : "border-pw-stone bg-pw-bg hover:border-pw-ink/40 hover:bg-pw-surface",
            ].join(" ")}
          >
            <span
              aria-hidden
              className={[
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isActive ? "border-pw-ink bg-pw-ink" : "border-pw-stone-dark",
              ].join(" ")}
            >
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="pw-small font-semibold text-pw-ink">{opt.label}</p>
                <p className="pw-small whitespace-nowrap font-semibold text-pw-ink">{opt.price}</p>
              </div>
              <p className="pw-small mt-0.5 text-pw-muted">{opt.body}</p>
              {opt.priceSub && (
                <p className="pw-overline mt-1 text-pw-muted-light">{opt.priceSub}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── SampleNudge — soft escape hatch for hesitant cold traffic ───────── */
function SampleNudge() {
  return (
    <div className="rounded-pw-card border border-pw-stone bg-pw-bg p-5 sm:p-6">
      <p className="pw-overline text-pw-accent">Not ready?</p>
      <p className="pw-body mt-2 text-pw-ink">
        Order an A5 swatch of every finish. R300, with R150 credited to your
        wallpaper order when you come back.
      </p>
      <a
        href="/samples"
        className="mt-3 inline-flex items-center gap-1.5 pw-small font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
      >
        Order samples
        <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
