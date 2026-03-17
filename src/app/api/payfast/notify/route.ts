import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
      console.error("[PayFast ITN] Supabase not configured");
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

      // Insert payment record — gateway_payment_id is now clearly visible
      const { data: paymentRow, error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          gateway:            "payfast",
          gateway_payment_id: pfPaymentId,
          status:             "paid",
          amount_cents:       Math.round(amountGross * 100),
          currency:           "ZAR",
          order_numbers:      orderNumbers,
          raw_payload:        pfData,
        })
        .select("id")
        .single();

      if (paymentInsertError) {
        console.error("[PayFast ITN] Payment insert error", paymentInsertError.message);
        // Non-fatal — still mark orders paid below
      }

      const paymentId = paymentRow?.id ?? null;

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

      // Queue shipped/confirmed notifications + update customer stats
      const paidOrders = orders.filter((o) => orderNumbers.includes(o.order_number as string));
      if (paidOrders.length > 0) {
        // Fetch customer_id from the first order
        const { data: fullOrder } = await supabase
          .from("orders")
          .select("customer_id, id")
          .eq("order_number", paidOrders[0].order_number)
          .maybeSingle();

        const customerId = fullOrder?.customer_id ?? null;

        if (customerId) {
          // Queue order_confirmed email for each order
          const emailRows = paidOrders.map((o) => ({
            customer_id: customerId,
            type:        "order_confirmed",
            status:      "pending",
            send_at:     new Date().toISOString(),
            subject:     `Your PaperWalls order ${o.order_number} is confirmed`,
            metadata:    { order_number: o.order_number, pf_payment_id: pfPaymentId },
          }));
          await supabase.from("scheduled_emails").insert(emailRows);

          // Update lifetime stats
          void supabase.rpc("update_customer_stats", { p_customer_id: customerId });
        }
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

      console.log(`[PayFast ITN] ✓ Payment ${pfPaymentId} confirmed for orders: ${orderNumbers.join(", ")}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[PayFast ITN] Unexpected error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 200 });
  }
}
