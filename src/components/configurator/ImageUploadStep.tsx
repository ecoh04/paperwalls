"use client";

import { useCallback, useState } from "react";
import { ConfigStep } from "./ConfigStep";
import { ConfigAlert } from "./ConfigAlert";

const MAX_SIZE_MB = 50;
const ACCEPT      = "image/jpeg,image/png,image/webp";

function UploadIcon() {
  return (
    <svg className="h-7 w-7 text-pw-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

type SingleUploadProps = {
  imagePreviewUrl: string | null;
  imageWidthPx?:   number | null;
  imageHeightPx?:  number | null;
  onFileSelect:    (file: File | null) => void;
  uploadError?:    string | null;
  hint?:           string;
};

function SingleUpload({
  imagePreviewUrl, imageWidthPx, imageHeightPx, onFileSelect, uploadError, hint,
}: SingleUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [sizeError,  setSizeError]  = useState<string | null>(null);

  const validateAndSet = useCallback(
    (file: File | null) => {
      setSizeError(null);
      if (!file) { onFileSelect(null); return; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setSizeError(`File must be under ${MAX_SIZE_MB}MB.`);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  if (!imagePreviewUrl) {
    return (
      <div className="space-y-3">
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) validateAndSet(f); }}
          className={[
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 rounded-pw-card border-2 border-dashed transition-colors touch-manipulation",
            dragActive
              ? "border-pw-ink bg-pw-accent-soft/60"
              : "border-pw-stone hover:border-pw-ink/40 hover:bg-pw-bg",
          ].join(" ")}
        >
          <input
            type="file"
            accept={ACCEPT}
            onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-pw-card border border-pw-stone bg-pw-surface">
            <UploadIcon />
          </div>
          <div className="px-6 text-center">
            <p className="pw-body font-medium text-pw-ink">
              {dragActive ? "Drop it here" : "Drag & drop, or tap to browse"}
            </p>
            <p className="pw-small mt-1 text-pw-muted">JPG, PNG or WebP, up to 50 MB.</p>
          </div>
          {hint && (
            <p className="pw-small max-w-md px-6 text-center text-pw-muted-light">{hint}</p>
          )}
        </label>

        {sizeError   && <ConfigAlert variant="error" title="File too large">{sizeError}</ConfigAlert>}
        {uploadError && <ConfigAlert variant="error" title="Image issue">{uploadError}</ConfigAlert>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4 rounded-pw-card border border-pw-stone bg-pw-bg p-4">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-stone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pw-accent">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 10 10">
                <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="pw-small font-semibold text-pw-ink">Image uploaded</p>
            {imageWidthPx && imageHeightPx && (
              <span className="pw-overline text-pw-muted-light">
                {imageWidthPx} × {imageHeightPx} px
              </span>
            )}
          </div>
          <p className="pw-small mt-1 text-pw-muted">
            Position it inside the wall preview below.
          </p>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="mt-2 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
          >
            Choose a different image
          </button>
        </div>
      </div>

      {uploadError && <ConfigAlert variant="error" title="Image issue">{uploadError}</ConfigAlert>}
    </div>
  );
}

type ImageUploadStepProps = {
  stepNumber:        number;
  imagePreviewUrl:   string | null;
  imageWidthPx?:     number | null;
  imageHeightPx?:    number | null;
  onFileSelect:      (file: File | null) => void;
  multiWallMode?:    "same" | "different";
  walls?:            { imagePreviewUrl?: string | null }[];
  onWallFileSelect?: (wallIndex: number, file: File | null) => void;
  uploadError?:      string | null;
  resolutionHint?:   string;
};

export function ImageUploadStep({
  stepNumber,
  imagePreviewUrl,
  imageWidthPx,
  imageHeightPx,
  onFileSelect,
  multiWallMode = "same",
  walls = [],
  onWallFileSelect,
  uploadError,
  resolutionHint,
}: ImageUploadStepProps) {
  const isMultiDifferent = multiWallMode === "different" && walls.length > 0;

  return (
    <ConfigStep
      stepNumber={stepNumber}
      eyebrow={isMultiDifferent ? "Your designs" : "Your design"}
      title={isMultiDifferent ? "Upload one image per wall." : "Upload your image."}
      subtitle={
        isMultiDifferent
          ? "We'll print and cut each design to its wall's exact size."
          : "Any photo, artwork or pattern. We'll print it to your wall dimensions."
      }
    >
      {!isMultiDifferent ? (
        <SingleUpload
          imagePreviewUrl={imagePreviewUrl}
          imageWidthPx={imageWidthPx}
          imageHeightPx={imageHeightPx}
          onFileSelect={onFileSelect}
          uploadError={uploadError}
          hint={resolutionHint ?? "Use the highest-resolution file you have for the sharpest print."}
        />
      ) : (
        <div className="space-y-4">
          {walls.map((wall, i) => (
            <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4 sm:p-5">
              <p className="pw-small font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
              <SingleUpload
                imagePreviewUrl={wall.imagePreviewUrl ?? null}
                onFileSelect={(file) => onWallFileSelect?.(i, file)}
              />
            </div>
          ))}
        </div>
      )}
    </ConfigStep>
  );
}
