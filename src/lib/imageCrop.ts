/**
 * Pixel-perfect crop export for the wallpaper configurator.
 *
 * The configurator uses a "contain + zoom-in" model:
 *   - At zoom = 1 the whole image is visible inside the wall preview, fitted
 *     by aspect (letterbox white space appears if image and wall don't share
 *     the same aspect ratio).
 *   - At zoom > 1 the image grows past contain-fit; eventually it covers the
 *     wall, then crops further as the user zooms more.
 *
 * The export is the WALL — not just the image — so the canvas dimensions
 * follow the wall's aspect ratio, with white fill anywhere outside the image.
 *
 * EXIF orientation is honoured via `createImageBitmap(blob, { imageOrientation:
 * 'from-image' })` so iPhone portrait JPEGs export upright (older browsers
 * sometimes cropped them sideways).
 */

export interface CropArea {
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

export interface ContainCropParams {
  imageUrl:    string;
  imgWidthPx:  number;   // image natural width
  imgHeightPx: number;   // image natural height
  frameWidth:  number;   // wall preview frame width on screen, px
  frameHeight: number;   // wall preview frame height on screen, px
  panX:        number;   // current pan X in frame pixels (image-centre offset)
  panY:        number;   // current pan Y in frame pixels
  zoom:        number;   // 1 = contain fit, >1 = zoomed in
}

/** Cap longest edge of the export so cart localStorage stays under quota. */
const OUT_MAX_PX = 4000;

/** JPEG quality — 0.9 keeps prints sharp without bloating storage. */
const OUT_QUALITY = 0.9;

async function loadImageBitmap(imageUrl: string): Promise<ImageBitmap | HTMLImageElement> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch image (HTTP ${response.status})`);
  }
  const blob = await response.blob();

  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(blob);
      } catch {
        // fall through
      }
    }
  }

  // Fallback: HTMLImageElement → drawImage. Works everywhere but may lose
  // EXIF orientation on very old browsers.
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = imageUrl;
  });
}

function closeBitmap(b: ImageBitmap | HTMLImageElement) {
  if ("close" in b && typeof (b as ImageBitmap).close === "function") {
    (b as ImageBitmap).close();
  }
}

/**
 * Source-rectangle crop. Used by older code paths that already computed an
 * exact source rect in image pixels. Output is just that source region.
 */
export async function exportCroppedJpeg(
  imageUrl: string,
  area:     CropArea,
): Promise<Blob | null> {
  if (!imageUrl) return null;
  if (area.width <= 0 || area.height <= 0) return null;

  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  try {
    bitmap = await loadImageBitmap(imageUrl);
  } catch (e) {
    console.error("[imageCrop] Failed to load image:", e);
    return null;
  }

  const scaleFactor = Math.min(OUT_MAX_PX / area.width, OUT_MAX_PX / area.height, 1);
  const outW = Math.max(1, Math.round(area.width  * scaleFactor));
  const outH = Math.max(1, Math.round(area.height * scaleFactor));

  const canvas = document.createElement("canvas");
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    closeBitmap(bitmap);
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    bitmap as CanvasImageSource,
    area.x, area.y, area.width, area.height,
    0,      0,      outW,        outH,
  );

  closeBitmap(bitmap);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", OUT_QUALITY);
  });
}

/**
 * Wall-area export for the contain + zoom-in model.
 *
 * The output is sized to the WALL (not the image), so areas outside the
 * image — letterbox at zoom = 1 — get a white fill. This matches what the
 * customer sees in the preview.
 */
export async function exportContainCropJpeg(params: ContainCropParams): Promise<Blob | null> {
  const { imageUrl, imgWidthPx, imgHeightPx, frameWidth, frameHeight, panX, panY, zoom } = params;
  if (!imageUrl) return null;
  if (imgWidthPx <= 0 || imgHeightPx <= 0 || frameWidth <= 0 || frameHeight <= 0) return null;

  // Contain scale: smallest factor at which the whole image fits inside the frame.
  const baseScale = Math.min(frameWidth / imgWidthPx, frameHeight / imgHeightPx);
  const effScale  = baseScale * Math.max(zoom, 0.0001);

  // Output canvas dimensions follow the wall's aspect ratio, sized so 1
  // output pixel corresponds roughly to 1 image pixel at zoom = 1 contain.
  const idealOutW = frameWidth  / effScale;
  const idealOutH = frameHeight / effScale;
  const cap       = Math.min(OUT_MAX_PX / Math.max(idealOutW, idealOutH), 1);
  const outW      = Math.max(1, Math.round(idealOutW * cap));
  const outH      = Math.max(1, Math.round(idealOutH * cap));

  let bitmap: ImageBitmap | HTMLImageElement | null = null;
  try {
    bitmap = await loadImageBitmap(imageUrl);
  } catch (e) {
    console.error("[imageCrop] Failed to load image:", e);
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    closeBitmap(bitmap);
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // White background — this is what the customer sees as letterbox.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);

  // Place the image at its current display position, scaled into output coords.
  // 1 frame pixel = (1/effScale) * cap output pixels; image natural pixels map to
  // imgWidthPx * cap output pixels.
  const imgInOutW    = imgWidthPx  * cap;
  const imgInOutH    = imgHeightPx * cap;
  const imgCenterOutX = outW / 2 + (panX / effScale) * cap;
  const imgCenterOutY = outH / 2 + (panY / effScale) * cap;
  const imgTopOutX    = imgCenterOutX - imgInOutW / 2;
  const imgTopOutY    = imgCenterOutY - imgInOutH / 2;

  ctx.drawImage(
    bitmap as CanvasImageSource,
    0, 0, imgWidthPx, imgHeightPx,
    imgTopOutX, imgTopOutY, imgInOutW, imgInOutH,
  );

  closeBitmap(bitmap);

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
