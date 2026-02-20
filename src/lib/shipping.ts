import type { ShippingProvince } from "@/types/order";

/**
 * Shipping cost in ZAR cents by province (South Africa).
 * Adjust tiers to match your carrier/zone pricing.
 */
const SHIPPING_CENTS_BY_PROVINCE: Record<ShippingProvince, number> = {
  gauteng: 15000,        // R150
  western_cape: 18000,  // R180
  kwaZulu_natal: 18000,
  eastern_cape: 20000,
  free_state: 18000,
  limpopo: 20000,
  mpumalanga: 18000,
  northern_cape: 22000,
  north_west: 18000,
  other: 22000,
};

export function getShippingCents(province: ShippingProvince): number {
  return SHIPPING_CENTS_BY_PROVINCE[province] ?? SHIPPING_CENTS_BY_PROVINCE.other;
}

/** SA provinces for checkout form (label, value). */
export const PROVINCES: { value: ShippingProvince; label: string }[] = [
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwaZulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "north_west", label: "North West" },
  { value: "other", label: "Other" },
];
