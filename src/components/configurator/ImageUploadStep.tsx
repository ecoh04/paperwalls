"use client";

import { useCallback, useState } from "react";

const MAX_SIZE_MB = 50;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

type SingleUploadProps = {
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
};

function SingleUpload({ imagePreviewUrl, onFileSelect }: SingleUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (file: File | null) => {
      setError(null);
      if (!file) {
        onFileSelect(null);
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File must be under ${MAX_SIZE_MB}MB.`);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSet(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSet(file ?? null);
  };

  if (!imagePreviewUrl) {
    return (
      <div>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors touch-manipulation sm:min-h-[180px] ${
            dragActive ? "border-stone-900 bg-stone-50" : "border-stone-300 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          }`}
        >
          <input type="file" accept={ACCEPT} onChange={handleChange} className="hidden" />
          <span className="text-sm font-medium text-stone-600 text-center px-4">
            Drag and drop here, or tap to browse
          </span>
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="aspect-video w-full max-w-[280px] overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shrink-0">
        <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-2 min-h-[44px] justify-center">
        <p className="text-sm text-stone-600">Image uploaded. Adjust position in the next step.</p>
        <button
          type="button"
          onClick={() => onFileSelect(null)}
          className="text-sm font-medium text-stone-700 underline hover:no-underline py-2 -ml-2 min-h-[44px] flex items-center touch-manipulation"
        >
          Choose a different image
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

type ImageUploadStepProps = {
  /** Single image (1 wall or same for all) */
  imagePreviewUrl: string | null;
  onFileSelect: (file: File | null) => void;
  /** When different walls: one image per wall */
  multiWallMode?: "same" | "different";
  walls?: { imagePreviewUrl?: string | null }[];
  onWallFileSelect?: (wallIndex: number, file: File | null) => void;
};

export function ImageUploadStep({
  imagePreviewUrl,
  onFileSelect,
  multiWallMode = "same",
  walls = [],
  onWallFileSelect,
}: ImageUploadStepProps) {
  const isMultiDifferent = multiWallMode === "different" && walls.length > 0;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">2. Your image{walls.length > 1 ? "s" : ""}</h2>
      <p className="mt-1 text-sm text-stone-600">
        {isMultiDifferent
          ? "Upload one image per wall so each wall has the right design. JPG, PNG, WebP or PDF. Max 50MB each."
          : "Upload the image for your wall. JPG, PNG, WebP or PDF. Max 50MB."}
      </p>

      {!isMultiDifferent ? (
        <div className="mt-6">
          <SingleUpload imagePreviewUrl={imagePreviewUrl} onFileSelect={onFileSelect} />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {walls.map((wall, i) => (
            <div key={i} className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
              <h3 className="text-sm font-medium text-stone-800 mb-3">Wall {i + 1}</h3>
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
