import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "./order";

export interface WallSpec {
  widthM: number;
  heightM: number;
}

interface BaseCartItem {
  id: string;
  subtotalCents: number;
}

/** The image-resolution verdict the buyer saw and accepted (worst wall). */
export interface CartItemQuality {
  level:   "good" | "borderline" | "too_low";
  pxPerMm: number;
  widthPx: number;
  heightPx: number;
}

export interface WallpaperCartItem extends BaseCartItem {
  type: "wallpaper";
  widthM: number;
  heightM: number;
  wallCount: number;
  walls?: WallSpec[];
  totalSqm: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  application: ApplicationMethod;
  /** Single image (1 wall or same for all). */
  imageDataUrl?: string;
  /** One image per wall when walls have different sizes. */
  imageDataUrls?: string[];
  /** Resolution verdict accepted at add-to-cart (worst wall). */
  imageQuality?: CartItemQuality | null;
}

export interface SamplePackCartItem extends BaseCartItem {
  type: "sample_pack";
  quantity: number;
}

export type CartItem = WallpaperCartItem | SamplePackCartItem;

export interface CartState {
  items: CartItem[];
}
