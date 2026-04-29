import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/send";
import { renderAdminNewOrder } from "@/lib/email/templates";
import { sendMetaConversion } from "@/lib/meta/capi";
import {
  formatPayfastAmount,
  generatePayfastSignature,
  getPayfastHost,
  pfUrlEncode,
} from "@/lib/payfast";

/**
 * PayFast ITN (Instant Transaction Notification) handler.
 *
 * Called by PayFast after every payment attempt — both onsite modal and
 * redirect flow. This is the ONLY place we mark orders as paid and record
 * the gateway_payment_id. The client-side modal callback is not trusted.
 *
 * Security checks per docs:
 *   1. Signature matches (MD5 of all fields + passphrase)
 *   2. merchant_id matches our env
 *   3. amount_gross matches our expected total (within R0.01)
 *   4. Server-side validation via https://{pfHost}/eng/query/validate
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const params  = new URLSearchParams(rawBody);

    const pfData: Record<string, string> = {};
    params.forEach((value, key) => { pfData[key] = value; });

    const merchantIdEnv = process.env.PAYFAST_MERCHANT_ID?.trim() ?? "";
    const passphrase    = process.env.PAYFAST_PASSPHRASE?.trim() ?? null;

    if (!merchantIdEnv) {
      console.error("[PayFast ITN] PAYFAST_MERCHANT_ID not set");
      return NextResponse.json({ error: "Misconfigured" }, { status: 200 });
    }

    // ── 1. Rebuild parameter string for signature & validate ─────────────────
    // PHP docs use `break` when hitting 'signature', effectively stopping at it.
    // Since 'signature' is always last in the payload this equals "skip signature".
    // We match that: skip 'signature', preserve order from the POST body.
    // Use pfUrlEncode (PHP urlencode equivalent) to match PayFast's encoding.
    let pfParamString = "";
    params.forEach((value, key) => {
      if (key === "signature") return;
      pfParamString += `${key}=${pfUrlEncode(value)}&`;
    });
    if (pfParamString.endsWith("&")) {
      pfParamString = pfParamString.slice(0, -1);
    }

    // ── 2. Verify signature ───────────────────────────────────────────────────
    const signatureProvided = pfData["signature"] ?? "";
    const baseData: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key === "signature") return;
      baseData[key] = value;
    });
    const expectedSignature = generatePayfastSignature(baseData, passphrase);

    if (!signatureProvided || signatureProvided !== expectedSignature) {
      console.error("[PayFast ITN] Invalid signature", {
        provided: signatureProvided,
        expected: expectedSignature,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 200 });
    }

    // ── 3. Verify merchant_id ─────────────────────────────────────────────────
    if ((pfData["merchant_id"] ?? "") !== merchantIdEnv) {
      console.error("[PayFast ITN] merchant_id mismatch", pfData["merchant_id"]);
      return NextResponse.json({ error: "Invalid merchant" }, { status: 200 });
    }

    const paymentStatus  = pfData["payment_status"] ?? "";
    const pfPaymentId    = pfData["pf_payment_id"]  ?? null;
    const orderNumbersStr = pfData["custom_str1"] || pfData["m_payment_id"] || "";
    const orderNumbers   = orderNumbersStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!orderNumbers.length) {
      console.error("[PayFast ITN] Missing order numbers in payload");
      return NextResponse.json({ error: "No order reference" }, { status: 200 });
    }

    if (!supabase) {
      console.error(
        "[PayFast ITN] Supabase service role not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env"
      );
      return NextResponse.json({ error: "Server misconfigured" }, { status: 200 });
    }

    // ── 4. Verify amount ──────────────────────────────────────────────────────
    const amountGross = parseFloat(pfData["amount_gross"] ?? "0");

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("order_number, total_cents, status")
      .in("order_number", orderNumbers);

    if (ordersError || !orders || orders.length === 0) {
      console.error("[PayFast ITN] Orders lookup failed", ordersError);
      return NextResponse.json({ error: "No matching orders" }, { status: 200 });
    }

    const expectedCents  = orders.reduce((sum, row) => sum + (row.total_cents as number), 0);
    const expectedAmount = parseFloat(formatPayfastAmount(expectedCents));

    if (Math.abs(expectedAmount - amountGross) > 0.01) {
      console.error("[PayFast ITN] Amount mismatch", { expectedAmount, amountGross });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 200 });
    }

    // ── 5. Server-side validation via PayFast ────────────────────────────────
    const pfHost      = getPayfastHost();
    const validateRes = await fetch(`https://${pfHost}/eng/query/validate`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    pfParamString,
    });
    const validateBody = (await validateRes.text()).trim();

    if (!validateBody.toUpperCase().includes("VALID")) {
      console.error("[PayFast ITN] Server validation failed", validateBody);
      return NextResponse.json({ error: "Remote validation failed" }, { status: 200 });
    }

    // ── All checks passed ─────────────────────────────────────────────────────
    if (paymentStatus === "COMPLETE") {

      // Upsert payment record. PayFast sometimes redelivers ITN pings; the
      // unique index on gateway_payment_id makes this idempotent.
      let paymentId: string | null = null;
      if (pfPaymentId) {
        const { data: paymentRow, error: paymentUpsertError } = await supabase
          .from("payments")
          .upsert(
            {
              gateway:            "payfast",
              gateway_payment_id: pfPaymentId,
              status:             "paid",
              amount_cents:       Math.round(amountGross * 100),
              currency:           "ZAR",
              order_numbers:      orderNumbers,
              raw_payload:        pfData,
              updated_at:         new Date().toISOString(),
            },
            { onConflict: "gateway_payment_id" }
          )
          .select("id")
          .single();

        if (paymentUpsertError) {
          console.error("[PayFast ITN] Payment upsert error", paymentUpsertError.message);
        }
        paymentId = paymentRow?.id ?? null;
      }

      // Mark orders paid and link to the payments row
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status:     "new",
          payment_id: paymentId,
        })
        .in("order_number", orderNumbers)
        .eq("status", "pending");

      if (updateError) {
        console.error("[PayFast ITN] Orders update error", updateError.message);
        return NextResponse.json({ error: "Update failed" }, { status: 200 });
      }

      // Queue order_confirmed email and update customer stats. Use the full
      // (id, customer_id) row so we can attach order_id to the queued email.
      const { data: paidRows } = await supabase
        .from("orders")
        .select("id, order_number, customer_id")
        .in("order_number", orderNumbers);

      const customerId = paidRows?.[0]?.customer_id ?? null;

      if (paidRows?.length && customerId) {
        // Idempotency key per (order_id, type) so a redelivered ITN can't queue duplicates.
        const emailRows = paidRows.map((o) => ({
          customer_id:     customerId,
          order_id:        o.id,
          type:            "order_confirmed",
          status:          "pending",
          send_at:         new Date().toISOString(),
          subject:         `Your PaperWalls order ${o.order_number} is confirmed`,
          idempotency_key: `order_confirmed:${o.id}`,
          metadata:        { order_number: o.order_number, pf_payment_id: pfPaymentId },
        }));

        const { error: emailError } = await supabase
          .from("scheduled_emails")
          .upsert(emailRows, { onConflict: "idempotency_key", ignoreDuplicates: true });
        if (emailError) {
          console.error("[PayFast ITN] Email queue error", emailError.message);
        }

        void supabase.rpc("update_customer_stats", { p_customer_id: customerId });
      }

      // Log analytics event
      void supabase.from("events").insert({
        type:    "payment.completed",
        payload: {
          gateway:            "payfast",
          gateway_payment_id: pfPaymentId,
          amount_cents:       Math.round(amountGross * 100),
          order_numbers:      orderNumbers,
        },
      });

      // Admin new-order alert. Fire synchronously (not via the cron queue) so
      // the operator sees real orders within seconds, not 5 minutes. If Resend
      // is down we log and move on; the order is already saved.
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
                      || process.env.EMAIL_REPLY_TO?.trim()
                      || "";
      if (adminEmail && paidRows?.length) {
        const { data: firstOrder } = await supabase
          .from("orders")
          .select("customer_name, customer_email, customer_phone, city, province")
          .eq("id", paidRows[0].id)
          .maybeSingle();
        if (firstOrder) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
          const adminUrl = baseUrl
            ? `${baseUrl}/admin/orders/${paidRows[0].id}`
            : `/admin/orders/${paidRows[0].id}`;
          const rendered = renderAdminNewOrder({
            order_numbers:  orderNumbers,
            total_cents:    Math.round(amountGross * 100),
            customer_name:  (firstOrder.customer_name as string)  ?? "",
            customer_email: (firstOrder.customer_email as string) ?? "",
            customer_phone: (firstOrder.customer_phone as string) ?? "",
            city:           (firstOrder.city as string)           ?? "",
            province:       (firstOrder.province as string)       ?? "",
            pf_payment_id:  pfPaymentId,
            admin_url:      adminUrl,
          });
          const result = await sendEmail({ to: adminEmail, subject: rendered.subject, html: rendered.html });
          if ("ok" in result && !result.ok) {
            console.error("[PayFast ITN] Admin alert failed:", result.error);
          }
        }
      } else if (!adminEmail) {
        console.warn("[PayFast ITN] ADMIN_NOTIFICATION_EMAIL not set — skipping admin alert");
      }

      // ── Meta Conversions API: Purchase ───────────────────────────────
      // Deterministic event_id derived from the (sorted) order numbers so
      // it matches the pixel-side Purchase fired on /checkout/success.
      // Fire-and-forget; CAPI failure must not block ITN ack.
      if (paidRows?.length) {
        const orderId   = paidRows[0].id as string;
        const customerId = (paidRows[0].customer_id as string | null) ?? null;
        const { data: orderForCapi } = await supabase
          .from("orders")
          .select("customer_name, customer_email, customer_phone, city, province, postal_code, utm_source, fbclid, session_id")
          .eq("id", orderId)
          .maybeSingle();
        const splitName = (orderForCapi?.customer_name ?? "").trim().split(/\s+/);
        const firstName = splitName[0] ?? "";
        const lastName  = splitName.slice(1).join(" ");
        let userAgent: string | null = null;
        if (orderForCapi?.session_id) {
          const { data: sess } = await supabase
            .from("sessions")
            .select("user_agent")
            .eq("id", orderForCapi.session_id)
            .maybeSingle();
          userAgent = (sess?.user_agent as string | null) ?? null;
        }
        const sortedNumbers = [...orderNumbers].sort();
        void sendMetaConversion({
          event_name: "Purchase",
          event_id:   `purchase:${sortedNumbers.join(",")}`,
          event_source_url: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orders=${orderNumbers.join(",")}`
            : undefined,
          user_data: {
            email:        orderForCapi?.customer_email,
            phone:        orderForCapi?.customer_phone,
            first_name:   firstName,
            last_name:    lastName,
            city:         orderForCapi?.city,
            state:        orderForCapi?.province,
            zip:          orderForCapi?.postal_code,
            country_code: "ZA",
            external_id:  customerId,
            fbclid:       (orderForCapi?.fbclid as string | null) ?? null,
            client_ua:    userAgent,
          },
          custom_data: {
            currency:    "ZAR",
            value:       amountGross,
            content_ids: orderNumbers,
            content_type: "product",
            num_items:   orderNumbers.length,
            order_id:    sortedNumbers.join(","),
          },
          meta: { order_id: orderId, customer_id: customerId ?? undefined },
        });
      }

      console.log(`[PayFast ITN] ✓ Payment ${pfPaymentId} confirmed for orders: ${orderNumbers.join(", ")}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[PayFast ITN] Unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 200 });
  }
}
