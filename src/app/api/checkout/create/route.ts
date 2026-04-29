import { NextResponse } from "next/server";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getShippingCents } from "@/lib/shipping";
import { uploadPrintImage, renamePrintFile } from "@/lib/storage";
import { buildPayfastFormFields } from "@/lib/payfast";
import { sendMetaConversion } from "@/lib/meta/capi";
import type { ShippingProvince } from "@/types/order";

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
    const { address, cart, session_id, meta_event_id_init } = body as {
      address?: CheckoutAddress;
      cart?: CartItem[];
      session_id?: string;
      /** Pixel-side InitiateCheckout event_id to dedup the CAPI side against. */
      meta_event_id_init?: string;
    };

    if (!address || !cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Missing address or cart." }, { status: 400 });
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

    // ── Resolve UTM attribution from session ──────────────────────────────────
    // Snapshot UTM data onto each order so revenue attribution is permanent
    // even if the session row is later cleaned up.
    let sessionAttribution: {
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
      fbclid: string | null;
      gclid: string | null;
    } = {
      utm_source: null, utm_medium: null, utm_campaign: null,
      utm_content: null, fbclid: null, gclid: null,
    };

    if (session_id) {
      try {
        const { data: sessionRow } = await supabase
          .from("sessions")
          .select("utm_source, utm_medium, utm_campaign, utm_content, fbclid, gclid")
          .eq("id", session_id)
          .maybeSingle();
        if (sessionRow) {
          sessionAttribution = {
            utm_source:   sessionRow.utm_source   ?? null,
            utm_medium:   sessionRow.utm_medium   ?? null,
            utm_campaign: sessionRow.utm_campaign ?? null,
            utm_content:  sessionRow.utm_content  ?? null,
            fbclid:       sessionRow.fbclid       ?? null,
            gclid:        sessionRow.gclid        ?? null,
          };
        }
      } catch {
        // Non-fatal: attribution just won't be on orders
      }
    }

    // ── Build order rows ──────────────────────────────────────────────────────
    // order_number is DB-generated via sequence (PW-1001, PW-1002 …).
    // We do NOT pass order_number — the DB DEFAULT handles it.
    type OrderRow = {
      product_type: string;
      quantity: number;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      province: string;
      postal_code: string;
      wall_width_m: number | null;
      wall_height_m: number | null;
      wall_count: number;
      total_sqm: number | null;
      image_url: string | null;
      image_urls: string[];
      walls_spec: { widthM: number; heightM: number }[] | null;
      wallpaper_type: string | null;
      wallpaper_style: string | null;
      application_method: string | null;
      subtotal_cents: number;
      shipping_cents: number;
      discount_cents: number;
      total_cents: number;
      status: string;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
      fbclid: string | null;
      gclid: string | null;
    };

    const orderRows: OrderRow[] = [];

    const customerFields = {
      customer_name:  a.customer_name.trim(),
      customer_email: a.customer_email.trim(),
      customer_phone: a.customer_phone.trim(),
      address_line1:  a.address_line1.trim(),
      address_line2:  a.address_line2?.trim() || null,
      city:           a.city.trim(),
      province:       a.province,
      postal_code:    a.postal_code.trim(),
    };

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i] as CartItem;
      const isFirst = i === 0;
      const itemShipping = isFirst ? shippingCents : 0;
      const totalCents = item.subtotalCents + itemShipping;

      const baseRow = {
        ...customerFields,
        ...sessionAttribution,
        discount_cents: 0,
        subtotal_cents: item.subtotalCents,
        shipping_cents: itemShipping,
        total_cents:    totalCents,
        status:         "pending",
      };

      // ── Sample swatch pack ─────────────────────────────────────────────────
      if (item.type === "sample_pack") {
        orderRows.push({
          ...baseRow,
          product_type:       "sample_pack",
          quantity:           item.quantity,
          wall_count:         1,
          wall_width_m:       null,
          wall_height_m:      null,
          total_sqm:          null,
          image_url:          null,
          image_urls:         [],
          walls_spec:         null,
          wallpaper_type:     null,
          wallpaper_style:    null,
          application_method: null,
        });
        continue;
      }

      // ── Custom wallpaper: upload image(s) then build row ───────────────────
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

      // Upload to a tmp path keyed by a fresh UUID so concurrent checkouts can't collide.
      // We rename to orders/PW-XXXX-N.jpg below, after the DB hands back order_number.
      const uploadId = crypto.randomUUID();
      const urls: string[] = [];
      for (let j = 0; j < images.length; j++) {
        const path = `tmp/${uploadId}-${j}.jpg`;
        const stored = await uploadPrintImage(images[j], path);
        urls.push(stored);
      }

      const wallWidth  = item.walls?.[0]?.widthM  ?? item.widthM;
      const wallHeight = item.walls?.[0]?.heightM ?? item.heightM;
      const wallsSpec  = item.walls?.length
        ? item.walls.map((w) => ({ widthM: w.widthM, heightM: w.heightM }))
        : null;

      orderRows.push({
        ...baseRow,
        product_type:       "wallpaper",
        quantity:           1,
        wall_count:         item.wallCount,
        wall_width_m:       wallWidth,
        wall_height_m:      wallHeight,
        total_sqm:          item.totalSqm,
        image_url:          urls[0],
        image_urls:         urls,
        walls_spec:         wallsSpec,
        wallpaper_type:     item.wallpaperType,
        wallpaper_style:    item.material,
        application_method: item.application,
      });
    }

    // ── Upsert customer ───────────────────────────────────────────────────────
    let customerId: string | null = null;
    try {
      const { data: customer } = await supabase
        .from("customers")
        .upsert(
          {
            email:          a.customer_email.trim().toLowerCase(),
            name:           a.customer_name.trim(),
            phone:          a.customer_phone.trim(),
            // Only set marketing_source if this is a new customer (don't overwrite first-touch)
            ...(sessionAttribution.utm_source
              ? { marketing_source: sessionAttribution.utm_source }
              : {}),
            last_seen_at:   new Date().toISOString(),
            updated_at:     new Date().toISOString(),
          },
          { onConflict: "email", ignoreDuplicates: false }
        )
        .select("id, marketing_source")
        .single();
      customerId = customer?.id ?? null;
    } catch {
      // Non-fatal
    }

    // ── Resolve active cart ───────────────────────────────────────────────────
    let cartId: string | null = null;
    if (session_id) {
      try {
        const { data: activeCart } = await supabase
          .from("carts")
          .select("id")
          .eq("session_id", session_id)
          .eq("status", "active")
          .maybeSingle();
        cartId = activeCart?.id ?? null;

        if (customerId) {
          await supabase.from("sessions")
            .update({ customer_id: customerId })
            .eq("id", session_id);
          if (cartId) {
            await supabase.from("carts")
              .update({ customer_id: customerId })
              .eq("id", cartId);
          }
        }
      } catch {
        // Non-fatal
      }
    }

    // ── Insert orders (DB generates order_number via sequence) ────────────────
    const { data: insertedOrders, error: insertError } = await supabase
      .from("orders")
      .insert(
        orderRows.map((row) => ({
          ...row,
          image_urls:  row.image_urls,
          walls_spec:  row.walls_spec,
          customer_id: customerId,
          cart_id:     cartId,
          session_id:  session_id ?? null,
        }))
      )
      .select("id, order_number, product_type, quantity, subtotal_cents, total_cents");

    if (insertError) {
      console.error("Orders insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message?.includes("row-level security")
          ? "Database permission error. Check Supabase RLS policies on orders."
          : "Failed to create order. Please try again." },
        { status: 500 }
      );
    }

    // order_numbers now come from DB (PW-1001 etc.)
    const orderNumbers = (insertedOrders ?? []).map((o) => o.order_number as string);
    const totalPaymentCents = (insertedOrders ?? []).reduce(
      (s, o) => s + (o.total_cents as number), 0
    );

    // ── Rename tmp uploads to orders/PW-XXXX-N.jpg ────────────────────────────
    // Stable, traceable paths so the print team / admin search can find files
    // by order number alone. Failure here is non-fatal — the row still has the
    // tmp path and the file is reachable via signedPrintUrl().
    if (insertedOrders?.length) {
      for (let i = 0; i < insertedOrders.length; i++) {
        const o = insertedOrders[i];
        const row = orderRows[i];
        if (row.product_type !== "wallpaper" || !row.image_urls?.length) continue;

        const renamed: string[] = [];
        for (let j = 0; j < row.image_urls.length; j++) {
          const fromPath = row.image_urls[j];
          const toPath   = `orders/${o.order_number}-${j}.jpg`;
          try {
            renamed.push(await renamePrintFile(fromPath, toPath));
          } catch {
            renamed.push(fromPath);
          }
        }

        try {
          await supabase
            .from("orders")
            .update({ image_url: renamed[0], image_urls: renamed })
            .eq("id", o.id);
        } catch {
          // Non-fatal: the tmp path still works
        }
      }
    }

    // ── Insert order_items ────────────────────────────────────────────────────
    if (insertedOrders?.length) {
      try {
        const orderItemRows = insertedOrders.map((o, idx) => {
          const cartItem = cart[idx];
          const spec = cartItem?.type === "wallpaper"
            ? {
                width_m:    cartItem.widthM,
                height_m:   cartItem.heightM,
                wall_count: cartItem.wallCount,
                total_sqm:  cartItem.totalSqm,
                wallpaperType: cartItem.wallpaperType,
                material:      cartItem.material,
                application:   cartItem.application,
                walls:      cartItem.walls ?? [],
              }
            : {};
          return {
            order_id:        o.id,
            product_type:    o.product_type,
            quantity:        o.quantity,
            unit_price_cents: o.subtotal_cents,
            subtotal_cents:  o.subtotal_cents,
            spec,
          };
        });
        await supabase.from("order_items").insert(orderItemRows);
      } catch {
        // Non-fatal
      }
    }

    // order_confirmed email is queued by the PayFast webhook after payment is
    // confirmed. Don't queue here — sending "your order is confirmed" before
    // the customer actually paid would be wrong.

    // ── Fire-and-forget side effects ──────────────────────────────────────────
    if (cartId) {
      void supabase.from("carts").update({ status: "converted" }).eq("id", cartId);
    }

    if (insertedOrders?.length) {
      void supabase.from("events").insert({
        type:        "order.created",
        session_id:  session_id ?? null,
        customer_id: customerId,
        cart_id:     cartId,
        payload: {
          order_numbers:   orderNumbers,
          total_cents:     totalPaymentCents,
          item_count:      cart.length,
          utm_source:      sessionAttribution.utm_source,
        },
      });
    }

    if (customerId) {
      void supabase.rpc("update_customer_stats", { p_customer_id: customerId });
    }

    // Meta Conversions API: InitiateCheckout (mirrors the client pixel via
    // the shared event_id passed through from the form). Fire-and-forget.
    if (meta_event_id_init) {
      const splitName = a.customer_name.trim().split(/\s+/);
      const firstName = splitName[0] ?? "";
      const lastName  = splitName.slice(1).join(" ");
      void sendMetaConversion({
        event_name: "InitiateCheckout",
        event_id:   meta_event_id_init,
        event_source_url: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout`
          : undefined,
        user_data: {
          email:        a.customer_email.trim(),
          phone:        a.customer_phone.trim(),
          first_name:   firstName,
          last_name:    lastName,
          city:         a.city,
          state:        a.province,
          zip:          a.postal_code,
          country_code: "ZA",
          external_id:  customerId,
          fbclid:       sessionAttribution.fbclid,
          client_ip:    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          client_ua:    request.headers.get("user-agent") ?? null,
        },
        custom_data: {
          currency:  "ZAR",
          value:     totalPaymentCents / 100,
          num_items: cart.length,
        },
        meta: { customer_id: customerId ?? undefined },
      });
    }

    const { url: payfastUrl, fields: payfastFields } = buildPayfastFormFields({
      orderNumbers,
      amountCents:   totalPaymentCents,
      customerName:  a.customer_name.trim(),
      customerEmail: a.customer_email.trim(),
      customerPhone: a.customer_phone.trim(),
    });

    return NextResponse.json({ payfastUrl, payfastFields, orderNumbers });
  } catch (e) {
    console.error("Checkout create error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
