import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

/**
 * POST /api/cart/identify
 *
 * Links a session (and its active cart) to a named customer.
 * Called when the user enters their email on the checkout form.
 * Upserts the customer row and backfills session + cart with customer_id.
 *
 * Fire-and-forget from the client — always returns 200.
 */
export async function POST(request: Request) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });

    const body = await request.json().catch(() => ({}));
    const { session_id, email, name, phone } = body as {
      session_id?: string;
      email?: string;
      name?: string;
      phone?: string;
    };

    if (!session_id || !email || typeof email !== "string") {
      return NextResponse.json({ ok: true });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Upsert customer by email
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          email: normalizedEmail,
          name: name?.trim() || undefined,
          phone: phone?.trim() || undefined,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (customerError || !customer) {
      console.error("cart/identify customer upsert error:", customerError?.message);
      return NextResponse.json({ ok: true });
    }

    const customerId = customer.id;

    // 2. Update session with customer_id
    await supabase
      .from("sessions")
      .update({ customer_id: customerId, last_seen_at: new Date().toISOString() })
      .eq("id", session_id);

    // 3. Update any active cart for this session with customer_id
    await supabase
      .from("carts")
      .update({ customer_id: customerId })
      .eq("session_id", session_id)
      .eq("status", "active");

    // 4. Log event
    await supabase.from("events").insert({
      type: "customer.identified",
      session_id,
      customer_id: customerId,
      payload: { email: normalizedEmail },
    });

    return NextResponse.json({ ok: true, customer_id: customerId });
  } catch (err) {
    console.error("cart/identify unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
