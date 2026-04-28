import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyOps } from "@/lib/alerts";

// Nightly payment-integrity check. Two passes:
//
// 1. DB integrity (always runs)
//    - Orders that look paid (status not in pending/cancelled, refunded_at
//      null) but have no payments row at all.
//    - Orders where status='pending' for >24h with no payments row — these
//      are abandoned-at-PayFast cases, not strictly drift, but worth seeing.
//    - Payments with no matching order. Shouldn't happen but cheap to check.
//
// 2. PayFast Transactions History (runs only if PAYFAST_API_TOKEN is set)
//    - Currently a stub. When PayFast credentials are wired we'll add a call
//      to their Transactions History endpoint and cross-check against our
//      payments table by gateway_payment_id.
//
// Triggers Slack via notifyOps when drift is found. Heartbeat written to
// public.events with type='cron.reconcile_payments' so /admin/analytics
// can surface 'last reconciliation ran X ago'.
//
// Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.

const HOURS = 60 * 60 * 1000;

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

  const now = new Date();

  // ── 1. Paid orders without a payments row ─────────────────────────────
  const { data: paidOrphans } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total_cents, customer_email, created_at, payment_id")
    .is("deleted_at", null)
    .is("refunded_at", null)
    .is("payment_id", null)
    .not("status", "in", "(pending,cancelled)")
    .gte("created_at", new Date(now.getTime() - 30 * 24 * HOURS).toISOString());

  // ── 2. Payments rows that don't match any order ───────────────────────
  // Run as a left-join check. Cheap because payments is tiny.
  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("id, gateway_payment_id, status, amount_cents, order_numbers, created_at")
    .gte("created_at", new Date(now.getTime() - 30 * 24 * HOURS).toISOString());

  const orphanPayments: typeof payments = [];
  for (const p of (payments ?? [])) {
    const nums = (p.order_numbers as string[] | null) ?? [];
    if (nums.length === 0) continue;
    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("order_number", nums);
    if ((count ?? 0) === 0) orphanPayments.push(p);
  }

  // ── 3. Stuck pending: status='pending' for >24h without payments row ──
  const { data: stuckPending } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, customer_email, total_cents, created_at")
    .is("deleted_at", null)
    .eq("status", "pending")
    .lt("created_at", new Date(now.getTime() - 24 * HOURS).toISOString());

  const drift = {
    paid_without_payments_row: paidOrphans?.length ?? 0,
    payments_without_order:    orphanPayments.length,
    stuck_pending_orders:      stuckPending?.length ?? 0,
  };

  // Alert on real drift only (stuck pending is information, not drift).
  if (drift.paid_without_payments_row > 0 || drift.payments_without_order > 0) {
    await notifyOps({
      severity: "fatal",
      title:    "Payment reconciliation drift detected",
      fields: {
        "Paid orders missing payment row": drift.paid_without_payments_row,
        "Payments without matching order": drift.payments_without_order,
      },
      detail: JSON.stringify(
        {
          paid_orphans:    (paidOrphans ?? []).map((o) => o.order_number),
          orphan_payments: orphanPayments.map((p) => p.gateway_payment_id),
        },
        null, 2,
      ),
    });
  }

  // Heartbeat — used by the System Health panel.
  await supabaseAdmin.from("events").insert({
    type:    "cron.reconcile_payments",
    payload: drift,
  });

  return NextResponse.json({ ok: true, ...drift });
}

export const POST = GET;
