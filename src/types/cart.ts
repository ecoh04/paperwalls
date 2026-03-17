import type { WallpaperStyle, ApplicationMethod } from "./order";

export interface WallSpec {
  widthM: number;
  heightM: number;
}

interface BaseCartItem {
  id: string;
  subtotalCents: number;
}

export interface WallpaperCartItem extends BaseCartItem {
  type: "wallpaper";
  widthM: number;
  heightM: number;
  wallCount: number;
  walls?: WallSpec[];
  totalSqm: number;
  style: WallpaperStyle;
  application: ApplicationMethod;
  /** Single image (1 wall or same for all). */
  imageDataUrl?: string;
  /** One image per wall when walls have different sizes. */
  imageDataUrls?: string[];
}

export interface SamplePackCartItem extends BaseCartItem {
  type: "sample_pack";
  quantity: number;
}

export type CartItem = WallpaperCartItem | SamplePackCartItem;

export interface CartState {
  items: CartItem[];
}
