"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import {
  calculateSubtotalCents,
  calculateInstallationCents,
  formatZar,
  getPricePerSqmCents,
} from "@/lib/pricing";
import { getQuality, MIN_PX_PER_MM } from "@/lib/quality";
import { DEFAULT_CONFIG, type ConfiguratorState } from "@/types/configurator";
import type { WallpaperType, WallpaperMaterial } from "@/types/order";
import { PreviewEditStep } from "./PreviewEditStep";
import { OrderSummaryPanel } from "./OrderSummaryPanel";
import { MobileSummaryBar } from "./MobileSummaryBar";
import { ConfigAlert } from "./ConfigAlert";

/* ── Smart defaults ──────────────────────────────────────────────────────
   3.0 × 2.7 m is a typical lounge feature wall. With Satin / Traditional / DIY
   the buyer sees a real running price (R3,321) the moment the page loads,
   no input required. They tweak from there. */
const SMART_DEFAULTS: ConfiguratorState = {
  ...DEFAULT_CONFIG,
  widthM:  3.0,
  heightM: 2.7,
};

const MAX_SIZE_MB = 50;
const ACCEPT       = "image/jpeg,image/png,image/webp";

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

const FLOW_INPUT_CLASSES =
  "block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10";

/* ──────────────────────────────────────────────────────────────────────── */

