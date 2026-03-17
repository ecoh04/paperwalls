"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DimensionsStep } from "./DimensionsStep";
import { ImageUploadStep } from "./ImageUploadStep";
import { PreviewEditStep } from "./PreviewEditStep";
import { StyleStep } from "./StyleStep";
import { InstallationStep } from "./InstallationStep";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { useCart } from "@/contexts/CartContext";
import { calculateSubtotalCents } from "@/lib/pricing";
import { DEFAULT_CONFIG, type ConfiguratorState, type WallSpec } from "@/types/configurator";

const MIN_UPLOAD_PX = 400;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function Configurator() {
  const router = useRouter();
  const { addItem } = useCart();
  const getCroppedBlobRef  = useRef<(() => Promise<Blob | null>) | null>(null);
  const getCroppedBlobRefs = useRef<((() => Promise<Blob | null>) | null)[]>([]);

  const [state, setState]       = useState<ConfiguratorState>(DEFAULT_CONFIG);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const setPan = useCallback((x: number, y: number) => {
    setState((s) => ({ ...s, panX: x, panY: y }));
  }, []);

  const setScale = useCallback((scale: number) => {
    setState((s) => ({ ...s, scale }));
  }, []);

  const setWallPan = useCallback((wallIndex: number, x: number, y: number) => {
    setState((s) => {
      const next = [...s.walls];
      if (!next[wallIndex]) return s;
      next[wallIndex] = { ...next[wallIndex], panX: x, panY: y };
      return { ...s, walls: next };
    });
  }, []);

  const setWallScale = useCallback((wallIndex: number, scale: number) => {
    setState((s) => {
      const next = [...s.walls];
      if (!next[wallIndex]) return s;
      next[wallIndex] = { ...next[wallIndex], scale };
      return { ...s, walls: next };
    });
  }, []);

  useEffect(() => {
    if (!state.imagePreviewUrl) return;
    return () => URL.revokeObjectURL(state.imagePreviewUrl!);
  }, [state.imagePreviewUrl]);

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
          scale: 1,
        }));
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const widthPx  = img.naturalWidth  || img.width;
        const heightPx = img.naturalHeight || img.height;

        if (widthPx < MIN_UPLOAD_PX || heightPx < MIN_UPLOAD_PX) {
          URL.revokeObjectURL(objectUrl);
          setUploadError(
            `This image is only ${widthPx}×${heightPx}px — far too small for a quality print. ` +
            `Please use a higher-resolution file (minimum ${MIN_UPLOAD_PX}×${MIN_UPLOAD_PX}px).`
          );
          return;
        }

        setState((s) => ({
          ...s,
          imageFile: file,
          imagePreviewUrl: objectUrl,
          imageWidthPx: widthPx,
          imageHeightPx: heightPx,
          panX: 0,
          panY: 0,
          scale: 1,
        }));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setUploadError("Could not read this image file. Please try a different file.");
      };
      img.src = objectUrl;
    },
    [state.imagePreviewUrl]
  );

  const handleWallFileSelect = useCallback((wallIndex: number, file: File | null) => {
    setState((s) => {
      const next = [...s.walls];
      const prev = next[wallIndex];
      if (prev?.imagePreviewUrl) URL.revokeObjectURL(prev.imagePreviewUrl);
      if (!next[wallIndex]) next[wallIndex] = { widthM: 0, heightM: 0 };
      next[wallIndex] = {
        ...next[wallIndex],
        imageFile: file ?? null,
        imagePreviewUrl: file ? URL.createObjectURL(file) : null,
        panX: 0,
        panY: 0,
        scale: 1,
      };
      return { ...s, walls: next };
    });
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (totalSqm <= 0) return;

    if (isMultiDifferent) {
      const allHaveImage = state.walls.every((w) => w.imagePreviewUrl);
      if (!allHaveImage) return;
      getCroppedBlobRefs.current = getCroppedBlobRefs.current.slice(0, state.walls.length);
      const blobs = await Promise.all(
        getCroppedBlobRefs.current.map((getBlob) => (getBlob ? getBlob() : null))
      );
      const imageDataUrls = await Promise.all(
        blobs.map((b) => (b ? blobToDataUrl(b) : ""))
      );
      if (imageDataUrls.some((u) => !u)) return;
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
      let imageDataUrl = state.imagePreviewUrl;
      const getBlob = getCroppedBlobRef.current;
      if (getBlob) {
        const blob = await getBlob();
        if (blob) imageDataUrl = await blobToDataUrl(blob);
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
  }, [state, totalSqm, isMultiDifferent, addItem, router]);

  const dimensionsValid =
    isMultiDifferent
      ? state.walls.every((w) => w.widthM > 0 && w.heightM > 0)
      : state.widthM > 0 && state.heightM > 0;

  const allWallImagesUploaded = isMultiDifferent
    ? state.walls.every((w) => w.imagePreviewUrl)
    : !!state.imagePreviewUrl;

  const canAddToCart = dimensionsValid && allWallImagesUploaded;

  const addToCartLabel = canAddToCart
    ? "Add to cart"
    : !allWallImagesUploaded
    ? "Upload an image to continue"
    : "Enter your wall dimensions to continue";

  const setCropReady = useCallback((getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRef.current = getBlob;
  }, []);

  const setCropReadyWall = useCallback((wallIndex: number, getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRefs.current[wallIndex] = getBlob;
  }, []);

  // Use the first available image for the summary preview
  const summaryImageUrl = isMultiDifferent
    ? (state.walls[0]?.imagePreviewUrl ?? null)
    : state.imagePreviewUrl;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start">
      {/* ── Left column: step cards ─────────────────────────────────────── */}
      <div className="space-y-4 pb-8">
        <ImageUploadStep
          imagePreviewUrl={state.imagePreviewUrl}
          onFileSelect={handleFileSelect}
          multiWallMode={state.multiWallMode}
          walls={isMultiDifferent ? state.walls : []}
          onWallFileSelect={handleWallFileSelect}
          uploadError={uploadError}
        />

        <DimensionsStep
          widthM={state.widthM}
          heightM={state.heightM}
          wallCount={state.wallCount}
          multiWallMode={state.multiWallMode}
          walls={state.walls}
          imageWidthPx={state.imageWidthPx ?? undefined}
          imageHeightPx={state.imageHeightPx ?? undefined}
          onWidthChange={(v) => setState((s) => ({ ...s, widthM: v }))}
          onHeightChange={(v) => setState((s) => ({ ...s, heightM: v }))}
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
        />

        {!isMultiDifferent && (
          <PreviewEditStep
            imageUrl={state.imagePreviewUrl}
            widthM={previewWidth}
            heightM={previewHeight}
            wallCount={state.wallCount}
            panX={state.panX}
            panY={state.panY}
            scale={state.scale}
            onPanChange={setPan}
            onScaleChange={setScale}
            onCropDataReady={setCropReady}
          />
        )}

        {isMultiDifferent &&
          state.walls.map((wall, i) => (
            <PreviewEditStep
              key={i}
              imageUrl={wall.imagePreviewUrl ?? null}
              widthM={wall.widthM}
              heightM={wall.heightM}
              wallLabel={` · Wall ${i + 1}`}
              panX={wall.panX ?? 0}
              panY={wall.panY ?? 0}
              scale={wall.scale ?? 1}
              onPanChange={(x, y) => setWallPan(i, x, y)}
              onScaleChange={(s) => setWallScale(i, s)}
              onCropDataReady={(getBlob) => setCropReadyWall(i, getBlob)}
            />
          ))}

        <StyleStep
          totalSqm={totalSqm}
          wallpaperType={state.wallpaperType}
          material={state.material}
          onWallpaperTypeChange={(t) => setState((prev) => ({ ...prev, wallpaperType: t }))}
          onMaterialChange={(m) => setState((prev) => ({ ...prev, material: m }))}
        />

        <InstallationStep
          totalSqm={totalSqm}
          application={state.application}
          onApplicationChange={(a) => setState((prev) => ({ ...prev, application: a }))}
        />
      </div>

      {/* ── Right column: sticky order summary ──────────────────────────── */}
      <OrderSummaryPanel
        imagePreviewUrl={summaryImageUrl}
        widthM={state.widthM}
        heightM={state.heightM}
        wallCount={state.wallCount}
        totalSqm={totalSqm}
        wallpaperType={state.wallpaperType}
        material={state.material}
        application={state.application}
        canAddToCart={canAddToCart}
        addToCartLabel={addToCartLabel}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
