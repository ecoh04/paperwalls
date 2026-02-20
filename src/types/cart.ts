import type { WallpaperStyle, ApplicationMethod } from "./order";

export interface WallSpec {
  widthM: number;
  heightM: number;
}

export interface CartItem {
  id: string;
  widthM: number;
  heightM: number;
  wallCount: number;
  walls?: WallSpec[];
  totalSqm: number;
  style: WallpaperStyle;
  application: ApplicationMethod;
  subtotalCents: number;
  /** Single image (1 wall or same for all). */
  imageDataUrl?: string;
  /** One image per wall when walls have different sizes. */
  imageDataUrls?: string[];
}

export interface CartState {
  items: CartItem[];
}
