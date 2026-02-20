import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Stitch Express webhook: payment outcome.
 * Configure this URL in your Stitch dashboard (e.g. https://yoursite.com/api/webhooks/stitch).
 * Verify the webhook signature using Stitch/Svix docs before trusting the payload.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown> & {
      metadata?: { order_numbers?: string };
    };
    const paymentId =
      (body.paymentId as string) ??
      (body.id as string) ??
      (body.payment_id as string);
    const orderNumbersRaw = body.metadata?.order_numbers ?? body.order_numbers ?? body.orderNumbers;
    const orderNumbersStr = typeof orderNumbersRaw === "string" ? orderNumbersRaw : null;
    const status = (body.status ?? body.event ?? body.state) as string | undefined;
    const success =
      status === "success" ||
      status === "paid" ||
      status === "completed" ||
      status === "payment.completed";

    if (!orderNumbersStr || !success) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderNumbers = orderNumbersStr.split(",").map((s) => s.trim()).filter(Boolean);
    if (orderNumbers.length === 0 || !supabase) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "new",
        stripe_payment_id: paymentId ?? null,
      })
      .in("order_number", orderNumbers);

    if (error) {
      console.error("Webhook order update error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
