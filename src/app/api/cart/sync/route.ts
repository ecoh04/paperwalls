import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import type { CartItem } from "@/types/cart";

/**
 * POST /api/cart/sync
 *
 * Called from CartContext whenever the cart changes (debounced ~900ms).
 * Upserts the session (including UTM attribution), upserts the active cart,
 * and replaces cart_items with the current client state.
 *
 * Image data is never stored here — only printable spec (dimensions, style, etc.).
 * Fire-and-forget from the client — always returns 200.
 */
export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });

    const body = await request.json().catch(() => ({}));
    const {
      session_id,
      items,
      user_agent,
      referrer,
      landing_page,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      gclid,
    } = body as {
      session_id?:   string;
      items?:        CartItem[];
      user_agent?:   string;
      referrer?:     string;
      landing_page?: string;
      utm_source?:   string;
      utm_medium?:   string;
      utm_campaign?: string;
      utm_content?:  string;
      utm_term?:     string;
      fbclid?:       string;
      gclid?:        string;
    };

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json({ ok: true });
    }

    // ── Upsert session with UTM attribution ───────────────────────────────────
    // Only set UTM fields if they have a value — this preserves the original
    // first-touch attribution if the user navigates without UTM params later.
    const sessionUpdate: Record<string, unknown> = {
      id:           session_id,
      last_seen_at: new Date().toISOString(),
    };

    if (user_agent)   sessionUpdate.user_agent   = user_agent;
    if (referrer)     sessionUpdate.referrer      = referrer;
    if (landing_page) sessionUpdate.landing_page  = landing_page;
    if (utm_source)   sessionUpdate.utm_source    = utm_source;
    if (utm_medium)   sessionUpdate.utm_medium    = utm_medium;
    if (utm_campaign) sessionUpdate.utm_campaign  = utm_campaign;
    if (utm_content)  sessionUpdate.utm_content   = utm_content;
    if (utm_term)     sessionUpdate.utm_term      = utm_term;
    if (fbclid)       sessionUpdate.fbclid        = fbclid;
    if (gclid)        sessionUpdate.gclid         = gclid;

    const { error: sessionError } = await supabase
      .from("sessions")
      .upsert(sessionUpdate, { onConflict: "id" });

    if (sessionError) {
      console.error("cart/sync session upsert error:", sessionError.message);
      return NextResponse.json({ ok: true });
    }

    // ── Upsert active cart ────────────────────────────────────────────────────
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", session_id)
      .eq("status", "active")
      .maybeSingle();

    let cartId: string;

    if (existingCart?.id) {
      cartId = existingCart.id;
      await supabase.from("carts")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", cartId);
    } else {
      const { data: newCart, error: cartError } = await supabase
        .from("carts")
        .insert({ session_id, status: "active" })
        .select("id")
        .single();

      if (cartError || !newCart) {
        console.error("cart/sync cart insert error:", cartError?.message);
        return NextResponse.json({ ok: true });
      }
      cartId = newCart.id;
    }

    // ── Replace cart_items ────────────────────────────────────────────────────
    if (Array.isArray(items)) {
      await supabase.from("cart_items").delete().eq("cart_id", cartId);

      if (items.length > 0) {
        const rows = items.map((item) => {
          const spec = item.type === "wallpaper"
            ? {
                width_m:     item.widthM,
                height_m:    item.heightM,
                wall_count:  item.wallCount,
                total_sqm:   item.totalSqm,
                wallpaperType: item.wallpaperType,
                material:      item.material,
                application:   item.application,
                walls:       item.walls ?? [],
              }
            : {};

          return {
            cart_id:         cartId,
            product_type:    item.type,
            quantity:        item.type === "sample_pack" ? item.quantity : 1,
            unit_price_cents: item.subtotalCents,
            subtotal_cents:  item.subtotalCents,
            spec,
            client_item_id:  item.id,
          };
        });

        const { error: itemsError } = await supabase
          .from("cart_items")
          .insert(rows);

        if (itemsError) {
          console.error("cart/sync items insert error:", itemsError.message);
        }
      }

      // Log cart.updated event (only when cart has items)
      if (items.length > 0) {
        const totalCents = items.reduce((s, i) => s + i.subtotalCents, 0);
        await supabase.from("events").insert({
          type:       "cart.updated",
          session_id,
          cart_id:    cartId,
          payload:    { item_count: items.length, total_cents: totalCents, utm_source },
        });
      }
    }

    return NextResponse.json({ ok: true, cart_id: cartId });
  } catch (err) {
    console.error("cart/sync unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
