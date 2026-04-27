"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DimensionsStep } from "./DimensionsStep";
import { ImageUploadStep } from "./ImageUploadStep";
import { PreviewEditStep } from "./PreviewEditStep";
import { StyleStep } from "./StyleStep";
import { InstallationStep } from "./InstallationStep";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { ConfigStep } from "./ConfigStep";
import { ConfigAlert } from "./ConfigAlert";
import { useCart } from "@/contexts/CartContext";
import { calculateSubtotalCents } from "@/lib/pricing";
import { getQuality, MIN_PX_PER_MM } from "@/lib/quality";
import { DEFAULT_CONFIG, type ConfiguratorState, type WallSpec } from "@/types/configurator";

// ── Step ordering ───────────────────────────────────────────────────────────
// 1. Dimensions  → user knows what size they want
// 2. Upload      → we can give a resolution hint based on dimensions
// 3. Preview     → only shows once dims + image both set
// 4. Material    → only shows once area > 0
// 5. Installation
const STEP_DIMENSIONS   = 1;
const STEP_UPLOAD       = 2;
const STEP_PREVIEW      = 3;
const STEP_MATERIAL     = 4;
const STEP_INSTALLATION = 5;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function loadImageDimensions(url: string): Promise<{ widthPx: number; heightPx: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ widthPx: img.naturalWidth || img.width, heightPx: img.naturalHeight || img.height });
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

