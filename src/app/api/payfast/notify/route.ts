import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/send";
import { renderAdminNewOrder, renderOrderConfirmed, type OrderEmailRow } from "@/lib/email/templates";
import { sendMetaConversion } from "@/lib/meta/capi";
import { notifyOps } from "@/lib/alerts";
import { extractClientIp, isPayfastIp } from "@/lib/payfast-ip";
import {
  formatPayfastAmount,
  generatePayfastSignature,
  getPayfastHost,
  md5ParamString,
  pfUrlEncode,
} from "@/lib/payfast";

/**
 * PayFast ITN (Instant Transaction Notification) handler.
 *
 * Called by PayFast after every payment attempt — both onsite modal and
 * redirect flow. This is the ONLY place we mark orders as paid and record
 * the gateway_payment_id. The client-side modal callback is not trusted.
 *
 * Five mandatory security checks per the PayFast spec:
 *   1. Source IP is in PayFast's allowlist (DNS-resolved + AWS range)
 *   2. Signature matches (MD5 of all fields + passphrase)
 *   3. merchant_id matches our env
 *   4. amount_gross matches our expected total (within R0.01)
 *   5. Server-side validation via https://{pfHost}/eng/query/validate
 *
 * HTTP response policy:
 *   - 200 on accepted (and on rejected-as-unauthentic — we don't want
 *     PayFast retrying a forgery)
 *   - 5xx on transient internal errors (DB unavailable, env missing) so
 *     PayFast retries the ITN
 */
