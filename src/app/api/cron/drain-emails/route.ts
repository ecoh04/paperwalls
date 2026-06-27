import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/send";
import { notifyOps } from "@/lib/alerts";
import { cronAuthorized } from "@/lib/cron-auth";
import { signedPrintUrl } from "@/lib/storage";
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

export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    await notifyOps({
      severity: "fatal",
      title:    "Email drainer failed to fetch queue",
      detail:   error.message,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Run the abandoned-cart marker on every drain so the function actually
  // gets called. Cheap, idempotent, no harm if called more often than
  // strictly needed.
  try {
    await supabaseAdmin.rpc("mark_abandoned_carts");
  } catch (err) {
    console.error("[cron drain-emails] mark_abandoned_carts failed:", err);
  }

  if (!rows || rows.length === 0) {
    // Heartbeat even when the queue was empty so the System Health panel
    // can show 'last drained X min ago' regardless of volume.
    await supabaseAdmin.from("events").insert({
      type:    "cron.drain_emails",
      payload: { drained: 0, sent: 0, failed: 0, skipped: 0 },
    });
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

        // Best-effort: sign the saved design preview at SEND time (private
        // bucket, no public URL). 7-day TTL covers the abandoned-cart window.
        // Any failure (no cart_id, no path, signing error) just sends the
        // email without the image — never blocks the send.
        let imagePreviewUrl: string | undefined;
        let cartKind: "wallpaper" | "sample" = "wallpaper";
        try {
          const meta = (row.metadata as Record<string, unknown> | null) ?? {};
          const cartId = typeof meta.cart_id === "string" ? meta.cart_id : null;
          if (cartId) {
            const { data: cart } = await supabaseAdmin
              .from("carts")
              .select("image_preview_path")
              .eq("id", cartId)
              .single();
            const path = cart?.image_preview_path as string | null | undefined;
            if (path) {
              imagePreviewUrl = await signedPrintUrl(path, 60 * 60 * 24 * 7);
            }
            // Word the email for what is actually in the cart: a sample pack has
            // no design, so the "we saved your design" copy must not apply to it.
            const { data: ci } = await supabaseAdmin
              .from("cart_items")
              .select("product_type")
              .eq("cart_id", cartId);
            const lines = (ci ?? []) as { product_type: string | null }[];
            if (lines.length > 0) {
              cartKind = lines.some((r) => r.product_type === "wallpaper") ? "wallpaper" : "sample";
            }
          }
        } catch (err) {
          console.warn("[cron drain-emails] abandoned-cart preview skipped:", err instanceof Error ? err.message : err);
        }

        const rendered = renderAbandonedCart({
          customer_name:     (customer.name as string) ?? "",
          resume_url:        `${baseUrl}/cart`,
          image_preview_url: imagePreviewUrl,
          kind:              cartKind,
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
        // Config skip (e.g. RESEND_API_KEY unset) is NOT a delivery attempt —
        // do not increment attempts, or a pre-launch period with no key would
        // silently exhaust MAX_ATTEMPTS and permanently dead-letter every
        // queued email before the key is ever wired. Record the reason only;
        // the row stays eligible so it sends once the key is configured.
        await supabaseAdmin
          .from("scheduled_emails")
          .update({
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

  // Heartbeat + alert if too many failed at once (drainer is borked).
  await supabaseAdmin.from("events").insert({
    type:    "cron.drain_emails",
    payload: { drained: rows.length, sent, failed, skipped },
  });
  if (failed >= 3 && failed >= rows.length / 2) {
    await notifyOps({
      severity: "fatal",
      title:    "Email drainer: most attempts failed",
      fields: { batch: rows.length, sent, failed, skipped },
    });
  }

  return NextResponse.json({ ok: true, drained: rows.length, sent, failed, skipped });
}

// Allow POST too — Vercel Cron uses GET, but a manual curl test is easier
// with POST when CRON_SECRET is the only auth.
export const POST = GET;
