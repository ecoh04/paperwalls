"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DimensionsStep } from "./DimensionsStep";
import { ImageUploadStep } from "./ImageUploadStep";
import { PreviewEditStep } from "./PreviewEditStep";
import { StyleStep } from "./StyleStep";
import { InstallationStep } from "./InstallationStep";
import { PriceSummary } from "./PriceSummary";
import { useCart } from "@/contexts/CartContext";
import { calculateSubtotalCents } from "@/lib/pricing";
import { DEFAULT_CONFIG, type ConfiguratorState, type WallSpec } from "@/types/configurator";

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
  const getCroppedBlobRef = useRef<(() => Promise<Blob | null>) | null>(null);
  const getCroppedBlobRefs = useRef<((() => Promise<Blob | null>) | null)[]>([]);

  const [state, setState] = useState<ConfiguratorState>(DEFAULT_CONFIG);

  const totalSqm =
    state.wallCount > 1 && state.multiWallMode === "different" && state.walls.length === state.wallCount
      ? state.walls.reduce((sum, w) => sum + w.widthM * w.heightM, 0)
      : state.widthM * state.heightM * Math.max(1, state.wallCount);

  const isMultiDifferent =
    state.wallCount > 1 &&
    state.multiWallMode === "different" &&
    state.walls.length === state.wallCount;

  const previewWidth = isMultiDifferent && state.walls[0] ? state.walls[0].widthM : state.widthM;
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


  const handleFileSelect = useCallback((file: File | null) => {
    if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
    setState((s) => ({
      ...s,
      imageFile: file ?? null,
      imagePreviewUrl: file ? URL.createObjectURL(file) : null,
      panX: 0,
      panY: 0,
      scale: 1,
    }));
  }, [state.imagePreviewUrl]);

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

    // We store the cropped image(s) from the preview frame only. This is exactly what we send to the factory—no further cropping or edits.
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
      const subtotalCents = calculateSubtotalCents(totalSqm, state.style, state.application);
      addItem({
        widthM: state.walls[0].widthM,
        heightM: state.walls[0].heightM,
        wallCount: state.wallCount,
        walls: state.walls.map((w) => ({ widthM: w.widthM, heightM: w.heightM })),
        totalSqm,
        style: state.style,
        application: state.application,
        subtotalCents,
        imageDataUrls,
      });
    } else {
      if (!state.imagePreviewUrl) return;
      let imageDataUrl = state.imagePreviewUrl;
      const getBlob = getCroppedBlobRef.current;
      if (getBlob) {
        const blob = await getBlob(); // Exact pixels from the print frame—this is what we print
        if (blob) imageDataUrl = await blobToDataUrl(blob);
      }
      const subtotalCents = calculateSubtotalCents(totalSqm, state.style, state.application);
      addItem({
        widthM: state.widthM,
        heightM: state.heightM,
        wallCount: state.wallCount,
        totalSqm,
        style: state.style,
        application: state.application,
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

  const setCropReady = useCallback((getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRef.current = getBlob;
  }, []);

  const setCropReadyWall = useCallback((wallIndex: number, getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRefs.current[wallIndex] = getBlob;
  }, []);

  return (
    <div className="space-y-6 pb-24 md:pb-8 md:space-y-8">
      <DimensionsStep
        widthM={state.widthM}
        heightM={state.heightM}
        wallCount={state.wallCount}
        multiWallMode={state.multiWallMode}
        walls={state.walls}
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

      <ImageUploadStep
        imagePreviewUrl={state.imagePreviewUrl}
        onFileSelect={handleFileSelect}
        multiWallMode={state.multiWallMode}
        walls={isMultiDifferent ? state.walls : []}
        onWallFileSelect={handleWallFileSelect}
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
        style={state.style}
        application={state.application}
        onStyleChange={(s) => setState((prev) => ({ ...prev, style: s }))}
      />

      <InstallationStep
        totalSqm={totalSqm}
        application={state.application}
        onApplicationChange={(a) => setState((prev) => ({ ...prev, application: a }))}
      />

      <PriceSummary
        totalSqm={totalSqm}
        style={state.style}
        application={state.application}
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
