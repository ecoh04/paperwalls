import type { ShippingProvince } from "@/types/order";

/**
 * Shipping is currently free nationwide.
 * Province is still collected for address and operational routing.
 */
export function getShippingCents(_province: ShippingProvince): number {
  return 0;
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
