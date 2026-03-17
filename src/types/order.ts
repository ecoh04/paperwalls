/**
 * Order status as it moves through the factory.
 */
export type OrderStatus =
  | "pending"   // awaiting payment
  | "new"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Wallpaper application type (adhesive method).
 */
export type WallpaperType =
  | "traditional"   // paste-the-wall, industry standard
  | "peel_and_stick"; // self-adhesive, repositionable

/**
 * Wallpaper material / finish (affects price).
 */
export type WallpaperMaterial =
  | "satin"
  | "matte"
  | "linen";

/**
 * Alias kept for any legacy references (maps to material).
 */
export type WallpaperStyle = WallpaperMaterial;

/**
 * How the customer will apply the wallpaper.
 */
export type ApplicationMethod =
  | "diy"
  | "diy_kit"
  | "pro_installer";

/**
 * Shipping province for zone pricing.
 */
export type ShippingProvince =
  | "gauteng"
  | "western_cape"
  | "kwaZulu_natal"
  | "eastern_cape"
  | "free_state"
  | "limpopo"
  | "mpumalanga"
  | "northern_cape"
  | "north_west"
  | "other";

/**
 * One order as stored in the database and shown in admin.
 */
export interface Order {
  id: string;
  order_number: string;
  // Customer
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  // Address
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  // Configurator
  wall_width_m: number;
  wall_height_m: number;
  wall_count: number;
  total_sqm: number;
  image_url: string;
  image_urls: string[];
  wallpaper_type: WallpaperType | null;
  wallpaper_style: WallpaperMaterial | null;
  application_method: ApplicationMethod | null;
  // Money (ZAR cents)
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: OrderStatus;
  walls_spec?: { widthM: number; heightM: number }[];
  created_at: string;
  updated_at: string;
}
