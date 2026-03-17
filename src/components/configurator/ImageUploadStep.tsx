"use client";

import { useCallback, useState } from "react";

const MAX_SIZE_MB = 50;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

function UploadIcon() {
  return (
    <svg className="h-7 w-7 text-pw-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-pw border border-red-200 bg-red-50 p-4">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-red-800">Image resolution too low</p>
        <p className="mt-0.5 text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}

type SingleUploadProps = {
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  uploadError?: string | null;
};

function SingleUpload({ imagePreviewUrl, onFileSelect, uploadError }: SingleUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [sizeError, setSizeError]   = useState<string | null>(null);

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

  const displayError = uploadError || sizeError;

  if (!imagePreviewUrl) {
    return (
      <div className="space-y-3">
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) validateAndSet(f); }}
          className={[
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 rounded-pw-card border-2 border-dashed transition-all touch-manipulation",
            dragActive
              ? "border-pw-ink bg-pw-accent-soft"
              : "border-pw-stone hover:border-pw-stone-dark hover:bg-pw-accent-soft/40",
          ].join(" ")}
        >
          <input
            type="file"
            accept={ACCEPT}
            onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-pw-card bg-pw-surface shadow-pw-sm border border-pw-stone">
            <UploadIcon />
          </div>
          <div className="text-center px-6">
            <p className="text-base font-medium text-pw-ink">
              {dragActive ? "Drop it here" : "Drag & drop, or tap to browse"}
            </p>
            <p className="mt-1 text-sm text-pw-muted">
              JPG, PNG, WebP or PDF — up to 50MB
            </p>
          </div>
          <p className="text-xs text-pw-muted-light px-6 text-center">
            Use the highest resolution file available for the sharpest print
          </p>
        </label>

        {displayError && <ErrorBanner message={displayError} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4 rounded-pw-card border border-pw-stone bg-pw-bg p-4">
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-pw border border-pw-stone bg-pw-stone">
          <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 10 10">
                <path d="M1.5 5L4 7.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-pw-ink">Image uploaded</p>
          </div>
          <p className="mt-1 text-sm text-pw-muted">
            Position it on your wall in the preview step below.
          </p>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="mt-2 text-sm font-medium text-pw-muted hover:text-pw-ink underline underline-offset-2 transition-colors"
          >
            Choose a different image
          </button>
        </div>
      </div>

      {displayError && <ErrorBanner message={displayError} />}
    </div>
  );
}

type ImageUploadStepProps = {
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  multiWallMode?: "same" | "different";
  walls?: { imagePreviewUrl?: string | null }[];
  onWallFileSelect?: (wallIndex: number, file: File | null) => void;
  uploadError?: string | null;
};

export function ImageUploadStep({
  imagePreviewUrl,
  onFileSelect,
  multiWallMode = "same",
  walls = [],
  onWallFileSelect,
  uploadError,
}: ImageUploadStepProps) {
  const isMultiDifferent = multiWallMode === "different" && walls.length > 0;

  return (
    <section className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 shadow-pw-sm sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pw-ink text-sm font-bold text-white">
          1
        </span>
        <div>
          <h2 className="text-xl font-semibold text-pw-ink">
            Upload your image{walls.length > 1 ? "s" : ""}
          </h2>
          <p className="mt-1 text-sm text-pw-muted">
            {isMultiDifferent
              ? "Upload one image per wall — printed and cut to each wall's exact size."
              : "Any photo, artwork or pattern. We print it to your exact wall dimensions."}
          </p>
        </div>
      </div>

      {!isMultiDifferent ? (
        <SingleUpload
          imagePreviewUrl={imagePreviewUrl}
          onFileSelect={onFileSelect}
          uploadError={uploadError}
        />
      ) : (
        <div className="space-y-4">
          {walls.map((wall, i) => (
            <div key={i} className="rounded-pw border border-pw-stone bg-pw-bg p-4">
              <p className="text-sm font-semibold text-pw-ink mb-3">Wall {i + 1}</p>
              <SingleUpload
                imagePreviewUrl={wall.imagePreviewUrl ?? null}
                onFileSelect={(file) => onWallFileSelect?.(i, file)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
