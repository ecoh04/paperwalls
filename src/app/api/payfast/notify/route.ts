import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { formatPayfastAmount, generatePayfastSignature, getPayfastHost } from "@/lib/payfast";

/**
 * PayFast ITN (Instant Transaction Notification) handler.
 *
 * Docs: https://developers.payfast.co.za/documentation/#step_4_confirm_payment_is_successful
 *
 * We:
 * - Parse x-www-form-urlencoded body
 * - Verify signature
 * - Check merchant_id matches
 * - Verify amount_gross matches our expected total
 * - POST back to PayFast /eng/query/validate to confirm VALID
 * - If payment_status = COMPLETE, update orders from pending → new and store pf_payment_id
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);
    const pfData: Record<string, string> = {};
    params.forEach((value, key) => {
      pfData[key] = value;
    });

    // Tell PayFast that this endpoint is reachable (HTTP 200) – we'll still return JSON below.
    const merchantIdEnv = process.env.PAYFAST_MERCHANT_ID?.trim() ?? "";
    const passphrase = process.env.PAYFAST_PASSPHRASE?.trim() ?? null;

    if (!merchantIdEnv) {
      console.error("PAYFAST_MERCHANT_ID not set");
      return NextResponse.json({ error: "Misconfigured" }, { status: 200 });
    }

    // Build parameter string excluding signature (as in their PHP example)
    let pfParamString = "";
    params.forEach((value, key) => {
      if (key === "signature") return;
      pfParamString += `${key}=${encodeURIComponent(value)}&`;
    });
    if (pfParamString.endsWith("&")) {
      pfParamString = pfParamString.slice(0, -1);
    }

    // Verify signature – similar to generateSignature + pfValidSignature in docs
    const signatureProvided = pfData["signature"] ?? "";
    const baseData: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key === "signature") return;
      baseData[key] = value;
    });
    const expectedSignature = generatePayfastSignature(baseData, passphrase);

    if (!signatureProvided || signatureProvided !== expectedSignature) {
      console.error("PayFast ITN invalid signature", { signatureProvided, expectedSignature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 200 });
    }

    // Check merchant id
    if ((pfData["merchant_id"] ?? "") !== merchantIdEnv) {
      console.error("PayFast ITN merchant_id mismatch", pfData["merchant_id"]);
      return NextResponse.json({ error: "Invalid merchant" }, { status: 200 });
    }

    const paymentStatus = pfData["payment_status"] ?? "";
    const pfPaymentId = pfData["pf_payment_id"] ?? null;
    const orderNumbersStr = pfData["custom_str1"] || pfData["m_payment_id"] || "";
    const orderNumbers = orderNumbersStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!orderNumbers.length) {
      console.error("PayFast ITN missing order numbers");
      return NextResponse.json({ error: "No order reference" }, { status: 200 });
    }

    // Compare amount with our orders total
    const amountGross = parseFloat(pfData["amount_gross"] ?? "0");
    if (!supabase) {
      console.error("Supabase client not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 200 });
    }
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("order_number,total_cents,status")
      .in("order_number", orderNumbers);

    if (ordersError || !orders || orders.length === 0) {
      console.error("PayFast ITN orders lookup error", ordersError);
      return NextResponse.json({ error: "No matching orders" }, { status: 200 });
    }

    const expectedCents = orders.reduce((sum, row) => sum + (row.total_cents as number), 0);
    const expectedAmount = parseFloat(formatPayfastAmount(expectedCents));
    if (Math.abs(expectedAmount - amountGross) > 0.01) {
      console.error("PayFast ITN amount mismatch", { expectedAmount, amountGross });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 200 });
    }

    // Validate with PayFast server
    const pfHost = getPayfastHost();
    const validateRes = await fetch(`https://${pfHost}/eng/query/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: pfParamString,
    });
    const validateBody = (await validateRes.text()).trim();
    if (!validateBody.toUpperCase().includes("VALID")) {
      console.error("PayFast ITN server validation failed", validateBody);
      return NextResponse.json({ error: "Remote validation failed" }, { status: 200 });
    }

    if (paymentStatus === "COMPLETE") {
      // 1. Insert a row into payments — this fixes the stitch_payment_id mess.
      //    gateway_payment_id is now clearly visible in the dashboard.
      const { data: paymentRow, error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          gateway: "payfast",
          gateway_payment_id: pfPaymentId,
          status: "paid",
          amount_cents: Math.round(amountGross * 100),
          currency: "ZAR",
          order_numbers: orderNumbers,
          raw_payload: pfData,
        })
        .select("id")
        .single();

      if (paymentInsertError) {
        console.error("PayFast ITN payment insert error", paymentInsertError);
        // Non-fatal: still mark orders paid
      }

      const paymentId = paymentRow?.id ?? null;

      // 2. Mark orders paid; link to the new payments row
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "new",
          stitch_payment_id: pfPaymentId, // kept for backward compat
          payment_id: paymentId,
        })
        .in("order_number", orderNumbers)
        .eq("status", "pending");

      if (updateError) {
        console.error("PayFast ITN order update error", updateError);
        return NextResponse.json({ error: "Update failed" }, { status: 200 });
      }

      // 3. Log payment.completed event
      await supabase.from("events").insert({
        type: "payment.completed",
        payload: {
          gateway: "payfast",
          gateway_payment_id: pfPaymentId,
          amount_cents: Math.round(amountGross * 100),
          order_numbers: orderNumbers,
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("PayFast ITN handler error", err);
    return NextResponse.json({ error: "Bad request" }, { status: 200 });
  }
}

