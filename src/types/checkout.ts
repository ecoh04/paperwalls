import type { ShippingProvince } from "./order";
import type { CartItem } from "./cart";

export interface CheckoutAddress {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: ShippingProvince;
  postal_code: string;
}

export interface CheckoutCreatePayload {
  address: CheckoutAddress;
  /** Cart items as stored (include imageDataUrl / imageDataUrls for server upload). */
  cart: CartItem[];
}

export interface CheckoutCreateResponse {
  redirectUrl: string;
  orderNumbers: string[];
  error?: string;
}