export function Configurator() {
  const router = useRouter();
  const { addItem } = useCart();
  const getCroppedBlobRef  = useRef<(() => Promise<Blob | null>) | null>(null);
  const getCroppedBlobRefs = useRef<((() => Promise<Blob | null>) | null)[]>([]);

  const [state, setState]             = useState<ConfiguratorState>(DEFAULT_CONFIG);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const totalSqm =
    state.wallCount > 1 && state.multiWallMode === "different" && state.walls.length === state.wallCount
      ? state.walls.reduce((sum, w) => sum + w.widthM * w.heightM, 0)
      : state.widthM * state.heightM * Math.max(1, state.wallCount);

  const isMultiDifferent =
    state.wallCount > 1 &&
    state.multiWallMode === "different" &&
    state.walls.length === state.wallCount;

  const previewWidth  = isMultiDifferent && state.walls[0] ? state.walls[0].widthM  : state.widthM;
  const previewHeight = isMultiDifferent && state.walls[0] ? state.walls[0].heightM : state.heightM;

  // Resolution hint shown at upload step when dimensions are set.
  const resolutionHint = useMemo(() => {
    if (state.widthM <= 0 || state.heightM <= 0) return undefined;
    const minW = Math.ceil(state.widthM  * 1000 * MIN_PX_PER_MM);
    const minH = Math.ceil(state.heightM * 1000 * MIN_PX_PER_MM);
    return `For ${Math.round(state.widthM * 100)} × ${Math.round(state.heightM * 100)} cm, use at least ${minW} × ${minH} px for a sharp print.`;
  }, [state.widthM, state.heightM]);

  // Worst quality across all walls (single + same mode = single check; different mode = max severity).
  const worstQuality = useMemo<"good" | "borderline" | "too_low" | null>(() => {
    if (totalSqm <= 0) return null;

    const evals: ("good" | "borderline" | "too_low")[] = [];
    if (isMultiDifferent) {
      for (const w of state.walls) {
        if (w.imageWidthPx && w.imageHeightPx && w.widthM > 0 && w.heightM > 0) {
          evals.push(getQuality(w.imageWidthPx, w.imageHeightPx, w.widthM, w.heightM).level);
        }
      }
    } else if (state.imageWidthPx && state.imageHeightPx) {
      // Same-image-each-wall: each wall is the same dimensions, so the per-wall check applies once.
      evals.push(getQuality(state.imageWidthPx, state.imageHeightPx, state.widthM, state.heightM).level);
    }
    if (evals.length === 0) return null;
    if (evals.includes("too_low"))    return "too_low";
    if (evals.includes("borderline")) return "borderline";
    return "good";
  }, [totalSqm, isMultiDifferent, state.walls, state.imageWidthPx, state.imageHeightPx, state.widthM, state.heightM]);

  // ── Image upload (single image) ──────────────────────────────────────────
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
          panX: 0,
          panY: 0,
          zoom: 1,
        }));
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
            panX:            0,
            panY:            0,
            zoom:            1,
          }));
        })
        .catch(() => {
          URL.revokeObjectURL(objectUrl);
          setUploadError("Could not read this image. Try a different file (JPG, PNG, or WebP).");
        });
    },
    [state.imagePreviewUrl]
  );

  // ── Image upload (per-wall, "different" mode) ────────────────────────────
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
        panX: 0,
        panY: 0,
        zoom: 1,
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
            next[wallIndex] = {
              ...next[wallIndex],
              imageWidthPx:  widthPx,
              imageHeightPx: heightPx,
            };
            return { ...s, walls: next };
          });
        })
        .catch(() => {
          // Leave preview but flag — too granular for a global error UI here.
        })
        .finally(() => URL.revokeObjectURL(objectUrl));
    }
  }, []);

  // ── Pan + zoom handlers ──────────────────────────────────────────────────
  const setPan = useCallback((x: number, y: number) => {
    setState((s) => ({ ...s, panX: x, panY: y }));
  }, []);

  const setZoom = useCallback((z: number) => {
    setState((s) => ({ ...s, zoom: z }));
  }, []);

  const setWallPan = useCallback((wallIndex: number, x: number, y: number) => {
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

  // ── Swap width/height (single + same mode) ───────────────────────────────
  const handleSwapDimensions = useCallback(() => {
    setState((s) => ({ ...s, widthM: s.heightM, heightM: s.widthM, panX: 0, panY: 0, zoom: 1 }));
  }, []);

  // ── Crop blob registration ──────────────────────────────────────────────
  const setCropReady = useCallback((getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRef.current = getBlob;
  }, []);

  const setCropReadyWall = useCallback((wallIndex: number, getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRefs.current[wallIndex] = getBlob;
  }, []);

  // ── Cleanup object URLs on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
      state.walls.forEach((w) => { if (w.imagePreviewUrl) URL.revokeObjectURL(w.imagePreviewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  const dimensionsValid =
    isMultiDifferent
      ? state.walls.every((w) => w.widthM > 0 && w.heightM > 0)
      : state.widthM > 0 && state.heightM > 0;

  const allWallImagesUploaded = isMultiDifferent
    ? state.walls.every((w) => w.imagePreviewUrl)
    : !!state.imagePreviewUrl;

  const qualityBlocks = worstQuality === "too_low";

  const canAddToCart = dimensionsValid && allWallImagesUploaded && !qualityBlocks;

  const blockedReason: string | null = useMemo(() => {
    if (canAddToCart) return null;
    if (!dimensionsValid)        return "Enter your wall dimensions to continue.";
    if (!allWallImagesUploaded)  return "Upload your image to continue.";
    if (qualityBlocks)           return "Image is too low-resolution for this wall size — use a sharper file or reduce the wall.";
    return "Complete the steps to continue.";
  }, [canAddToCart, dimensionsValid, allWallImagesUploaded, qualityBlocks]);

  // ── Add to cart ──────────────────────────────────────────────────────────
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
        const subtotalCents = calculateSubtotalCents(totalSqm, state.wallpaperType, state.material, state.application);
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
          // Should not happen if preview rendered correctly, but fall through to original preview just in case.
          imageDataUrl = state.imagePreviewUrl;
        }
        const subtotalCents = calculateSubtotalCents(totalSqm, state.wallpaperType, state.material, state.application);
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
        });
      }
      router.push("/cart");
    } catch (err) {
      console.error("Add-to-cart failed:", err);
      setSubmitError("Something went wrong while preparing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canAddToCart, submitting, state, totalSqm, isMultiDifferent, addItem, router]);

  // Use the first available image for the summary thumbnail
  const summaryImageUrl = isMultiDifferent
    ? (state.walls[0]?.imagePreviewUrl ?? null)
    : state.imagePreviewUrl;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start">
      {/* ── Left column: step cards ─────────────────────────────────────── */}
      <div className="space-y-5 pb-10 sm:space-y-6">
        <DimensionsStep
          stepNumber={STEP_DIMENSIONS}
          widthM={state.widthM}
          heightM={state.heightM}
          wallCount={state.wallCount}
          multiWallMode={state.multiWallMode}
          walls={state.walls}
          onWidthChange={(v) => setState((s) => ({ ...s, widthM: v, panX: 0, panY: 0, zoom: 1 }))}
          onHeightChange={(v) => setState((s) => ({ ...s, heightM: v, panX: 0, panY: 0, zoom: 1 }))}
          onWallCountChange={(v) =>
            setState((s) => ({
              ...s,
              wallCount: v,
              ...(v === 1 ? { multiWallMode: "same" as const, walls: [] } : {}),
            }))
          }
          onMultiWallModeChange={(m) =>
            setState((s) => ({
              ...s,
              multiWallMode: m,
              ...(m === "different" && s.walls.length !== s.wallCount
                ? {
                    walls: Array.from({ length: s.wallCount }, (_, i) =>
                      s.walls[i] ? { ...s.walls[i] } : { widthM: s.widthM, heightM: s.heightM }
                    ),
                  }
                : {}),
            }))
          }
          onWallsChange={(w) => setState((s) => ({ ...s, walls: w }))}
          onSwapDimensions={handleSwapDimensions}
        />

        <ImageUploadStep
          stepNumber={STEP_UPLOAD}
          imagePreviewUrl={state.imagePreviewUrl}
          imageWidthPx={state.imageWidthPx}
          imageHeightPx={state.imageHeightPx}
          onFileSelect={handleFileSelect}
          multiWallMode={state.multiWallMode}
          walls={isMultiDifferent ? state.walls : []}
          onWallFileSelect={handleWallFileSelect}
          uploadError={uploadError}
          resolutionHint={resolutionHint}
        />

        {!isMultiDifferent && state.imagePreviewUrl && previewWidth > 0 && previewHeight > 0 && (
          <PreviewEditStep
            stepNumber={STEP_PREVIEW}
            imageUrl={state.imagePreviewUrl}
            widthM={previewWidth}
            heightM={previewHeight}
            panX={state.panX}
            panY={state.panY}
            zoom={state.zoom}
            onPanChange={setPan}
            onZoomChange={setZoom}
            onCropDataReady={setCropReady}
            wallLabel={state.wallCount > 1 ? ` · repeated on ${state.wallCount} walls` : undefined}
          />
        )}

        {isMultiDifferent && state.walls.some((w) => w.imagePreviewUrl && w.widthM > 0 && w.heightM > 0) && (
          <ConfigStep
            stepNumber={STEP_PREVIEW}
            eyebrow="Position"
            title="Place each design on its wall."
            subtitle="Drag each image to reframe. We'll print exactly what's inside each frame."
          >
            <div className="space-y-4">
              {state.walls.map((wall, i) => {
                const hasContent = !!wall.imagePreviewUrl && wall.widthM > 0 && wall.heightM > 0;
                if (!hasContent) {
                  return (
                    <div key={i} className="rounded-pw border border-dashed border-pw-stone bg-pw-bg p-4 sm:p-5">
                      <p className="pw-small font-semibold text-pw-ink mb-1">Wall {i + 1}</p>
                      <p className="pw-small text-pw-muted">
                        {wall.widthM > 0 && wall.heightM > 0
                          ? "Upload an image above to position your design."
                          : "Add dimensions and an image above to position your design."}
                      </p>
                    </div>
                  );
                }
                return (
                  <PreviewEditStep
                    key={i}
                    compact
                    wallLabel={`Wall ${i + 1}`}
                    imageUrl={wall.imagePreviewUrl ?? null}
                    widthM={wall.widthM}
                    heightM={wall.heightM}
                    panX={wall.panX ?? 0}
                    panY={wall.panY ?? 0}
                    zoom={wall.zoom ?? 1}
                    onPanChange={(x, y) => setWallPan(i, x, y)}
                    onZoomChange={(z) => setWallZoom(i, z)}
                    onCropDataReady={(getBlob) => setCropReadyWall(i, getBlob)}
                  />
                );
              })}
            </div>
          </ConfigStep>
        )}

        <StyleStep
          stepNumber={STEP_MATERIAL}
          totalSqm={totalSqm}
          wallpaperType={state.wallpaperType}
          material={state.material}
          onWallpaperTypeChange={(t) => setState((prev) => ({ ...prev, wallpaperType: t }))}
          onMaterialChange={(m) => setState((prev) => ({ ...prev, material: m }))}
        />

        <InstallationStep
          stepNumber={STEP_INSTALLATION}
          totalSqm={totalSqm}
          application={state.application}
          onApplicationChange={(a) => setState((prev) => ({ ...prev, application: a }))}
        />

        {submitError && (
          <ConfigAlert variant="error" title="Something went wrong">
            {submitError}
          </ConfigAlert>
        )}
      </div>

      {/* ── Right column: sticky order summary (below steps on mobile) ── */}
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
