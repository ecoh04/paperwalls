import type { WallpaperStyle, ApplicationMethod } from "./order";

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
  panX: number;
  panY: number;
  scale: number;
  style: WallpaperStyle;
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
  panX: 0,
  panY: 0,
  scale: 1,
  style: "matte",
  application: "diy",
};

export type { WallpaperStyle, ApplicationMethod };