export function ConfiguratorV2() {
  const router = useRouter();
  const { addItem } = useCart();
  const getCroppedBlobRef = useRef<(() => Promise<Blob | null>) | null>(null);

  const [state, setState]             = useState<ConfiguratorState>(SMART_DEFAULTS);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [moreWalls,   setMoreWalls]   = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────
  const totalSqm = state.widthM * state.heightM * Math.max(1, state.wallCount);

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

  const worstQuality = useMemo<"good" | "borderline" | "too_low" | null>(() => {
    if (totalSqm <= 0) return null;
    if (!state.imageWidthPx || !state.imageHeightPx) return null;
    return getQuality(state.imageWidthPx, state.imageHeightPx, state.widthM, state.heightM).level;
  }, [totalSqm, state.imageWidthPx, state.imageHeightPx, state.widthM, state.heightM]);

  // ── Upload handlers ────────────────────────────────────────────────────
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

  const setPan  = useCallback((x: number, y: number) => setState((s) => ({ ...s, panX: x, panY: y })), []);
  const setZoom = useCallback((z: number)             => setState((s) => ({ ...s, zoom: z })),         []);

  const setCropReady = useCallback((getBlob: () => Promise<Blob | null>) => {
    getCroppedBlobRef.current = getBlob;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.imagePreviewUrl) URL.revokeObjectURL(state.imagePreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────
  const dimensionsValid = state.widthM > 0 && state.heightM > 0;
  const imageUploaded   = !!state.imagePreviewUrl;
  const qualityBlocks   = worstQuality === "too_low";
  const canAddToCart    = dimensionsValid && imageUploaded && !qualityBlocks;

  const blockedReason = useMemo(() => {
    if (canAddToCart) return null;
    if (!imageUploaded)    return "Add your image to continue.";
    if (!dimensionsValid)  return "Enter your wall size to continue.";
    if (qualityBlocks)     return "Image is too low-resolution. Try a sharper file or reduce the wall.";
    return "Finish setting up to continue.";
  }, [canAddToCart, dimensionsValid, imageUploaded, qualityBlocks]);

  // ── Add to cart ────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    setSubmitError(null);
    if (!canAddToCart || submitting) return;
    setSubmitting(true);

    try {
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
      });
      router.push("/cart");
    } catch (err) {
      console.error("Add-to-cart failed:", err);
      setSubmitError("Something went wrong while preparing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [canAddToCart, submitting, state, totalSqm, subtotalCents, addItem, router]);

  // ── Render ─────────────────────────────────────────────────────────────
  // pb-28 on the outer wrapper reserves space for the fixed MobileSummaryBar.
  // Putting it on the sections wrapper alone left dead space between the
  // last section and the order summary panel.
  return (
    <div className="pb-28 lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start lg:pb-10">
      <div className="space-y-5 sm:space-y-6">

        {/* 1 — Image (the emotional hook) */}
        <FlowSection
          title={imageUploaded ? "Your image" : "Add your image"}
          subtitle={imageUploaded
            ? "Looks great. Position it on your wall below if you want."
            : "Any photo, artwork or pattern. We'll print it to fit your wall."}
        >
          <UploadCard
            imagePreviewUrl={state.imagePreviewUrl}
            imageWidthPx={state.imageWidthPx ?? null}
            imageHeightPx={state.imageHeightPx ?? null}
            uploadError={uploadError}
            onFileSelect={handleFileSelect}
          />

          {/* Wall preview — always visible once both image and dimensions exist.
              The user sees their image positioned on the wall by default; the
              drag/zoom controls inside are the optional fine-tune. */}
          {imageUploaded && dimensionsValid && (
            <div className="mt-5 sm:mt-6">
              <p className="pw-overline text-pw-ink mb-3">
                On your wall
              </p>
              <PreviewEditStep
                compact
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
            </div>
          )}
        </FlowSection>

        {/* 2 — Wall size */}
        <FlowSection
          title="Your wall size"
          subtitle="Pre-filled with a typical feature wall. Edit to match yours."
        >
          <DimensionsBlock
            state={state}
            setState={setState}
            moreWalls={moreWalls}
            setMoreWalls={setMoreWalls}
          />
        </FlowSection>

        {/* 3 — Material & finish */}
        <FlowSection
          title="Material & finish"
          subtitle="How it sticks, how it feels. Price updates live."
        >
          <MaterialBlock state={state} setState={setState} totalSqm={totalSqm} />
        </FlowSection>

        {/* 4 — Pro install toggle (one line, not its own step) */}
        <ProInstallToggle
          state={state}
          setState={setState}
          totalSqm={totalSqm}
        />

        {/* Soft escape hatch for hesitant cold traffic: only renders while
            they haven't reached add-to-cart-ready. Once configured, it
            disappears so it doesn't compete with the primary CTA. */}
        {!canAddToCart && !submitting && (
          <SampleNudge />
        )}

        {submitError && (
          <ConfigAlert variant="error" title="Something went wrong">
            {submitError}
          </ConfigAlert>
        )}
      </div>

      {/* Sticky right-column summary (desktop) */}
      <div className="mt-5 sm:mt-6 lg:mt-0">
        <OrderSummaryPanel
          imagePreviewUrl={state.imagePreviewUrl}
          widthM={state.widthM}
          heightM={state.heightM}
          wallCount={state.wallCount}
          totalSqm={totalSqm}
          wallpaperType={state.wallpaperType}
          material={state.material}
          application={state.application}
          canAddToCart={canAddToCart && !submitting}
          blockedReason={submitting ? "Preparing your print files…" : blockedReason}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Mobile fixed bottom bar */}
      <MobileSummaryBar
        totalSqm={totalSqm}
        subtotalCents={subtotalCents}
        canAddToCart={canAddToCart && !submitting}
        blockedReason={submitting ? "Preparing your print files…" : blockedReason}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

/* ── FlowSection: a content block, not a numbered step ──────────────── */
function FlowSection({
  title, subtitle, children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8">
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

/* ── Upload card — drop-zone or current-image preview ───────────────── */
function UploadCard({
  imagePreviewUrl, imageWidthPx, imageHeightPx, uploadError, onFileSelect,
}: {
  imagePreviewUrl: string | null;
  imageWidthPx:    number | null;
  imageHeightPx:   number | null;
  uploadError:     string | null;
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

/* ── DimensionsBlock — pre-filled, compact, with optional more-walls ── */
function DimensionsBlock({
  state, setState, moreWalls, setMoreWalls,
}: {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  moreWalls: boolean;
  setMoreWalls: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const widthCm  = state.widthM  > 0 ? Math.round(state.widthM  * 100) : 0;
  const heightCm = state.heightM > 0 ? Math.round(state.heightM * 100) : 0;
  const isMulti  = state.wallCount > 1;

  return (
    <div>
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

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="pw-small text-pw-muted">
          {(state.widthM * state.heightM * Math.max(1, state.wallCount)).toFixed(1)} m² total
        </p>
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
        <div className="mt-5 border-t border-pw-stone pt-5">
          <p className="pw-overline text-pw-ink mb-3">How many walls?</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((n) => {
              const active = state.wallCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, wallCount: n }))}
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
          <p className="pw-small mt-3 text-pw-muted-light">
            We&rsquo;ll repeat the same image across all walls at the size you set above.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── MaterialBlock — type pills + finish cards with price ───────────── */
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
              {/* Real macro photo of the finish — same image used on the PDP */}
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
                  <p className="pw-overline text-pw-muted-light">{formatZar(perSqm)}/m²</p>
                  <p className="pw-h3 text-pw-ink">{formatZar(Math.round(subtotal))}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── SampleNudge — low-commit alternative path for hesitant buyers ─── */
function SampleNudge() {
  return (
    <div className="rounded-pw-card border border-pw-stone bg-pw-bg p-5 sm:p-6">
      <p className="pw-overline text-pw-accent">Not ready?</p>
      <p className="pw-body mt-2 text-pw-ink">
        Order an A5 swatch of every finish. R150, credited to your wallpaper
        order when you come back.
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

/* ── ProInstallToggle — single-line opt-in, not a step ──────────────── */
function ProInstallToggle({
  state, setState, totalSqm,
}: {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  totalSqm: number;
}) {
  const isPro = state.application === "pro_installer";
  const proCost = calculateInstallationCents("pro_installer", totalSqm);

  return (
    <button
      type="button"
      onClick={() => setState((s) => ({ ...s, application: isPro ? "diy" : "pro_installer" }))}
      aria-pressed={isPro}
      className={[
        "flex w-full items-center gap-4 rounded-pw-card border p-5 text-left transition-colors touch-manipulation sm:p-6",
        isPro ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink/15" : "border-pw-stone bg-pw-surface hover:border-pw-ink/40",
      ].join(" ")}
    >
      {/* Toggle pill */}
      <span
        aria-hidden
        className={[
          "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          isPro ? "bg-pw-ink" : "bg-pw-stone",
        ].join(" ")}
      >
        <span
          className={[
            "absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            isPro ? "translate-x-[22px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="pw-body font-semibold text-pw-ink">Add a pro installer</p>
        <p className="pw-small text-pw-muted">
          Certified installer to your address. All materials included.
        </p>
      </div>

      <span className="shrink-0 text-right">
        <span className="pw-body block font-semibold text-pw-ink">
          {isPro ? `+${formatZar(proCost)}` : formatZar(proCost)}
        </span>
        <span className="pw-overline block text-pw-muted-light">
          for {totalSqm.toFixed(1)} m²
        </span>
      </span>
    </button>
  );
}
