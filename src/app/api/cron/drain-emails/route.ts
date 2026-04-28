import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/send";
import {
  renderOrderConfirmed,
  renderOrderShipped,
  renderOrderDelivered,
  renderAbandonedCart,
  type OrderEmailRow,
} from "@/lib/email/templates";

// Vercel Cron hits this every few minutes. We pull the next batch of pending
// emails whose send_at has passed, render the appropriate template, hand them
// to Resend, and mark each row sent / failed. A failed send increments
// attempts and gets retried on the next tick (capped at MAX_ATTEMPTS).
//
// Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
// when CRON_SECRET is configured in env. We require this so the route is not
// callable from the open internet.

const BATCH_SIZE   = 25;
const MAX_ATTEMPTS = 5;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const got      = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || got !== expected) return unauthorized();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Pull pending emails whose send_at has passed and that haven't exceeded
  // the retry cap. We don't lock the row — for low volume the chance of two
  // cron firings overlapping is negligible, and an idempotency_key still
  // protects against duplicates.
  const { data: rows, error } = await supabaseAdmin
    .from("scheduled_emails")
    .select("id, type, subject, customer_id, order_id, metadata, attempts")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .lt("attempts", MAX_ATTEMPTS)
    .order("send_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[cron drain-emails] fetch failed", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, drained: 0 });
  }

  let sent = 0, failed = 0, skipped = 0;

  for (const row of rows) {
    const rowId = row.id as string;
    const type  = row.type as string;
    const orderId = row.order_id as string | null;
    const customerId = row.customer_id as string | null;

    try {
      // Resolve the recipient + render template
      let toEmail: string | null = null;
      let subject = (row.subject as string) ?? "";
      let html = "";

      if (type === "order_confirmed" || type === "order_shipped" || type === "order_delivered") {
        if (!orderId) throw new Error(`order email ${type} missing order_id`);
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("order_number, customer_email, customer_name, total_cents, wall_count, total_sqm, wallpaper_style, application_method, product_type, tracking_number, courier_name, tracking_url")
          .eq("id", orderId)
          .single();
        if (!order) throw new Error(`order ${orderId} not found`);
        toEmail = order.customer_email as string;
        const o = order as unknown as OrderEmailRow;
        const rendered = type === "order_confirmed" ? renderOrderConfirmed(o)
                       : type === "order_shipped"   ? renderOrderShipped(o)
                       :                              renderOrderDelivered(o);
        subject = rendered.subject;
        html    = rendered.html;
      } else if (type === "abandoned_cart") {
        if (!customerId) throw new Error("abandoned_cart missing customer_id");
        const { data: customer } = await supabaseAdmin
          .from("customers")
          .select("email, name")
          .eq("id", customerId)
          .single();
        if (!customer) throw new Error(`customer ${customerId} not found`);
        toEmail = customer.email as string;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://paperwalls.co.za";
        const rendered = renderAbandonedCart({
          customer_name: (customer.name as string) ?? "",
          resume_url:    `${baseUrl}/cart`,
        });
        subject = rendered.subject;
        html    = rendered.html;
      } else {
        // review_request, win_back not implemented yet — skip cleanly.
        await supabaseAdmin
          .from("scheduled_emails")
          .update({ status: "cancelled", error: `Type ${type} not implemented` })
          .eq("id", rowId);
        skipped++;
        continue;
      }

      if (!toEmail) throw new Error("No recipient");

      const result = await sendEmail({ to: toEmail, subject, html });

      if ("skipped" in result) {
        await supabaseAdmin
          .from("scheduled_emails")
          .update({
            attempts:        (row.attempts as number) + 1,
            last_attempt_at: new Date().toISOString(),
            error:           result.reason,
          })
          .eq("id", rowId);
        skipped++;
      } else if (result.ok) {
        await supabaseAdmin
          .from("scheduled_emails")
          .update({
            status:          "sent",
            sent_at:         new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            attempts:        (row.attempts as number) + 1,
            error:           null,
            metadata:        { ...(row.metadata as Record<string, unknown> ?? {}), resend_id: result.id },
          })
          .eq("id", rowId);
        sent++;
      } else {
        const nextAttempts = (row.attempts as number) + 1;
        await supabaseAdmin
          .from("scheduled_emails")
          .update({
            status:          nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
            attempts:        nextAttempts,
            last_attempt_at: new Date().toISOString(),
            error:           result.error.slice(0, 500),
          })
          .eq("id", rowId);
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      const nextAttempts = (row.attempts as number) + 1;
      await supabaseAdmin
        .from("scheduled_emails")
        .update({
          status:          nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts:        nextAttempts,
          last_attempt_at: new Date().toISOString(),
          error:           msg.slice(0, 500),
        })
        .eq("id", rowId);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, drained: rows.length, sent, failed, skipped });
}

// Allow POST too — Vercel Cron uses GET, but a manual curl test is easier
// with POST when CRON_SECRET is the only auth.
export const POST = GET;
