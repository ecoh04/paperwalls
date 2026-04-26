/**
 * Pixel-perfect crop export for the wallpaper configurator.
 *
 * Given the original image URL and a crop rectangle (in image-natural pixel
 * coordinates, as returned by react-easy-crop's `onCropComplete`), produces a
 * JPEG blob containing exactly that region.
 *
 * EXIF orientation is honoured via `createImageBitmap(blob, { imageOrientation: "from-image" })`
 * so iPhone portrait photos export upright (older browsers used to crop them sideways).
 */

export interface CropArea {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

/** Cap longest edge of the export so cart localStorage stays under quota. */
const OUT_MAX_PX = 4000;

/** JPEG quality — 0.9 keeps prints sharp without bloating storage. */
const OUT_QUALITY = 0.9;

async function loadImageBitmap(imageUrl: string): Promise<ImageBitmap> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch image (HTTP ${response.status})`);
  }
  const blob = await response.blob();

  // imageOrientation: "from-image" applies any EXIF rotation so the bitmap's
  // pixel grid matches what the user sees in the <img>. Supported in all
  // modern browsers (Chrome 90+, Firefox 77+, Safari 15+).
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Some browsers don't accept the options bag — fall through to the
      // no-options call (which respects EXIF on most modern browsers anyway).
      return await createImageBitmap(blob);
    }
  }

  // Fallback: HTMLImageElement → drawImage. Works everywhere but may lose
  // EXIF orientation on very old browsers.
  return new Promise<ImageBitmap>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Wrap the img in a bitmap-shaped object so the caller can use the same code path.
      // ImageBitmap is structurally similar to HTMLImageElement for drawImage purposes.
      resolve(img as unknown as ImageBitmap);
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = imageUrl;
  });
}

export async function exportCroppedJpeg(
  imageUrl: string,
  area:     CropArea,
): Promise<Blob | null> {
  if (!imageUrl) return null;
  if (area.width <= 0 || area.height <= 0) return null;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await loadImageBitmap(imageUrl);
  } catch (e) {
    console.error("[imageCrop] Failed to load image:", e);
    return null;
  }

  // Downscale only if the requested crop exceeds OUT_MAX_PX on either side.
  const scaleFactor = Math.min(OUT_MAX_PX / area.width, OUT_MAX_PX / area.height, 1);
  const outW = Math.max(1, Math.round(area.width  * scaleFactor));
  const outH = Math.max(1, Math.round(area.height * scaleFactor));

  const canvas = document.createElement("canvas");
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
    return null;
  }

  // High-quality smoothing matters when we downscale.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    bitmap as CanvasImageSource,
    area.x, area.y, area.width, area.height,
    0,      0,      outW,        outH,
  );

  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", OUT_QUALITY);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
