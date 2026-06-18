import { NextResponse } from "next/server";
import type { CheckoutAddress } from "@/types/checkout";
import type { CartItem, WallpaperCartItem } from "@/types/cart";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { getShippingCents } from "@/lib/shipping";
import { uploadPrintImage, renamePrintFile } from "@/lib/storage";
import { buildPayfastFormFields } from "@/lib/payfast";
import { waitUntil } from "@vercel/functions";
import { sendMetaConversion } from "@/lib/meta/capi";
import { calculateSubtotalCents } from "@/lib/pricing";
import type { ShippingProvince } from "@/types/order";

// Sample-pack price is the canonical server-side number. Anything else from
// the client gets rejected. Mirrors src/app/samples/page.tsx.
const SAMPLE_PACK_PRICE_CENTS = 30_000;

// 1 cent rounding tolerance — the only difference we accept between the
// client's claimed subtotal and our server-side recompute.
const SUBTOTAL_TOLERANCE_CENTS = 1;

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
    const { address, cart, session_id, meta_event_id_init, fbp: bodyFbp, fbc: bodyFbc } = body as {
      address?: CheckoutAddress;
      cart?: CartItem[];
      session_id?: string;
      /** Pixel-side InitiateCheckout event_id to dedup the CAPI side against. */
      meta_event_id_init?: string;
      /** Real Meta _fbp/_fbc cookies for CAPI match quality. */
      fbp?: string;
      fbc?: string;
    };
    const fbp = bodyFbp?.trim() || null;
    const fbc = bodyFbc?.trim() || null;
    // Buyer's real IP, from THEIR request, stored on the order so the PayFast
    // webhook Purchase CAPI can use it (the webhook only sees PayFast's IP).
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

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
      image_quality: { level: string; pxPerMm: number; widthPx: number; heightPx: number } | null;
      wallpaper_type: string | null;
      wallpaper_style: string | null;
      application_method: string | null;
      subtotal_cents: number;
      shipping_cents: number;
      discount_cents: number;
      discount_code: string | null;
      total_cents: number;
      status: string;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      utm_content: string | null;
      fbclid: string | null;
      gclid: string | null;
      fbp: string | null;
      fbc: string | null;
      client_ip: string | null;
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

    // ── Server-side cart-price validation ────────────────────────────────────
    // Client sends `subtotalCents` per item, but we never trust it. Recompute
    // each item's subtotal from its spec on the server using lib/pricing. If
    // they don't match (within rounding), reject. Without this, a malicious
    // request could submit `subtotalCents: 1` and create a near-free order.
    //
    // CRITICAL: price off the wall GEOMETRY, not the client's `totalSqm`.
    // totalSqm can be forged independently of the dimensions/walls_spec we
    // actually print — a tiny sqm with full-size walls would otherwise pass
    // the price check while we print a full wall for almost nothing. We derive
    // coverage from the trusted geometry and reject if the client's totalSqm
    // doesn't match it (and reject out-of-range dimensions outright).
    const MIN_WALL_M = 0.1;   // 10 cm  — matches the configurator's input floor
    const MAX_WALL_M = 20;    // 2000 cm — matches the configurator's input ceiling
    const serverSqmFor = (item: WallpaperCartItem): number | null => {
      const walls = item.walls?.length
        ? item.walls
        : [{ widthM: item.widthM, heightM: item.heightM }];
      const count = item.walls?.length ? 1 : Math.max(1, item.wallCount ?? 1);
      let sqm = 0;
      for (const w of walls) {
        if (
          !Number.isFinite(w.widthM) || !Number.isFinite(w.heightM) ||
          w.widthM  < MIN_WALL_M || w.widthM  > MAX_WALL_M ||
          w.heightM < MIN_WALL_M || w.heightM > MAX_WALL_M
        ) return null;
        sqm += w.widthM * w.heightM;
      }
      return sqm * count;
    };

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i] as CartItem;

      let expected = 0;
      if (item.type === "sample_pack") {
        expected = SAMPLE_PACK_PRICE_CENTS * Math.max(1, item.quantity ?? 1);
      } else if (item.type === "wallpaper") {
        // Trust ONLY the spec (sqm + finish + install). Recompute price.
        if (!item.totalSqm || item.totalSqm <= 0 || !item.wallpaperType || !item.material || !item.application) {
          return NextResponse.json(
            { error: "Wallpaper item is missing size, finish, or install method." },
            { status: 400 }
          );
        }
        // Tie priced coverage to the geometry we will actually print.
        const geomSqm = serverSqmFor(item);
        if (geomSqm === null) {
          return NextResponse.json(
            { error: "Wall dimensions are out of range. Please re-check your sizes." },
            { status: 400 }
          );
        }
        // Generous tolerance (2% or 0.1 m²) so legitimate rounding never blocks
        // a real customer, but a forged totalSqm vs full-size walls is caught.
        const sqmTolerance = Math.max(0.1, geomSqm * 0.02);
        if (Math.abs(geomSqm - item.totalSqm) > sqmTolerance) {
          return NextResponse.json(
            { error: "Wall size doesn't match the dimensions entered. Please refresh and try again." },
            { status: 409 }
          );
        }
        expected = calculateSubtotalCents(
          item.totalSqm,
          item.wallpaperType,
          item.material,
          item.application
        );
      } else {
        return NextResponse.json(
          { error: "Unknown cart item type." },
          { status: 400 }
        );
      }

      if (Math.abs(expected - item.subtotalCents) > SUBTOTAL_TOLERANCE_CENTS) {
        // Hard reject — possible tampering or stale client price after a
        // pricing change. Don't fail soft (could leak revenue at launch
        // when prices are still being tweaked).
        return NextResponse.json(
          {
            error: "Cart prices have changed since you last loaded the page. Please refresh and try again.",
          },
          { status: 409 }
        );
      }
    }

    // ── Sample-pack credit (R150 off first wallpaper) ─────────────────────────
    // Marketing copy across the site promises "R150 credited to your wallpaper
    // order when you come back." Apply it server-side so the promise is kept
    // even if the customer didn't notice the discount line. One credit per
    // customer ever — keyed by email since customer_id may not yet exist for
    // first-time email captures.
    const SAMPLE_CREDIT_CENTS = 15_000;
    const SAMPLE_CREDIT_CODE  = "sample_credit";
    const hasWallpaperInCart = (cart as CartItem[]).some((it) => it.type === "wallpaper");
    let sampleCreditAvailable = 0;
    if (hasWallpaperInCart) {
      const [{ data: priorSamples }, { data: priorCreditUsed }] = await Promise.all([
        // Has the customer previously paid for a sample pack?
        supabase.from("orders")
          .select("id").eq("customer_email", customerFields.customer_email)
          .eq("product_type", "sample_pack").not("status", "in", "(pending,cancelled)")
          .is("refunded_at", null).is("deleted_at", null).limit(1),
        // Have they already redeemed the credit on a prior wallpaper order?
        supabase.from("orders")
          .select("id").eq("customer_email", customerFields.customer_email)
          .eq("discount_code", SAMPLE_CREDIT_CODE)
          .not("status", "eq", "cancelled").is("deleted_at", null).limit(1),
      ]);
      if ((priorSamples?.length ?? 0) > 0 && (priorCreditUsed?.length ?? 0) === 0) {
        sampleCreditAvailable = SAMPLE_CREDIT_CENTS;
      }
    }
    let sampleCreditApplied = false;

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i] as CartItem;
      const isFirst = i === 0;
      const itemShipping = isFirst ? shippingCents : 0;

      // Apply sample-credit to the first wallpaper item only. Cap at item
      // subtotal so we never produce a negative line total.
      let itemDiscount  = 0;
      let itemDiscountCode: string | null = null;
      if (
        item.type === "wallpaper" &&
        sampleCreditAvailable > 0 &&
        !sampleCreditApplied
      ) {
        itemDiscount = Math.min(sampleCreditAvailable, item.subtotalCents);
        itemDiscountCode = SAMPLE_CREDIT_CODE;
        sampleCreditApplied = true;
      }

      const totalCents = item.subtotalCents + itemShipping - itemDiscount;

      const baseRow = {
        ...customerFields,
        ...sessionAttribution,
        fbp,
        fbc,
        client_ip: clientIp,
        discount_cents: itemDiscount,
        discount_code:  itemDiscountCode,
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
          image_quality:      null,
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
        image_quality:      item.imageQuality ?? null,
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
          image_urls:    row.image_urls,
          walls_spec:    row.walls_spec,
          image_quality: row.image_quality,
          customer_id:   customerId,
          cart_id:       cartId,
          session_id:    session_id ?? null,
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

    // Positional safety. The image-rename and order_items loops below pair
    // insertedOrders[i] with orderRows[i]/cart[i] by array index, assuming
    // INSERT ... RETURNING preserved VALUES order. supabase-js sends a single
    // INSERT so this holds today, but a mismatch would attach the wrong print
    // file and spec to the wrong order_number — wrong art printed. Fail loudly
    // instead of silently corrupting the mapping. Orders are still 'pending'
    // (payment not started), so they age out via the stuck-pending path.
    const misaligned =
      (insertedOrders?.length ?? 0) !== orderRows.length ||
      (insertedOrders ?? []).some((o, i) => o.product_type !== orderRows[i]?.product_type);
    if (misaligned) {
      console.error(
        "[checkout/create] inserted order rows misaligned with input order; aborting before side effects",
        { inserted: insertedOrders?.length, expected: orderRows.length }
      );
      return NextResponse.json(
        { error: "We couldn't finalize your order. Please try again, or email hello@paperwalls.co.za." },
        { status: 500 }
      );
    }

    // Respond AS SOON AS the order exists — the buyer can pay immediately.
    // Redirect to PayFast's hosted page is our checkout (onsite modal was
    // evaluated and disabled: no Apple Pay, off-brand, slower, not
    // sandbox-testable). Everything below — file renames, the line-item
    // snapshot, analytics, customer stats, Meta CAPI — is non-essential to
    // paying, so it runs AFTER the response via waitUntil(): the serverless
    // function stays alive to finish it without delaying the redirect.
    const { url: payfastUrl, fields: payfastFields } = buildPayfastFormFields({
      orderNumbers,
      amountCents:   totalPaymentCents,
      customerName:  a.customer_name.trim(),
      customerEmail: a.customer_email.trim(),
      customerPhone: a.customer_phone.trim(),
    });

    const db = supabase;
    const createdOrders = insertedOrders ?? [];
    waitUntil((async () => {
      try {
        // Rename tmp uploads to orders/PW-XXXX-N.jpg (stable, searchable paths).
        // Non-fatal: files remain reachable via signedPrintUrl() on tmp paths.
        for (let i = 0; i < createdOrders.length; i++) {
          const o = createdOrders[i];
          const row = orderRows[i];
          if (row.product_type !== "wallpaper" || !row.image_urls?.length) continue;
          const renamed: string[] = [];
          for (let j = 0; j < row.image_urls.length; j++) {
            const toPath = `orders/${o.order_number}-${j}.jpg`;
            try { renamed.push(await renamePrintFile(row.image_urls[j], toPath)); }
            catch { renamed.push(row.image_urls[j]); }
          }
          const { error: renameDbError } = await db
            .from("orders")
            .update({ image_url: renamed[0], image_urls: renamed })
            .eq("id", o.id);
          if (renameDbError) {
            console.error(`[checkout/create] image path update failed for ${o.order_number}:`, renameDbError.message);
          }
        }

        // Line-item snapshot. The orders table is the source of truth; nothing
        // reads order_items downstream yet, so this is a future-facing copy.
        const orderItemRows = createdOrders.map((o, idx) => {
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
          const qty = Math.max(1, (o.quantity as number) ?? 1);
          return {
            order_id:         o.id,
            product_type:     o.product_type,
            quantity:         qty,
            unit_price_cents: Math.round((o.subtotal_cents as number) / qty),
            subtotal_cents:   o.subtotal_cents,
            spec,
          };
        });
        const { error: orderItemsError } = await db.from("order_items").insert(orderItemRows);
        if (orderItemsError) {
          console.error("[checkout/create] order_items insert failed:", orderItemsError.message);
        }

        if (cartId) {
          await db.from("carts").update({ status: "converted" }).eq("id", cartId);
        }

        await db.from("events").insert({
          type:        "order.created",
          session_id:  session_id ?? null,
          customer_id: customerId,
          cart_id:     cartId,
          payload: {
            order_numbers: orderNumbers,
            total_cents:   totalPaymentCents,
            item_count:    cart.length,
            utm_source:    sessionAttribution.utm_source,
          },
        });

        if (customerId) {
          await db.rpc("update_customer_stats", { p_customer_id: customerId });
        }

        // Meta CAPI: InitiateCheckout — shares event_id with the client pixel.
        if (meta_event_id_init) {
          const splitName = a.customer_name.trim().split(/\s+/);
          await sendMetaConversion({
            event_name: "InitiateCheckout",
            event_id:   meta_event_id_init,
            event_source_url: process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout`
              : undefined,
            user_data: {
              email:        a.customer_email.trim(),
              phone:        a.customer_phone.trim(),
              first_name:   splitName[0] ?? "",
              last_name:    splitName.slice(1).join(" "),
              city:         a.city,
              state:        a.province,
              zip:          a.postal_code,
              country_code: "ZA",
              external_id:  customerId,
              fbclid:       sessionAttribution.fbclid,
              fbp,
              fbc,
              client_ip:    clientIp,
              client_ua:    request.headers.get("user-agent") ?? null,
            },
            custom_data: {
              currency:     "ZAR",
              value:        createdOrders.reduce((s, o) => s + (o.subtotal_cents as number), 0) / 100,
              num_items:    cart.length,
              content_type: "product",
              content_ids:  cart.map((i) => (i.type === "sample_pack" ? "sample_pack" : "custom_wallpaper")),
            },
            meta: { customer_id: customerId ?? undefined },
          });
        }
      } catch (e) {
        console.error("[checkout/create] deferred post-order work failed:", e);
      }
    })());

    return NextResponse.json({ payfastUrl, payfastFields, orderNumbers });
  } catch (e) {
    console.error("Checkout create error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
