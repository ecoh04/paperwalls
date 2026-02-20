import { NextResponse } from "next/server";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import { supabase } from "@/lib/supabase";
import { getShippingCents } from "@/lib/shipping";
import { createStitchPayment } from "@/lib/stitch";
import { uploadPrintImage } from "@/lib/storage";
import type { ShippingProvince } from "@/types/order";

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `PW-${date}-${id}`;
}

function validateProvince(p: string): p is ShippingProvince {
  const provinces: ShippingProvince[] = [
    "gauteng", "western_cape", "kwaZulu_natal", "eastern_cape", "free_state",
    "limpopo", "mpumalanga", "northern_cape", "north_west", "other",
  ];
  return provinces.includes(p as ShippingProvince);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, cart } = body as { address?: CheckoutAddress; cart?: CartItem[] };

    if (!address || !cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Missing address or cart." },
        { status: 400 }
      );
    }

    const a = address as CheckoutAddress;
    if (
      !a.customer_name?.trim() ||
      !a.customer_email?.trim() ||
      !a.customer_phone?.trim() ||
      !a.address_line1?.trim() ||
      !a.city?.trim() ||
      !a.postal_code?.trim() ||
      !validateProvince(a.province)
    ) {
      return NextResponse.json(
        { error: "Please fill in all required address fields." },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error. Please try again later." },
        { status: 503 }
      );
    }

    const shippingCents = getShippingCents(a.province as ShippingProvince);
    const orderNumbers: string[] = [];
    const orderRows: {
      order_number: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      province: string;
      postal_code: string;
      wall_width_m: number;
      wall_height_m: number;
      wall_count: number;
      total_sqm: number;
      image_url: string;
      image_urls: string[];
      walls_spec: { widthM: number; heightM: number }[] | null;
      wallpaper_style: string;
      application_method: string;
      subtotal_cents: number;
      shipping_cents: number;
      total_cents: number;
      status: string;
      stripe_payment_id: string | null;
    }[] = [];

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i] as CartItem;
      const images = item.imageDataUrls?.length
        ? item.imageDataUrls
        : item.imageDataUrl
          ? [item.imageDataUrl]
          : [];
      if (images.length === 0) {
        return NextResponse.json(
          { error: "One or more cart items are missing an image. Please go back and add your design." },
          { status: 400 }
        );
      }

      const orderNumber = generateOrderNumber();
      orderNumbers.push(orderNumber);

      const urls: string[] = [];
      for (let j = 0; j < images.length; j++) {
        const path = `${orderNumber}-${j}.jpg`;
        const url = await uploadPrintImage(images[j], path);
        urls.push(url);
      }

      const isFirst = i === 0;
      const itemShipping = isFirst ? shippingCents : 0;
      const totalCents = item.subtotalCents + itemShipping;

      const wallWidth = item.walls?.[0]?.widthM ?? item.widthM;
      const wallHeight = item.walls?.[0]?.heightM ?? item.heightM;
      const wallsSpec =
        item.walls?.length && item.walls.length > 0
          ? item.walls.map((w) => ({ widthM: w.widthM, heightM: w.heightM }))
          : null;

      orderRows.push({
        order_number: orderNumber,
        customer_name: a.customer_name.trim(),
        customer_email: a.customer_email.trim(),
        customer_phone: a.customer_phone.trim(),
        address_line1: a.address_line1.trim(),
        address_line2: a.address_line2?.trim() || null,
        city: a.city.trim(),
        province: a.province,
        postal_code: a.postal_code.trim(),
        wall_width_m: wallWidth,
        wall_height_m: wallHeight,
        wall_count: item.wallCount,
        total_sqm: item.totalSqm,
        image_url: urls[0],
        image_urls: urls,
        walls_spec: wallsSpec,
        wallpaper_style: item.style,
        application_method: item.application,
        subtotal_cents: item.subtotalCents,
        shipping_cents: itemShipping,
        total_cents: totalCents,
        status: "pending",
        stripe_payment_id: null,
      });
    }

    const { error: insertError } = await supabase.from("orders").insert(
      orderRows.map((row) => ({
        ...row,
        image_urls: row.image_urls,
        walls_spec: row.walls_spec,
      }))
    );

    if (insertError) {
      console.error("Orders insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: 500 }
      );
    }

    const totalPaymentCents = orderRows.reduce((s, r) => s + r.total_cents, 0);
    const { redirectUrl } = await createStitchPayment({
      amountCents: totalPaymentCents,
      orderNumbers,
      reference: orderNumbers[0],
      payerName: a.customer_name.trim(),
      payerEmailAddress: a.customer_email.trim(),
      payerPhoneNumber: a.customer_phone.trim(),
    });

    return NextResponse.json({ redirectUrl, orderNumbers });
  } catch (e) {
    console.error("Checkout create error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
