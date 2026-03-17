import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types/cart";

/**
 * POST /api/cart/sync
 *
 * Called from CartContext whenever the cart changes (debounced).
 * Upserts the session and active cart, then replaces cart_items with the
 * current client state (strip image data — only store printable spec).
 *
 * This is fire-and-forget from the client; always returns 200 so the
 * frontend is never blocked or errored by a backend issue.
 */
export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });

    const body = await request.json().catch(() => ({}));
    const { session_id, items, user_agent, referrer } = body as {
      session_id?: string;
      items?: CartItem[];
      user_agent?: string;
      referrer?: string;
    };

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json({ ok: true });
    }

    // 1. Upsert session (touch last_seen_at)
    const { error: sessionError } = await supabase
      .from("sessions")
      .upsert(
        {
          id: session_id,
          user_agent: user_agent ?? null,
          referrer: referrer ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (sessionError) {
      console.error("cart/sync session upsert error:", sessionError.message);
      return NextResponse.json({ ok: true });
    }

    // 2. Upsert active cart for this session
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("session_id", session_id)
      .eq("status", "active")
      .maybeSingle();

    let cartId: string;

    if (existingCart?.id) {
      cartId = existingCart.id;
      await supabase
        .from("carts")
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

    // 3. Replace cart_items with current client state
    //    Strip imageDataUrl / imageDataUrls (too large, not needed for recovery)
    if (Array.isArray(items)) {
      await supabase.from("cart_items").delete().eq("cart_id", cartId);

      if (items.length > 0) {
        const rows = items.map((item) => {
          const spec =
            item.type === "wallpaper"
              ? {
                  width_m: item.widthM,
                  height_m: item.heightM,
                  wall_count: item.wallCount,
                  total_sqm: item.totalSqm,
                  style: item.style,
                  application: item.application,
                  walls: item.walls ?? [],
                }
              : {};

          return {
            cart_id: cartId,
            product_type: item.type,
            quantity: item.type === "sample_pack" ? item.quantity : 1,
            unit_price_cents: item.subtotalCents,
            subtotal_cents: item.subtotalCents,
            spec,
            client_item_id: item.id,
          };
        });

        const { error: itemsError } = await supabase
          .from("cart_items")
          .insert(rows);

        if (itemsError) {
          console.error("cart/sync items insert error:", itemsError.message);
        }
      }

      // 4. Log event (only when cart has items to keep events table clean)
      if (items.length > 0) {
        const totalCents = items.reduce((s, i) => s + i.subtotalCents, 0);
        await supabase.from("events").insert({
          type: "cart.updated",
          session_id,
          cart_id: cartId,
          payload: { item_count: items.length, total_cents: totalCents },
        });
      }
    }

    return NextResponse.json({ ok: true, cart_id: cartId });
  } catch (err) {
    console.error("cart/sync unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
