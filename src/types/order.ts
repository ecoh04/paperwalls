/**
 * Order status as it moves through the factory.
 */
export type OrderStatus =
  | "pending"   // awaiting payment
  | "new"
  | "in_production"
  | "shipped"
  | "delivered";

/**
 * Wallpaper finish (affects price).
 */
export type WallpaperStyle =
  | "matte"
  | "satin"
  | "textured"
  | "premium";

/**
 * How the customer will apply the wallpaper.
 */
export type ApplicationMethod =
  | "diy"
  | "diy_kit"
  | "installer";

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
  image_url: string; // URL to print image (Supabase Storage)
  /** Additional print URLs when multi-wall different sizes. */
  image_urls: string[];

  wallpaper_style: WallpaperStyle;
  application_method: ApplicationMethod;

  // Money (ZAR cents to avoid float issues)
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;

  status: OrderStatus;
  /** Stitch Express payment/transaction id. */
  stitch_payment_id: string | null;

  /** Per-wall dimensions when wall_count > 1 and walls differ. */
  walls_spec?: { widthM: number; heightM: number }[];

  created_at: string;
  updated_at: string;
}