export async function POST(request: Request) {
  const clientIp = extractClientIp(request.headers);
  let rawBody = "";

  try {
    rawBody = await request.text();
    const params = new URLSearchParams(rawBody);

    const pfData: Record<string, string> = {};
    params.forEach((value, key) => { pfData[key] = value; });

    const merchantIdEnv = process.env.PAYFAST_MERCHANT_ID?.trim() ?? "";
    const passphrase    = process.env.PAYFAST_PASSPHRASE?.trim() ?? null;

    if (!merchantIdEnv) {
      // Server misconfiguration — return 5xx so PayFast retries once we fix it.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN: PAYFAST_MERCHANT_ID env var is not set",
        detail:   "ITN endpoint can't validate notifications without the merchant id. Set it in Vercel env vars and redeploy.",
      });
      return NextResponse.json({ error: "Misconfigured" }, { status: 503 });
    }

    // ── 0. Source IP allowlist (PayFast spec security check #4) ──────────────
    // Reject anything that isn't from a known PayFast IP. Returns 200 so
    // we never retry a forgery — but logs to ops because if our IP list is
    // stale we want to know.
    const ipAllowed = await isPayfastIp(clientIp);
    if (!ipAllowed) {
      await notifyOps({
        severity: "warn",
        title:    "PayFast ITN from non-allowlisted source IP",
        fields:   {
          client_ip:     clientIp || "(empty)",
          pf_payment_id: pfData["pf_payment_id"] ?? "",
          m_payment_id:  pfData["m_payment_id"] ?? "",
          amount_gross:  pfData["amount_gross"] ?? "",
        },
        detail: `Body preview: ${rawBody.slice(0, 200)}`,
      });
      return NextResponse.json({ error: "Source IP not recognised" }, { status: 200 });
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
    // PayFast computes the ITN signature over ALL posted fields (in order,
    // INCLUDING empty ones like custom_str2=). So the authoritative check is
    // md5(pfParamString [+ passphrase]) — pfParamString already includes empty
    // fields. We also accept the skip-empties variant (generatePayfastSignature)
    // as a defensive fallback. A forgery matches neither; and step 5 (remote
    // /validate) is the ultimate guard regardless.
    const signatureProvided = pfData["signature"] ?? "";
    const baseData: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key === "signature") return;
      baseData[key] = value;
    });
    const expectedFull = md5ParamString(pfParamString, passphrase);     // includes empties (PayFast's method)
    const expectedSkip = generatePayfastSignature(baseData, passphrase); // skips empties (legacy fallback)

    const signatureValid =
      !!signatureProvided &&
      (signatureProvided === expectedFull || signatureProvided === expectedSkip);

    if (!signatureValid) {
      // TEMPORARY forensic capture so a still-failing ITN is diagnosable on a
      // dashboard ITN resend (no new payment needed). Remove once confirmed.
      if (supabase) {
        await supabase.from("events").insert({
          type: "debug.payfast_itn_sig_mismatch",
          payload: {
            provided:           signatureProvided || "(none)",
            expected_full:      expectedFull,
            expected_skip:      expectedSkip,
            passphrase_present: !!passphrase,
            field_keys:         Array.from(params.keys()),
            param_string:       pfParamString,
          },
        });
      }
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN signature mismatch",
        fields:   {
          client_ip:     clientIp,
          provided:      signatureProvided || "(none)",
          expected_full: expectedFull,
          expected_skip: expectedSkip,
          pf_payment_id: pfData["pf_payment_id"] ?? "",
          m_payment_id:  pfData["m_payment_id"] ?? "",
          amount_gross:  pfData["amount_gross"] ?? "",
        },
      });

      return NextResponse.json({ error: "Invalid signature" }, { status: 200 });
    }

    // ── 3. Verify merchant_id ─────────────────────────────────────────────────
    if ((pfData["merchant_id"] ?? "") !== merchantIdEnv) {
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN merchant_id mismatch",
        fields:   {
          client_ip: clientIp,
          received:  pfData["merchant_id"] ?? "(none)",
          expected:  merchantIdEnv,
        },
      });
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
      // Signature was valid but the payload doesn't reference an order —
      // shouldn't happen with the redirect/onsite flows we use. Log loudly.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN missing order reference",
        fields:   {
          pf_payment_id: pfData["pf_payment_id"] ?? "",
          m_payment_id:  pfData["m_payment_id"]  ?? "",
          custom_str1:   pfData["custom_str1"]   ?? "",
        },
      });
      return NextResponse.json({ error: "No order reference" }, { status: 200 });
    }

    if (!supabase) {
      // Server misconfig — return 5xx so PayFast retries when fixed.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN: Supabase service-role client not configured",
        detail:   "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env then redeploy.",
      });
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }

    // ── 4. Verify amount ──────────────────────────────────────────────────────
    const amountGross = parseFloat(pfData["amount_gross"] ?? "0");

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("order_number, total_cents, status")
      .in("order_number", orderNumbers);

    if (ordersError) {
      // DB failure during a verified ITN — return 5xx so PayFast retries.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN: orders lookup failed",
        fields:   { order_numbers: orderNumbers.join(",") },
        detail:   ordersError.message,
      });
      return NextResponse.json({ error: "Orders lookup failed" }, { status: 503 });
    }
    if (!orders || orders.length === 0) {
      // Signature + IP + merchant all passed but no order matches — likely
      // a stale ITN replay for an archived/deleted order. Don't retry.
      await notifyOps({
        severity: "warn",
        title:    "PayFast ITN: no matching orders",
        fields:   {
          order_numbers: orderNumbers.join(","),
          pf_payment_id: pfPaymentId ?? "",
        },
      });
      return NextResponse.json({ error: "No matching orders" }, { status: 200 });
    }

    const expectedCents  = orders.reduce((sum, row) => sum + (row.total_cents as number), 0);
    const expectedAmount = parseFloat(formatPayfastAmount(expectedCents));

    if (Math.abs(expectedAmount - amountGross) > 0.01) {
      // Amount tampering or order edited after PayFast was hit. Either way
      // this is fraud/data-integrity territory — fatal alert.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN amount mismatch",
        fields:   {
          client_ip:      clientIp,
          expected_amount: expectedAmount,
          received_amount: amountGross,
          order_numbers:  orderNumbers.join(","),
          pf_payment_id:  pfPaymentId ?? "",
        },
      });
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
      // Remote validation refused — log loudly. PayFast disowning the
      // notification means our fields are wrong or the ITN is fake.
      await notifyOps({
        severity: "fatal",
        title:    "PayFast ITN: /eng/query/validate refused",
        fields:   {
          client_ip:      clientIp,
          pf_response:    validateBody.slice(0, 200),
          pf_payment_id:  pfPaymentId ?? "",
          order_numbers:  orderNumbers.join(","),
        },
      });
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

      // Mark orders paid and link to the payments row. RETURNING the rows that
      // actually matched the status='pending' guard tells us whether THIS ITN
      // performed the transition. PayFast redelivers ITNs, so on a 2nd+
      // delivery this matches zero rows — and we must NOT re-send the admin
      // alert, re-insert the analytics event, or re-fire side effects.
      const { data: updatedOrders, error: updateError } = await supabase
        .from("orders")
        .update({
          status:     "new",
          payment_id: paymentId,
        })
        .in("order_number", orderNumbers)
        .eq("status", "pending")
        .select("id, order_number, customer_id, customer_email");

      if (updateError) {
        console.error("[PayFast ITN] Orders update error", updateError.message);
        return NextResponse.json({ error: "Update failed" }, { status: 200 });
      }

      if (!updatedOrders || updatedOrders.length === 0) {
        // Already processed (redelivered/late ITN). Idempotently repair a
        // missing payment_id link regardless of status, then ack without
        // re-running any side effect.
        if (paymentId) {
          await supabase
            .from("orders")
            .update({ payment_id: paymentId })
            .in("order_number", orderNumbers)
            .is("payment_id", null);
        }
        console.info(`[PayFast ITN] duplicate COMPLETE for ${orderNumbers.join(",")} — already processed`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const paidRows = updatedOrders;
      const customerId = paidRows[0]?.customer_id ?? null;

      // Send the order-confirmation email NOW rather than waiting for the
      // drainer. We still write a scheduled_emails row per order for history +
      // as a retry backstop: queue pending, attempt inline, mark sent on
      // success, and leave it pending (drainer retries) on skip/failure.
      for (const o of paidRows) {
        const { data: queued } = await supabase
          .from("scheduled_emails")
          .upsert(
            {
              customer_id:     o.customer_id ?? null,
              order_id:        o.id,
              type:            "order_confirmed",
              status:          "pending",
              send_at:         new Date().toISOString(),
              subject:         `Your PaperWalls order ${o.order_number} is confirmed`,
              idempotency_key: `order_confirmed:${o.id}`,
              attempts:        0,
              metadata:        { order_number: o.order_number, pf_payment_id: pfPaymentId },
            },
            { onConflict: "idempotency_key", ignoreDuplicates: false },
          )
          .select("id, status")
          .maybeSingle();

        if (queued && queued.status !== "sent") {
          const { data: orderForEmail } = await supabase
            .from("orders")
            .select("order_number, customer_email, customer_name, total_cents, wall_count, total_sqm, wallpaper_style, application_method, product_type")
            .eq("id", o.id)
            .maybeSingle();
          if (orderForEmail?.customer_email) {
            const rendered = renderOrderConfirmed(orderForEmail as unknown as OrderEmailRow);
            const sendResult = await sendEmail({
              to:      orderForEmail.customer_email as string,
              subject: rendered.subject,
              html:    rendered.html,
            });
            if ("ok" in sendResult && sendResult.ok) {
              await supabase
                .from("scheduled_emails")
                .update({
                  status:          "sent",
                  sent_at:         new Date().toISOString(),
                  last_attempt_at: new Date().toISOString(),
                  attempts:        1,
                  metadata:        { order_number: o.order_number, pf_payment_id: pfPaymentId, resend_id: sendResult.id },
                })
                .eq("id", queued.id);
            } else {
              // skipped (no key) or hard failure → leave pending for the drainer.
              const reason = "skipped" in sendResult ? sendResult.reason : sendResult.error;
              console.warn(`[PayFast ITN] inline order_confirmed not sent for ${o.order_number}: ${reason}`);
            }
          }
        }
      }

      if (customerId) {
        void supabase.rpc("update_customer_stats", { p_customer_id: customerId });
      }

      // Log analytics event (gated on a real pending->new transition above).
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

      // Quiet success — verbose enough to find in logs by greppable prefix
      // but no longer noisy in Vercel runtime.
      console.info(`[PayFast ITN] ok ${pfPaymentId} → ${orderNumbers.join(",")}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Unexpected error — DB hiccup, network blip, code bug. Return 5xx so
    // PayFast retries the ITN; meanwhile alert ops loudly. Don't include
    // the full body in the alert (may include sensitive data).
    console.error("[PayFast ITN] Unexpected error", err);
    await notifyOps({
      severity: "fatal",
      title:    "PayFast ITN: unexpected error",
      fields:   { client_ip: clientIp, body_size: rawBody.length },
      detail:   err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
