import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "./order";

export type MultiWallMode = "same" | "different";

export interface WallSpec {
  widthM: number;
  heightM: number;
  imageFile?: File | null;
  imagePreviewUrl?: string | null;
  panX?: number;
  panY?: number;
  scale?: number;
}

export interface ConfiguratorState {
  widthM: number;
  heightM: number;
  wallCount: number;
  /** When wallCount > 1: same size/image for all, or different per wall */
  multiWallMode: MultiWallMode;
  /** When multiWallMode === "different": one spec per wall */
  walls: WallSpec[];
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageWidthPx?: number | null;
  imageHeightPx?: number | null;
  panX: number;
  panY: number;
  scale: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  application: ApplicationMethod;
}

export const DEFAULT_CONFIG: ConfiguratorState = {
  widthM: 0,
  heightM: 0,
  wallCount: 1,
  multiWallMode: "same",
  walls: [],
  imageFile: null,
  imagePreviewUrl: null,
  imageWidthPx: null,
  imageHeightPx: null,
  panX: 0,
  panY: 0,
  scale: 1,
  wallpaperType: "traditional",
  material: "satin",
  application: "diy",
};

export type { WallpaperType, WallpaperMaterial, ApplicationMethod };
