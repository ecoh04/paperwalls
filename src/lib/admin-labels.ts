import type { OrderStatus, WallpaperStyle, ApplicationMethod, ShippingProvince } from "@/types/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  new: "New",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STYLE_LABELS: Record<WallpaperStyle, string> = {
  matte: "Matte",
  satin: "Satin",
  textured: "Textured linen",
  premium: "Premium fabric",
};

export const APPLICATION_LABELS: Record<ApplicationMethod, string> = {
  diy: "DIY",
  diy_kit: "DIY kit",
  installer: "Pro installer",
};

export const PROVINCE_LABELS: Record<ShippingProvince, string> = {
  gauteng: "Gauteng",
  western_cape: "Western Cape",
  kwaZulu_natal: "KwaZulu-Natal",
  eastern_cape: "Eastern Cape",
  free_state: "Free State",
  limpopo: "Limpopo",
  mpumalanga: "Mpumalanga",
  northern_cape: "Northern Cape",
  north_west: "North West",
  other: "Other",
};

export function formatZarCents(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
