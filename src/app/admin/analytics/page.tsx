import { createClient } from "@/lib/supabase/server";
import { formatZarCents } from "@/lib/admin-labels";
import { LineChart } from "@/components/admin/charts/LineChart";
import { FunnelChart } from "@/components/admin/charts/FunnelChart";
import { SparklineChart } from "@/components/admin/charts/SparklineChart";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { WindowToggle } from "@/components/admin/WindowToggle";
import { WINDOW_OPTIONS, type WindowValue } from "@/components/admin/window-options";
import { DeltaIndicator } from "@/components/admin/DeltaIndicator";
import {
  MONTHLY_REVENUE_GOAL_CENTS,
  MONTHLY_AD_SPEND_CENTS,
  AD_SPEND_CONFIGURED,
  COSTS_CONFIGURED,
  cogsForFinishCents,
} from "@/lib/analytics-config";
import type { WallpaperMaterial } from "@/types/order";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { window?: string };

const SAST       = "Africa/Johannesburg";
const FEE_PCT    = 0.035;          // PayFast standard rate (incl. card networks)
const FEE_FIXED  = 200;            // 200 cents per transaction
const VAT_PCT    = 0.15;           // SA VAT, only relevant if registered

// First-party funnel event types, in journey order, for the sequential funnel.
const FUNNEL_EVENT_TYPES = [
  "page.viewed",
  "pdp.viewed",
  "config.viewed",
  "config.image_uploaded",
  "cart.wallpaper_added",
  "checkout.started",
  "checkout.submitted",
] as const;

// ──────────────────────────────────────────────────────────────────────────
// Window math (SAST)
// ──────────────────────────────────────────────────────────────────────────

type WindowSpec = {
  start:        string;
  prevStart:    string;
  chartDays:    number;
  label:        string;
  vsLabel:      string;
};

function todayStartUtc(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return new Date(`${ymd}T00:00:00+02:00`);
}

function buildWindow(value: WindowValue): WindowSpec {
  const t = todayStartUtc();
  const day = 24 * 60 * 60 * 1000;
  switch (value) {
    case "today":  return { start: t.toISOString(),
                            prevStart: new Date(t.getTime() - day).toISOString(),
                            chartDays: 7,
                            label: "Today", vsLabel: "vs yesterday" };
    case "7d":     return { start: new Date(t.getTime() - 6 * day).toISOString(),
                            prevStart: new Date(t.getTime() - 13 * day).toISOString(),
                            chartDays: 7,
                            label: "Last 7 days", vsLabel: "vs prior 7d" };
    case "30d":    return { start: new Date(t.getTime() - 29 * day).toISOString(),
                            prevStart: new Date(t.getTime() - 59 * day).toISOString(),
                            chartDays: 30,
                            label: "Last 30 days", vsLabel: "vs prior 30d" };
    case "90d":    return { start: new Date(t.getTime() - 89 * day).toISOString(),
                            prevStart: new Date(t.getTime() - 179 * day).toISOString(),
                            chartDays: 90,
                            label: "Last 90 days", vsLabel: "vs prior 90d" };
  }
}

function isWindowValue(s: string | undefined): s is WindowValue {
  return WINDOW_OPTIONS.some((o) => o.value === s);
}

const fmtInt = (n: number) => n.toLocaleString();

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params      = await searchParams;
  const windowValue = isWindowValue(params.window) ? params.window : "30d";
  const win         = buildWindow(windowValue);

  // Current SAST calendar month start (YYYY-MM-01), for the month-to-date goal.
  const monthStartKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAST, year: "numeric", month: "2-digit",
  }).format(new Date()) + "-01";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Please log in to view analytics.</p>
      </div>
    );
  }

  // ── Daily revenue (SAST) — fetch enough days for current + previous + sparkline
  const sparkLookbackStart = new Date(win.prevStart).toISOString().slice(0, 10);
  const { data: revRows } = await supabase
    .from("v_daily_revenue")
    .select("day, paid_orders, paid_revenue_cents, refunded_orders")
    .gte("day", sparkLookbackStart)
    .order("day", { ascending: true });

  type DailyRev = { day: string; paid_orders: number; paid_revenue_cents: number; refunded_orders: number };
  const map = new Map<string, DailyRev>();
  for (const r of (revRows ?? []) as DailyRev[]) map.set(r.day, r);

  // Backfill missing days
  const filled: DailyRev[] = [];
  const dayMs   = 24 * 60 * 60 * 1000;
  const startMs = new Date(win.prevStart).getTime();
  const todayMs = todayStartUtc().getTime();
  for (let t = startMs; t <= todayMs; t += dayMs) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(t));
    filled.push(map.get(key) ?? { day: key, paid_orders: 0, paid_revenue_cents: 0, refunded_orders: 0 });
  }

  // Split current / previous windows. winStartKey is the SAST day key of the
  // window start, taken directly from win.start. (The old filled.length-chartDays
  // index mis-selected for "today": filled spans only [yesterday, today] but
  // chartDays is 7, so it picked yesterday and Today double-counted two days.)
  const winStartKey  = new Intl.DateTimeFormat("en-CA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(win.start));
  const currentRows  = filled.filter((r) => r.day >= winStartKey);
  const previousRows = filled.filter((r) => r.day <  winStartKey);

  const sumRev    = (rows: DailyRev[]) => rows.reduce((s, r) => s + Number(r.paid_revenue_cents), 0);
  const sumOrders = (rows: DailyRev[]) => rows.reduce((s, r) => s + Number(r.paid_orders), 0);
  const sumRef    = (rows: DailyRev[]) => rows.reduce((s, r) => s + Number(r.refunded_orders), 0);

  const currentRevenue  = sumRev(currentRows);
  const previousRevenue = sumRev(previousRows);
  const currentOrders   = sumOrders(currentRows);
  const previousOrders  = sumOrders(previousRows);
  const currentAov      = currentOrders  > 0 ? Math.round(currentRevenue  / currentOrders)  : 0;
  const previousAov     = previousOrders > 0 ? Math.round(previousRevenue / previousOrders) : 0;
  const currentRefunds  = sumRef(currentRows);

  // ── System health (window-independent — always 'right now')
  const HOUR = 60 * 60 * 1000;
  const [
    lastPaymentEvt,
    lastDrainEvt,
    lastReconcileEvt,
    eventsLastHour,
    pendingEmails,
    failedEmailsRecent,
    resendKeySetCheck,
  ] = await Promise.all([
    supabase.from("events").select("created_at, payload").eq("type", "payment.completed")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("created_at, payload").eq("type", "cron.drain_emails")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("created_at, payload").eq("type", "cron.reconcile_payments")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - HOUR).toISOString()),
    supabase.from("scheduled_emails").select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("scheduled_emails").select("id, error, type, last_attempt_at")
      .eq("status", "failed")
      .gte("last_attempt_at", new Date(Date.now() - 24 * HOUR).toISOString())
      .order("last_attempt_at", { ascending: false })
      .limit(5),
    Promise.resolve({ set: !!process.env.RESEND_API_KEY }),
  ]);

  // ── Many queries in parallel ────────────────────────────────────────────
  const liveCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const [
    { count: currentVisitors  },
    { count: previousVisitors },
    { count: liveVisitors     },
    sessionRows,
    dailySessionsRows,
    landingRows,
    topPagesRows,
    deviceRows,
    countryRows,
    topCustomersRows,
    abandonedAgg,
    bounceData,
    attribRowsRaw,
    productRows,
    discountAgg,
    funnelEventsRaw,
    paidSessionRows,
    monthRevenueRows,
    sampleAddRows,
    sampleOrdersRes,
  ] = await Promise.all([
    // Current + previous + live visitor counts
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.start),
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.prevStart).lt("first_seen_at", win.start),
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("last_seen_at", liveCutoff),

    // Window's sessions for landing page / device / country aggregations + daily count
    supabase.from("sessions")
      .select("id, first_seen_at, landing_page, country, user_agent, utm_source")
      .gte("first_seen_at", win.start),

    // Daily session counts (SAST) — derived from sessions table inline
    supabase.from("sessions")
      .select("first_seen_at")
      .gte("first_seen_at", new Date(startMs).toISOString()),

    // Top landing paths in window
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("landing_page")
        .gte("first_seen_at", win.start)
        .not("landing_page", "is", null);
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as { landing_page: string | null }[]) {
        const p = (r.landing_page ?? "").split("?")[0] || "/";
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([path, sessions]) => ({ path, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8);
    })(),

    // Top pages (page.viewed events) in window
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("payload")
        .eq("type", "page.viewed")
        .gte("created_at", win.start);
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as { payload: { path?: string } | null }[]) {
        const path = (r.payload?.path ?? "").split("?")[0];
        if (!path) continue;
        counts.set(path, (counts.get(path) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);
    })(),

    // Device split — derived from sessions.user_agent
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("user_agent")
        .gte("first_seen_at", win.start);
      let mobile = 0, desktop = 0, unknown = 0;
      for (const r of (data ?? []) as { user_agent: string | null }[]) {
        const ua = r.user_agent ?? "";
        if (!ua) unknown++;
        else if (/Mobi|Android|iPhone|iPad/i.test(ua)) mobile++;
        else desktop++;
      }
      return { mobile, desktop, unknown };
    })(),

    // Country split
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("country")
        .gte("first_seen_at", win.start);
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as { country: string | null }[]) {
        const c = r.country ?? "Unknown";
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([country, sessions]) => ({ country, sessions }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8);
    })(),

    // Top customers by lifetime spend
    supabase.from("customers")
      .select("id, name, email, total_orders, total_spent_cents")
      .gt("total_spent_cents", 0)
      .order("total_spent_cents", { ascending: false })
      .limit(8),

    // Abandoned carts via view_abandoned_carts (joins carts→sessions→customers,
    // already excludes converted carts; no fragile .in() id list that breaks at
    // volume). Idle ≥ 1h, has items, returns a small recovery worklist.
    (async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("view_abandoned_carts")
        .select("cart_id, customer_email, customer_name, cart_value_cents, item_count, updated_at")
        .gt("item_count", 0)
        .gt("cart_value_cents", 0)
        .lt("updated_at", oneHourAgo)
        .order("cart_value_cents", { ascending: false })
        .limit(50);
      const rows = (data ?? []) as {
        cart_id: string; customer_email: string | null; customer_name: string | null;
        cart_value_cents: number; item_count: number; updated_at: string;
      }[];
      const value = rows.reduce((s, r) => s + Number(r.cart_value_cents), 0);
      return {
        count: rows.length,
        items_value_cents: value,
        items: rows.slice(0, 6).map((r) => ({
          email: r.customer_email, name: r.customer_name,
          value_cents: Number(r.cart_value_cents), itemCount: Number(r.item_count), updated_at: r.updated_at,
        })),
      };
    })(),

    // Bounce rate: % of sessions in window with ≤1 page.viewed event
    (async () => {
      const { data: sessRows } = await supabase
        .from("sessions").select("id")
        .gte("first_seen_at", win.start);
      const sids = ((sessRows ?? []) as { id: string }[]).map((s) => s.id);
      if (sids.length === 0) return { bouncedSessions: 0, totalSessions: 0 };
      const { data: pvRows } = await supabase
        .from("events").select("session_id")
        .eq("type", "page.viewed")
        .in("session_id", sids);
      const pvCount = new Map<string, number>();
      for (const r of (pvRows ?? []) as { session_id: string }[]) {
        pvCount.set(r.session_id, (pvCount.get(r.session_id) ?? 0) + 1);
      }
      let bounced = 0;
      for (const sid of sids) {
        if ((pvCount.get(sid) ?? 0) <= 1) bounced++;
      }
      return { bouncedSessions: bounced, totalSessions: sids.length };
    })(),

    // Attribution / orders for fees + discount accounting
    supabase.from("orders")
      .select("utm_source, utm_medium, utm_campaign, total_cents, subtotal_cents, shipping_cents, discount_cents, refunded_at, status")
      .gte("created_at", win.start)
      .eq("is_test", false)
      .is("deleted_at", null),

    // Product mix
    supabase.from("orders")
      .select("wallpaper_style, application_method, total_cents, total_sqm, customer_id")
      .eq("product_type", "wallpaper")
      .gte("created_at", win.start)
      .not("status", "in", "(pending,cancelled)")
      .is("refunded_at", null)
      .is("deleted_at", null)
      .eq("is_test", false),

    // Discount usage (separate aggregation across all orders in window)
    (async () => {
      const { data } = await supabase.from("orders")
        .select("discount_cents, discount_code")
        .gte("created_at", win.start)
        .gt("discount_cents", 0)
        .eq("is_test", false)
        .is("deleted_at", null);
      const totalDiscount = ((data ?? []) as { discount_cents: number }[])
        .reduce((s, r) => s + Number(r.discount_cents), 0);
      return { count: (data ?? []).length, total_cents: totalDiscount };
    })(),

    // Funnel events (session_id + type) for the sequential, by-source funnel
    supabase.from("events")
      .select("session_id, type")
      .in("type", FUNNEL_EVENT_TYPES as unknown as string[])
      .gte("created_at", win.start)
      .not("session_id", "is", null),

    // Sessions with a paid order in window (order_paid stage + per-source paid)
    supabase.from("orders")
      .select("session_id, product_type")
      .gte("created_at", win.start)
      .not("status", "in", "(pending,cancelled)")
      .is("refunded_at", null)
      .is("deleted_at", null)
      .eq("is_test", false)
      .not("session_id", "is", null),

    // Month-to-date daily revenue (goal tracker, independent of the window)
    supabase.from("v_daily_revenue")
      .select("day, paid_revenue_cents, paid_orders")
      .gte("day", monthStartKey),

    // Sample-pack adds (distinct sessions that added a sample to cart)
    supabase.from("events")
      .select("session_id")
      .eq("type", "cart.sample_added")
      .gte("created_at", win.start)
      .not("session_id", "is", null),

    // Paid sample-pack orders in window
    supabase.from("orders")
      .select("id", { count: "exact", head: true })
      .eq("product_type", "sample_pack")
      .gte("created_at", win.start)
      .not("status", "in", "(pending,cancelled)")
      .is("refunded_at", null)
      .is("deleted_at", null)
      .eq("is_test", false),
  ]);

  // ── Extra data: Meta CAPI health, retention, monthly revenue trend ───────
  const monthTrendStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [capiRows, retentionRows, monthTrendRows] = await Promise.all([
    // Meta CAPI audit — last 24h of server sends, newest first
    supabase.from("capi_events")
      .select("event_type, status, created_at")
      .gte("created_at", new Date(Date.now() - 24 * HOUR).toISOString())
      .order("created_at", { ascending: false }),
    // Retention — paying customers (total_orders/total_spent are now paid-only, non-test)
    supabase.from("customers")
      .select("total_orders, total_spent_cents")
      .gt("total_orders", 0),
    // Revenue by month for the trend (v_daily_revenue already excludes test orders)
    supabase.from("v_daily_revenue")
      .select("day, paid_revenue_cents, paid_orders")
      .gte("day", monthTrendStart),
  ]);

  // Build daily sessions array (SAST-bucketed)
  type SessionRow = { first_seen_at: string };
  const sessionsByDay = new Map<string, number>();
  for (const r of (dailySessionsRows.data ?? []) as SessionRow[]) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(r.first_seen_at));
    sessionsByDay.set(key, (sessionsByDay.get(key) ?? 0) + 1);
  }
  const dailySessions = filled.map((r) => ({ day: r.day, value: sessionsByDay.get(r.day) ?? 0 }));
  const currentDailySessions = dailySessions.filter((d) => d.day >= winStartKey);

  // Conversion rate: paid orders / sessions
  const conversionRate = (currentVisitors ?? 0) > 0
    ? (currentOrders / Math.max(1, currentVisitors ?? 0)) * 100
    : 0;
  const prevConversionRate = (previousVisitors ?? 0) > 0
    ? (previousOrders / Math.max(1, previousVisitors ?? 0)) * 100
    : 0;

  // ── Attribution aggregate ──────────────────────────────────────────────
  type OrderUtm = {
    utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
    total_cents: number; subtotal_cents: number; shipping_cents: number; discount_cents: number;
    refunded_at: string | null; status: string;
  };
  const orderRows = (attribRowsRaw.data ?? []) as OrderUtm[];
  const paidOrderRows = orderRows.filter((r) => r.status !== "pending" && r.status !== "cancelled" && r.refunded_at == null);

  const attribAgg = new Map<string, { utm_source: string; utm_medium: string; utm_campaign: string; orders: number; revenue_cents: number }>();
  for (const r of paidOrderRows) {
    const src = r.utm_source   || "(direct)";
    const med = r.utm_medium   || "(none)";
    const cmp = r.utm_campaign || "(none)";
    const k = `${src}|${med}|${cmp}`;
    const cur = attribAgg.get(k);
    if (cur) { cur.orders += 1; cur.revenue_cents += Number(r.total_cents); }
    else      attribAgg.set(k, { utm_source: src, utm_medium: med, utm_campaign: cmp, orders: 1, revenue_cents: Number(r.total_cents) });
  }
  const attribution = Array.from(attribAgg.values()).sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 10);

  // ── Product mix ────────────────────────────────────────────────────────
  type ProductRow = { wallpaper_style: string | null; application_method: string | null; total_cents: number; total_sqm: number | null; customer_id: string | null };
  const productAgg = new Map<string, { finish: string; application: string; orders: number; revenue_cents: number; total_sqm: number }>();
  for (const r of (productRows.data ?? []) as ProductRow[]) {
    const f = r.wallpaper_style || "unknown";
    const a = r.application_method || "unknown";
    const k = `${f}|${a}`;
    const cur = productAgg.get(k);
    if (cur) {
      cur.orders        += 1;
      cur.revenue_cents += Number(r.total_cents);
      cur.total_sqm     += Number(r.total_sqm ?? 0);
    } else {
      productAgg.set(k, { finish: f, application: a, orders: 1, revenue_cents: Number(r.total_cents), total_sqm: Number(r.total_sqm ?? 0) });
    }
  }
  const product = Array.from(productAgg.values()).sort((a, b) => b.revenue_cents - a.revenue_cents);
  const totalSqm = product.reduce((s, r) => s + r.total_sqm, 0);
  const wallpaperOrders = (productRows.data ?? []).length;
  const avgOrderSqm = wallpaperOrders > 0 ? (totalSqm / wallpaperOrders) : 0;

  // ── Install-method split (DIY vs Pro), wallpaper only ──────────────────
  // application_method is a 3-value enum: diy | diy_kit | pro_installer. Both
  // diy and diy_kit are self-install; only pro_installer is Pro. (The old code
  // counted "diy" only and a dead "installer" alias, silently dropping diy_kit.)
  const isDiyApp = (a: string) => a === "diy" || a === "diy_kit";
  const isProApp = (a: string) => a === "pro_installer";
  const diyOrders = product.filter((p) => isDiyApp(p.application))
    .reduce((s, r) => s + r.orders, 0);
  const diyRevenue = product.filter((p) => isDiyApp(p.application))
    .reduce((s, r) => s + r.revenue_cents, 0);
  const proOrders = product.filter((p) => isProApp(p.application))
    .reduce((s, r) => s + r.orders, 0);
  const proRevenue = product.filter((p) => isProApp(p.application))
    .reduce((s, r) => s + r.revenue_cents, 0);
  const totalInstallOrders = diyOrders + proOrders;
  const proAovCents = proOrders > 0 ? Math.round(proRevenue / proOrders) : 0;
  const diyAovCents = diyOrders > 0 ? Math.round(diyRevenue / diyOrders) : 0;

  // ── Customers: new vs returning by orders this window ──────────────────
  const customerIds = ((productRows.data ?? []) as ProductRow[]).map((r) => r.customer_id).filter(Boolean) as string[];
  let newCustomers = 0, returningCustomers = 0;
  if (customerIds.length > 0) {
    const { data: custData } = await supabase
      .from("customers")
      .select("id, total_orders")
      .in("id", customerIds);
    const totals = new Map<string, number>();
    for (const c of (custData ?? []) as { id: string; total_orders: number }[]) totals.set(c.id, c.total_orders);
    for (const cid of customerIds) {
      if ((totals.get(cid) ?? 1) === 1) newCustomers++;
      else returningCustomers++;
    }
  }

  // ── Finance breakdown for current window (paid orders) ─────────────────
  const grossSales      = paidOrderRows.reduce((s, r) => s + Number(r.subtotal_cents) + Number(r.discount_cents), 0);
  const discountsTotal  = paidOrderRows.reduce((s, r) => s + Number(r.discount_cents), 0);
  const netSales        = paidOrderRows.reduce((s, r) => s + Number(r.subtotal_cents), 0);
  const shippingTotal   = paidOrderRows.reduce((s, r) => s + Number(r.shipping_cents), 0);
  const totalCollected  = paidOrderRows.reduce((s, r) => s + Number(r.total_cents),   0);
  const refundsTotal    = orderRows.filter((r) => r.refunded_at != null).reduce((s, r) => s + Number(r.total_cents), 0);
  const cardFees        = paidOrderRows.length > 0
    ? Math.round(paidOrderRows.reduce((s, r) => s + Number(r.total_cents) * FEE_PCT, 0) + paidOrderRows.length * FEE_FIXED)
    : 0;
  const vatEstimate     = Math.round(netSales / (1 + VAT_PCT) * VAT_PCT);  // VAT-inclusive assumption
  const netDeposit      = totalCollected - cardFees - refundsTotal;

  // ── Bounce rate ────────────────────────────────────────────────────────
  const bounceRate = bounceData.totalSessions > 0
    ? (bounceData.bouncedSessions / bounceData.totalSessions) * 100
    : null;

  // ── Command-center derived layer ────────────────────────────────────────

  // Session -> source / device maps (from this window's sessions)
  const sessSource = new Map<string, string>();
  for (const r of (sessionRows.data ?? []) as { id: string; utm_source: string | null }[]) {
    sessSource.set(r.id, r.utm_source || "(direct)");
  }

  // Sessions that reached a paid WALLPAPER order (the order_paid stage). Sample
  // orders are excluded here — they never enter the configurator, so counting
  // them would inflate every wallpaper funnel stage via the monotonic rollup.
  // Sample packs have their own funnel below.
  const paidSessionIds = new Set(
    ((paidSessionRows.data ?? []) as { session_id: string | null; product_type: string | null }[])
      .filter((r) => r.product_type === "wallpaper")
      .map((r) => r.session_id).filter(Boolean) as string[],
  );

  // Sequential funnel: per session, the FURTHEST stage reached. Counting
  // "reached stage N or later" makes the drop-off monotonic and honest,
  // unlike the old independent per-stage counts.
  const stageIdx = new Map<string, number>(FUNNEL_EVENT_TYPES.map((t, i): [string, number] => [t, i]));
  const PAID_STAGE = FUNNEL_EVENT_TYPES.length; // index after the last event stage
  const furthest = new Map<string, number>();
  for (const e of (funnelEventsRaw.data ?? []) as { session_id: string; type: string }[]) {
    const idx = stageIdx.get(e.type);
    if (idx === undefined) continue;
    const cur = furthest.get(e.session_id) ?? -1;
    if (idx > cur) furthest.set(e.session_id, idx);
  }
  paidSessionIds.forEach((sid) => furthest.set(sid, PAID_STAGE));

  const reachedSeq = new Array<number>(PAID_STAGE + 1).fill(0);
  furthest.forEach((f) => {
    for (let i = 0; i <= f; i++) reachedSeq[i]++;
  });

  // Per-stage OWN-event counts: sessions that actually fired THIS stage's event
  // (not the monotonic rollup). Lets the funnel render "not tracked yet" for a
  // stage whose event isn't recording, instead of a phantom inherited count.
  const ownStageSessions = FUNNEL_EVENT_TYPES.map(() => new Set<string>());
  for (const e of (funnelEventsRaw.data ?? []) as { session_id: string; type: string }[]) {
    const i = stageIdx.get(e.type);
    if (i !== undefined && e.session_id) ownStageSessions[i].add(e.session_id);
  }
  const ownStageCounts = ownStageSessions.map((s) => s.size);

  // Funnel by source: stage reach per top source
  type SrcFunnel = { source: string; landed: number; config: number; cart: number; paid: number; revenue_cents: number };
  const srcFunnelMap = new Map<string, SrcFunnel>();
  const ensureSrc = (src: string): SrcFunnel => {
    let row = srcFunnelMap.get(src);
    if (!row) { row = { source: src, landed: 0, config: 0, cart: 0, paid: 0, revenue_cents: 0 }; srcFunnelMap.set(src, row); }
    return row;
  };
  furthest.forEach((f, sid) => {
    const row = ensureSrc(sessSource.get(sid) ?? "(direct)");
    row.landed += 1;
    if (f >= 2) row.config += 1;            // config.viewed or later
    if (f >= 4) row.cart += 1;              // cart.wallpaper_added or later
    if (f >= PAID_STAGE) row.paid += 1;     // order_paid
  });
  // Fold paid-order revenue onto each source (from the attribution rows)
  for (const r of paidOrderRows) {
    ensureSrc(r.utm_source || "(direct)").revenue_cents += Number(r.total_cents);
  }
  const sourceFunnel = Array.from(srcFunnelMap.values())
    .filter((r) => r.landed > 0) // drop order-only sources with no in-window sessions (phantom rows)
    .sort((a, b) => b.revenue_cents - a.revenue_cents || b.landed - a.landed)
    .slice(0, 6);

  // Sample packs (a separate, shorter funnel — they never enter the configurator)
  const sampleAdds   = new Set(((sampleAddRows.data ?? []) as { session_id: string }[]).map((r) => r.session_id)).size;
  const sampleOrders = sampleOrdersRes.count ?? 0;

  // Month-to-date revenue + run-rate (goal tracker, window-independent)
  const mtdRows    = (monthRevenueRows.data ?? []) as { day: string; paid_revenue_cents: number; paid_orders: number }[];
  const mtdRevenue = mtdRows.reduce((s, r) => s + Number(r.paid_revenue_cents), 0);
  const mtdOrders  = mtdRows.reduce((s, r) => s + Number(r.paid_orders), 0);
  const nowSast    = new Intl.DateTimeFormat("en-CA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dayOfMonth  = Math.max(1, parseInt(nowSast.slice(8, 10), 10));
  const daysInMonth = new Date(parseInt(nowSast.slice(0, 4), 10), parseInt(nowSast.slice(5, 7), 10), 0).getDate();
  const monthRunRate = Math.round((mtdRevenue / dayOfMonth) * daysInMonth);
  const goalPct = MONTHLY_REVENUE_GOAL_CENTS > 0 ? (mtdRevenue / MONTHLY_REVENUE_GOAL_CENTS) * 100 : null;

  // Contribution margin is WALLPAPER-ONLY: COGS comes from the wallpaper
  // product mix, so the revenue basis must be wallpaper revenue too, not the
  // all-product netSales (which includes sample packs that carry no COGS here).
  const wallpaperRevenue = product.reduce((s, p) => s + p.revenue_cents, 0);
  let cogsCents: number | null = null;
  if (COSTS_CONFIGURED) {
    cogsCents = product.reduce((s, p) => {
      if (!["satin", "matte", "linen"].includes(p.finish)) return s; // skip unknown finish, don't coerce to satin
      return s + (cogsForFinishCents(p.finish as WallpaperMaterial, p.total_sqm, p.orders) ?? 0);
    }, 0);
  }
  const marginCents = cogsCents != null ? wallpaperRevenue - cogsCents : null;
  const marginPct   = cogsCents != null && wallpaperRevenue > 0 ? ((wallpaperRevenue - cogsCents) / wallpaperRevenue) * 100 : null;

  // ── Meta CAPI health (24h server-send audit) ─────────────────────────────
  const capiList = (capiRows.data ?? []) as { event_type: string; status: string; created_at: string }[];
  const capiByType = new Map<string, number>();
  for (const e of capiList) if (e.status === "sent") capiByType.set(e.event_type, (capiByType.get(e.event_type) ?? 0) + 1);
  const capiSent24h     = capiList.filter((e) => e.status === "sent").length;
  const capiFailures24h = capiList.filter((e) => e.status !== "sent").length;
  const capiLastSentAt  = capiList.find((e) => e.status === "sent")?.created_at ?? null;
  const capiPurchase24h = capiByType.get("Purchase") ?? 0;

  // ── Retention ────────────────────────────────────────────────────────────
  const retList = (retentionRows.data ?? []) as { total_orders: number; total_spent_cents: number }[];
  const payingCustomers = retList.length;
  const repeatCustomers = retList.filter((c) => Number(c.total_orders) >= 2).length;
  const repeatRatePct   = payingCustomers > 0 ? (repeatCustomers / payingCustomers) * 100 : null;
  const avgLtvCents     = payingCustomers > 0 ? Math.round(retList.reduce((s, c) => s + Number(c.total_spent_cents), 0) / payingCustomers) : 0;
  const ordersPerCust   = payingCustomers > 0 ? retList.reduce((s, c) => s + Number(c.total_orders), 0) / payingCustomers : 0;

  // ── Monthly revenue trend (last ~12 months, SAST) ────────────────────────
  const monthAgg = new Map<string, number>();
  for (const r of (monthTrendRows.data ?? []) as { day: string; paid_revenue_cents: number }[]) {
    const mk = (r.day ?? "").slice(0, 7);
    if (mk) monthAgg.set(mk, (monthAgg.get(mk) ?? 0) + Number(r.paid_revenue_cents));
  }
  const monthSeries = Array.from(monthAgg.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, value]) => ({ day, value }));
  const momGrowthPct = monthSeries.length >= 2 && monthSeries[monthSeries.length - 2].value > 0
    ? ((monthSeries[monthSeries.length - 1].value - monthSeries[monthSeries.length - 2].value) / monthSeries[monthSeries.length - 2].value) * 100
    : null;

  // ── Ad efficiency (blended; lights up when MONTHLY_AD_SPEND_CENTS is set) ──
  const roas        = AD_SPEND_CONFIGURED ? mtdRevenue / MONTHLY_AD_SPEND_CENTS : null;
  const cacCents    = AD_SPEND_CONFIGURED && newCustomers > 0 ? Math.round(MONTHLY_AD_SPEND_CENTS / newCustomers) : null;
  const ltvCacRatio = cacCents != null && cacCents > 0 ? avgLtvCents / cacCents : null;

  // ── Low-data / pre-launch flag (real, non-test orders only) ──────────────
  const preLaunch = mtdOrders === 0 && currentOrders === 0;

  // Insights — rule-based, computed from data we already have.
  const insights = buildInsights({
    reachedSeq, sourceFunnel, product, deviceRows,
    bounceRate, abandonedValueCents: abandonedAgg.items_value_cents,
    conversionRate, prevConversionRate, marginPct,
  });

  // ── Sparkline points (always last 14 days regardless of window)
  const sparkPoints = filled.slice(-14).map((r, i) => ({ x: i, y: Number(r.paid_revenue_cents) }));

  // Funnel for chart — SEQUENTIAL (reached this stage or further), so the
  // stage-to-stage drop-off is real. reachedSeq[0..7] maps to the 8 stages.
  const funnel = [
    { rank: 1, stage: "pageview",           sessions: reachedSeq[0], own: ownStageCounts[0] },
    { rank: 2, stage: "pdp_viewed",         sessions: reachedSeq[1], own: ownStageCounts[1] },
    { rank: 3, stage: "config_started",     sessions: reachedSeq[2], own: ownStageCounts[2] },
    { rank: 4, stage: "config_image",       sessions: reachedSeq[3], own: ownStageCounts[3] },
    { rank: 5, stage: "add_to_cart",        sessions: reachedSeq[4], own: ownStageCounts[4] },
    { rank: 6, stage: "checkout_started",   sessions: reachedSeq[5], own: ownStageCounts[5] },
    { rank: 7, stage: "checkout_submitted", sessions: reachedSeq[6], own: ownStageCounts[6] },
    { rank: 8, stage: "order_paid",         sessions: reachedSeq[7], own: paidSessionIds.size },
  ];

  const loadedAt = Date.now();

  return (
    <div className="space-y-10">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-600">
            Your store at a glance. All times SAST · your own test orders are excluded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            {(liveVisitors ?? 0)} live
          </span>
          <WindowToggle active={windowValue} />
          <RefreshButton initialLoadedAt={loadedAt} />
        </div>
      </header>

      {preLaunch && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
          <span className="font-medium">Pre-launch.</span> No real paid orders yet — your own test orders are excluded from every number here. Treat any trends below as directional until real traffic lands.
        </div>
      )}

      {/* ── Goal + run rate ─────────────────────────────────────────── */}
      <GoalStrip
        mtdRevenue={mtdRevenue}
        mtdOrders={mtdOrders}
        goalCents={MONTHLY_REVENUE_GOAL_CENTS}
        goalPct={goalPct}
        runRate={monthRunRate}
        dayOfMonth={dayOfMonth}
        daysInMonth={daysInMonth}
      />

      {/* ── What to do (auto-surfaced insights) ─────────────────────── */}
      {insights.length > 0 && <InsightsPanel insights={insights} />}

      {/* ── Meta tracking health ────────────────────────────────────── */}
      <MetaHealthCard
        sent24h={capiSent24h}
        failures24h={capiFailures24h}
        purchase24h={capiPurchase24h}
        lastSentAt={capiLastSentAt}
        byType={Array.from(capiByType.entries()).map(([type, count]) => ({ type, count }))}
        paidOrders={currentOrders}
      />

      {/* ── System health (collapsed by default) ────────────────────────
          Operator doesn't need to see every tile every visit. A top-level
          dot summary tells them whether to expand: green = all good, amber =
          something needs attention. Click to expand into the full grid. */}
      {(() => {
        // Pre-compute tones once so the summary dot reflects them.
        const tones: ("ok" | "warn" | "neutral")[] = [
          !lastPaymentEvt.data ? "neutral"
            : ageHours(lastPaymentEvt.data.created_at) > 72 ? "neutral"
            : "ok",
          !lastDrainEvt.data ? "warn"
            : ageHours(lastDrainEvt.data.created_at) > 1 ? "warn"
            : "ok",
          (pendingEmails.count ?? 0) > 20 ? "warn" : "ok",
          !lastReconcileEvt.data ? "warn"
            : ageHours(lastReconcileEvt.data.created_at) > 36 ? "warn"
            : "ok",
          (eventsLastHour.count ?? 0) > 0 ? "ok" : "neutral",
        ];
        const anyWarn   = tones.some((t) => t === "warn");
        const summaryDot = anyWarn ? "bg-amber-500"   : "bg-green-500";
        const summaryTxt = anyWarn ? "Needs attention" : "All systems nominal";

        return (
          <details className="group rounded-xl border border-stone-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-stone-50">
              <div className="flex items-center gap-3">
                <span aria-hidden className={`h-2 w-2 rounded-full ${summaryDot}`} />
                <span className="text-sm font-semibold text-stone-900">System health</span>
                <span className="text-xs text-stone-500">{summaryTxt}</span>
              </div>
              <span aria-hidden className="text-xs text-stone-400 transition-transform group-open:rotate-90">›</span>
            </summary>

            <div className="border-t border-stone-200 p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <HealthTile
                  label="Last paid order"
                  value={lastPaymentEvt.data ? agoString(lastPaymentEvt.data.created_at) : "Never"}
                  tone={tones[0]}
                  sub={lastPaymentEvt.data
                    ? `Webhook fired ${new Date(lastPaymentEvt.data.created_at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                    : "No PayFast ITN received yet"}
                />
                <HealthTile
                  label="Email drainer"
                  value={lastDrainEvt.data ? `Last ran ${agoString(lastDrainEvt.data.created_at)}` : "Never run"}
                  tone={tones[1]}
                  sub={!resendKeySetCheck.set ? "RESEND_API_KEY not set" : "Should run every 5 min"}
                />
                <HealthTile
                  label="Email queue"
                  value={`${pendingEmails.count ?? 0} pending`}
                  tone={tones[2]}
                  sub={(failedEmailsRecent.data?.length ?? 0) > 0
                    ? `${failedEmailsRecent.data?.length} failed in last 24h`
                    : "No failures in last 24h"}
                />
                <HealthTile
                  label="Reconciliation"
                  value={lastReconcileEvt.data ? `Last ran ${agoString(lastReconcileEvt.data.created_at)}` : "Never run"}
                  tone={tones[3]}
                  sub="Cron should hit /api/cron/reconcile-payments daily"
                />
                <HealthTile
                  label="Traffic in last hour"
                  value={`${(eventsLastHour.count ?? 0).toLocaleString()} events`}
                  tone={tones[4]}
                  sub={(eventsLastHour.count ?? 0) > 0
                    ? "Tracker pipeline is alive"
                    : "No traffic yet — pre-launch"}
                />
              </div>

              {(failedEmailsRecent.data?.length ?? 0) > 0 && (
                <details className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-amber-900">
                    Recent email failures ({failedEmailsRecent.data?.length})
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {(failedEmailsRecent.data ?? []).map((r) => (
                      <li key={r.id} className="text-xs text-amber-900/80">
                        <span className="font-mono">{r.type}</span>
                        {" · "}
                        {r.last_attempt_at && new Date(r.last_attempt_at).toLocaleString("en-ZA")}
                        {r.error && <p className="mt-0.5 font-mono text-[11px] text-amber-900/70">{r.error}</p>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </details>
        );
      })()}

      {/* ── At a glance ──────────────────────────────────────────────── */}
      <Section title={win.label} note="All values in SAST">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard
            label="Visitors"
            value={fmtInt(currentVisitors ?? 0)}
            delta={<DeltaIndicator current={currentVisitors ?? 0} previous={previousVisitors ?? 0} label={win.vsLabel} />}
          />
          <StatCard
            label="Conversion rate"
            value={conversionRate > 0 ? `${conversionRate.toFixed(2)}%` : "—"}
            delta={<DeltaIndicator current={Number(conversionRate.toFixed(2))} previous={Number(prevConversionRate.toFixed(2))} label={win.vsLabel} />}
            status={conversionRate >= 2 ? "good" : conversionRate > 0 && conversionRate < 1 ? "bad" : "neutral"}
          />
          <StatCard
            label="Orders"
            value={fmtInt(currentOrders)}
            delta={<DeltaIndicator current={currentOrders} previous={previousOrders} label={win.vsLabel} />}
            sub={currentRefunds > 0 ? `${currentRefunds} refunded` : undefined}
          />
          <StatCard
            label="Revenue"
            value={formatZarCents(currentRevenue)}
            delta={<DeltaIndicator current={currentRevenue} previous={previousRevenue} label={win.vsLabel} />}
            spark={<SparklineChart data={sparkPoints} />}
          />
          <StatCard
            label="Average order"
            value={currentOrders > 0 ? formatZarCents(currentAov) : "—"}
            delta={
              previousOrders > 0
                ? <DeltaIndicator current={currentAov} previous={previousAov} label={win.vsLabel} />
                : <span className="text-xs text-stone-400">{win.vsLabel}</span>
            }
          />
          <StatCard
            label="Bounce rate"
            value={bounceRate == null ? "—" : `${bounceRate.toFixed(1)}%`}
            delta={<span className="text-xs text-stone-500">single-page sessions</span>}
            status={bounceRate == null ? "neutral" : bounceRate >= 70 ? "bad" : bounceRate < 40 ? "good" : "neutral"}
          />
        </div>
      </Section>

      {/* ── Unit economics ───────────────────────────────────────────── */}
      <Section title="Unit economics" note="margin and ad efficiency">
        <UnitEconomics
          marginCents={marginCents}
          marginPct={marginPct}
          netSales={wallpaperRevenue}
          cogsCents={cogsCents}
          costsConfigured={COSTS_CONFIGURED}
          roas={roas}
          cacCents={cacCents}
          ltvCacRatio={ltvCacRatio}
          avgLtvCents={avgLtvCents}
          adSpendConfigured={AD_SPEND_CONFIGURED}
        />
      </Section>

      {/* ── Trend (3 mini charts) ────────────────────────────────────── */}
      <Section title="Daily trend" note={win.label.toLowerCase()}>
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartTile label="Visitors" total={fmtInt(currentVisitors ?? 0)}>
            <LineChart
              data={currentDailySessions}
              height={180}
              color="#3F7CAA"
              fill="rgba(63,124,170,0.12)"
              format="int"
              label="visitors"
            />
          </ChartTile>
          <ChartTile label="Orders" total={fmtInt(currentOrders)}>
            <LineChart
              data={currentRows.map((d) => ({ day: d.day, value: Number(d.paid_orders) }))}
              height={180}
              color="#1A1714"
              fill="rgba(26,23,20,0.08)"
              format="int"
              label="orders"
            />
          </ChartTile>
          <ChartTile label="Revenue" total={formatZarCents(currentRevenue)}>
            <LineChart
              data={currentRows.map((d) => ({ day: d.day, value: Number(d.paid_revenue_cents) }))}
              height={180}
              color="#C4622D"
              fill="rgba(196,98,45,0.10)"
              format="zar_cents"
              label="revenue"
            />
          </ChartTile>
        </div>
      </Section>

      {/* ── Monthly trend ───────────────────────────────────────────── */}
      <Section
        title="Revenue by month"
        note={momGrowthPct != null ? `${momGrowthPct >= 0 ? "+" : ""}${momGrowthPct.toFixed(0)}% vs last month` : "last 12 months"}
      >
        <PanelCard title="Monthly revenue" subtitle="paid revenue per calendar month (SAST), test orders excluded">
          {monthSeries.length === 0 ? (
            <Empty msg="No paid months yet — this fills in as real orders land." />
          ) : (
            <LineChart data={monthSeries} height={200} color="#C4622D" fill="rgba(196,98,45,0.10)" format="zar_cents" label="revenue" />
          )}
        </PanelCard>
      </Section>

      {/* ── Funnel ───────────────────────────────────────────────────── */}
      <Section title="Conversion funnel" note={`sessions reaching each stage · ${win.label.toLowerCase()}`}>
        <FunnelChart data={funnel} />
      </Section>

      {/* ── Channels (funnel + economics by source) ─────────────────── */}
      <Section title="Channels" note="where each source converts">
        <PanelCard title="By source" subtitle="Sessions, funnel rates and revenue per traffic source">
          <ChannelTable rows={sourceFunnel} />
        </PanelCard>
      </Section>

      {/* ── Sample packs (separate funnel; never enter the configurator) ── */}
      <Section title="Sample packs" note="the R150-credit funnel · separate from the wallpaper funnel above">
        <div className="grid gap-4 sm:grid-cols-3">
          <SmallStat label="Sample adds"   value={fmtInt(sampleAdds)}   sub="sessions that added a sample pack" />
          <SmallStat label="Sample orders" value={fmtInt(sampleOrders)} sub={`paid · ${win.label.toLowerCase()}`} />
          <SmallStat
            label="Add → order"
            value={sampleAdds > 0 ? `${Math.round((sampleOrders / sampleAdds) * 100)}%` : "—"}
            sub="sample add to paid sample"
          />
        </div>
      </Section>

      {/* ── Acquisition ──────────────────────────────────────────────── */}
      <Section title="Acquisition" note={win.label.toLowerCase()}>
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelCard title="Top sources" subtitle="Paid orders by UTM source/medium">
            {attribution.length === 0 ? <Empty msg="No paid orders in this window yet." /> : (
              <Table
                head={["Source / Medium", "Orders", "Revenue", "AOV"]}
                rows={attribution.map((r) => ([
                  <div key="src">
                    <div className="font-medium text-stone-900">{r.utm_source}</div>
                    <div className="text-xs text-stone-500">
                      {r.utm_medium}{r.utm_campaign !== "(none)" ? ` · ${r.utm_campaign}` : ""}
                    </div>
                  </div>,
                  fmtInt(r.orders),
                  formatZarCents(r.revenue_cents),
                  formatZarCents(Math.round(r.revenue_cents / r.orders)),
                ]))}
                align={["left", "right", "right", "right"]}
              />
            )}
          </PanelCard>

          <PanelCard title="Devices" subtitle="Sessions by device type">
            <DeviceBars mobile={deviceRows.mobile} desktop={deviceRows.desktop} unknown={deviceRows.unknown} />
          </PanelCard>

          <PanelCard title="Top landing pages" subtitle="First page visited per session">
            {landingRows.length === 0 ? <Empty msg="No landings in this window." /> : (
              <Table
                head={["Path", "Sessions"]}
                rows={landingRows.map((r) => [
                  <code key="p" className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{r.path}</code>,
                  fmtInt(r.sessions),
                ])}
                align={["left", "right"]}
              />
            )}
          </PanelCard>

          <PanelCard title="Top countries" subtitle="From visitor IP">
            {countryRows.length === 0 ? <Empty msg="No geo data yet." /> : (
              <Table
                head={["Country", "Sessions"]}
                rows={countryRows.map((r) => [
                  r.country,
                  fmtInt(r.sessions),
                ])}
                align={["left", "right"]}
              />
            )}
          </PanelCard>
        </div>
      </Section>

      {/* ── Behaviour ──────────────────────────────────────────────── */}
      <Section title="Behaviour" note={win.label.toLowerCase()}>
        <PanelCard title="Top pages" subtitle="Pageviews per path in window">
          {topPagesRows.length === 0 ? <Empty msg="No pageviews yet." /> : (
            <Table
              head={["Path", "Views"]}
              rows={topPagesRows.map((r) => [
                <code key="p" className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{r.path}</code>,
                fmtInt(r.views),
              ])}
              align={["left", "right"]}
            />
          )}
        </PanelCard>
      </Section>

      {/* ── Customers ────────────────────────────────────────────────── */}
      <Section title="Customers" note={win.label.toLowerCase()}>
        <div className="grid gap-6 lg:grid-cols-3">
          <PanelCard title="New vs returning" subtitle="By orders this window">
            <div className="space-y-2">
              <SplitBar
                a={{ label: "New",       value: newCustomers,       color: "bg-pw-accent" }}
                b={{ label: "Returning", value: returningCustomers, color: "bg-stone-700" }}
              />
              {newCustomers === 0 && returningCustomers === 0 && (
                <p className="pt-2 text-sm text-stone-500">No paid wallpaper orders in this window.</p>
              )}
            </div>
          </PanelCard>

          <PanelCard title="Top customers (lifetime)" subtitle="By total spend">
            {(topCustomersRows.data ?? []).length === 0 ? <Empty msg="No customers yet." /> : (
              <Table
                head={["Customer", "Orders", "Lifetime"]}
                rows={(topCustomersRows.data ?? []).map((c) => [
                  <div key="c" className="min-w-0">
                    <Link href={`/admin/customers/${c.id}`} className="block truncate font-medium text-stone-900 hover:text-amber-700">
                      {c.name ?? c.email}
                    </Link>
                    {c.name && <div className="truncate text-xs text-stone-500">{c.email}</div>}
                  </div>,
                  fmtInt(c.total_orders ?? 0),
                  formatZarCents(c.total_spent_cents ?? 0),
                ])}
                align={["left", "right", "right"]}
              />
            )}
          </PanelCard>

          <PanelCard title="Abandoned carts" subtitle="Carts with items, idle ≥ 1h, never paid">
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-semibold tabular-nums text-stone-900">{fmtInt(abandonedAgg.count)}</p>
                <p className="text-sm text-stone-600">≈ {formatZarCents(abandonedAgg.items_value_cents)} of unrealised revenue</p>
              </div>
              {abandonedAgg.items.length > 0 ? (
                <ul className="divide-y divide-stone-100 border-t border-stone-100">
                  {abandonedAgg.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0 truncate text-stone-700">{it.name || it.email || "Guest"}</span>
                      <span className="shrink-0 tabular-nums text-stone-900">{formatZarCents(it.value_cents)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-stone-500">No abandoned carts with items right now.</p>
              )}
              <p className="text-xs text-stone-500">
                Recovery emails are your cheapest revenue (Resend is live) — wire the abandoned-cart flow to win these back.
              </p>
            </div>
          </PanelCard>
        </div>
      </Section>

      {/* ── Retention ────────────────────────────────────────────────── */}
      <Section title="Retention" note="lifetime · paid customers only">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SmallStat label="Paying customers" value={fmtInt(payingCustomers)} sub="placed a paid order" />
          <SmallStat
            label="Repeat rate"
            value={repeatRatePct == null ? "—" : `${repeatRatePct.toFixed(0)}%`}
            sub={`${repeatCustomers} bought 2+ times`}
          />
          <SmallStat
            label="Orders / customer"
            value={payingCustomers > 0 ? ordersPerCust.toFixed(2) : "—"}
            sub="lifetime average"
          />
          <SmallStat
            label="Avg LTV"
            value={payingCustomers > 0 ? formatZarCents(avgLtvCents) : "—"}
            sub="revenue per customer"
          />
        </div>
      </Section>

      {/* ── Install split — primary insight ─────────────────────────── */}
      <Section title="Install method" note="Pro install drives the highest AOV — track its share">
        <div className="grid gap-6 lg:grid-cols-3">
          <PanelCard title="DIY vs Pro" subtitle={`Wallpaper orders · ${win.label.toLowerCase()}`}>
            {totalInstallOrders === 0 ? <Empty msg="No wallpaper orders in this window." /> : (
              <SplitBar
                a={{ label: "DIY",         value: diyOrders, color: "bg-stone-700" }}
                b={{ label: "Pro install", value: proOrders, color: "bg-purple-600" }}
              />
            )}
          </PanelCard>
          <SmallStat
            label="DIY orders"
            value={fmtInt(diyOrders)}
            sub={diyOrders > 0 ? `AOV ${formatZarCents(diyAovCents)}` : "in this window"}
          />
          <SmallStat
            label="Pro install orders"
            value={fmtInt(proOrders)}
            sub={proOrders > 0 ? `AOV ${formatZarCents(proAovCents)} · ${formatZarCents(proRevenue)} total` : "in this window"}
          />
        </div>
      </Section>

      {/* ── Products ─────────────────────────────────────────────────── */}
      <Section title="Product mix" note={`wallpaper only · ${win.label.toLowerCase()}`}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PanelCard title="Finish × install" subtitle="Orders, m², and revenue">
              {product.length === 0 ? <Empty msg="No wallpaper orders in this window." /> : (
                <Table
                  head={COSTS_CONFIGURED ? ["Finish", "Install", "Orders", "m²", "Revenue", "Margin"] : ["Finish", "Install", "Orders", "m²", "Revenue"]}
                  rows={product.map((r) => {
                    const cells: React.ReactNode[] = [
                      <span key="f" className="capitalize">{r.finish}</span>,
                      r.application === "diy" || r.application === "diy_kit"
                        ? <span className="text-stone-700">DIY{r.application === "diy_kit" ? " kit" : ""}</span>
                        : r.application === "pro_installer"
                          ? <span className="font-medium text-purple-700">Pro</span>
                          : r.application,
                      fmtInt(r.orders),
                      r.total_sqm.toFixed(1),
                      formatZarCents(r.revenue_cents),
                    ];
                    if (COSTS_CONFIGURED) {
                      const cogs = ["satin", "matte", "linen"].includes(r.finish)
                        ? (cogsForFinishCents(r.finish as WallpaperMaterial, r.total_sqm, r.orders) ?? null)
                        : null;
                      const mPct = cogs != null && r.revenue_cents > 0 ? ((r.revenue_cents - cogs) / r.revenue_cents) * 100 : null;
                      cells.push(
                        mPct != null
                          ? <span key="m" className={mPct < 30 ? "text-amber-700" : "text-stone-900"}>{`${Math.round(mPct)}%`}</span>
                          : <span key="m" className="text-stone-400">—</span>,
                      );
                    }
                    return cells;
                  })}
                  align={COSTS_CONFIGURED ? ["left", "left", "right", "right", "right", "right"] : ["left", "left", "right", "right", "right"]}
                />
              )}
            </PanelCard>
          </div>

          <div className="space-y-3">
            <SmallStat label="Wallpaper orders"    value={fmtInt(wallpaperOrders)}   sub={`in ${win.label.toLowerCase()}`} />
            <SmallStat label="Avg order m²"        value={avgOrderSqm.toFixed(2)}    sub="per wallpaper order" />
            <SmallStat label="Total m² printed"    value={totalSqm.toFixed(1)}       sub={win.label.toLowerCase()} />
          </div>
        </div>
      </Section>

      {/* ── Finances ─────────────────────────────────────────────────── */}
      <Section title="Finances" note="Estimates based on PayFast standard rate (3.5% + R2)">
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelCard title="Sales" subtitle={win.label.toLowerCase()}>
            <FinanceTable rows={[
              ["Gross sales (subtotal + discounts)", grossSales],
              ["Discounts",                          -discountsTotal],
              ["Net sales (subtotal)",               netSales],
              ["Shipping collected",                 shippingTotal],
              ["Refunds",                            -refundsTotal],
              ["Total collected",                    totalCollected],
            ]} />
            {discountAgg.count > 0 && (
              <p className="mt-3 text-xs text-stone-500">
                {discountAgg.count} order{discountAgg.count === 1 ? "" : "s"} used a discount code · total {formatZarCents(discountAgg.total_cents)}
              </p>
            )}
          </PanelCard>

          <PanelCard title="Estimated payouts" subtitle={`PayFast fees + VAT (${(VAT_PCT * 100).toFixed(0)}% if registered)`}>
            <FinanceTable rows={[
              ["Total collected",                  totalCollected],
              ["Estimated card fees (3.5% + R2)",  -cardFees],
              ["Estimated net deposit",            netDeposit],
            ]} />
            <FinanceTable rows={[
              ["VAT-inclusive subtotal",           netSales],
              ["Estimated VAT (15%) if registered", vatEstimate],
              ["Net of VAT",                       netSales - vatEstimate],
            ]} className="mt-4" />
            <p className="mt-3 text-xs text-stone-500">
              Fees and VAT are <strong>estimates</strong>. Real PayFast settlement may vary by plan;
              VAT applies only if you are registered for it. Source the exact numbers from your
              PayFast dashboard for tax submission.
            </p>
          </PanelCard>
        </div>
      </Section>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Building blocks
// ──────────────────────────────────────────────────────────────────────────

function Section({
  title, note, children,
}: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        {note && <span className="text-xs text-stone-500">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function PanelCard({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label, value, delta, sub, spark, status = "neutral",
}: {
  label: string;
  value: string;
  delta: React.ReactNode;
  sub?:  string;
  spark?: React.ReactNode;
  /** Threshold colour for the value: good=green, bad=red, neutral=ink. */
  status?: "good" | "bad" | "neutral";
}) {
  const valueColor = status === "good" ? "text-green-700" : status === "bad" ? "text-red-700" : "text-stone-900";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
        {spark}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        {delta}
        {sub && <span className="text-xs text-stone-500">{sub}</span>}
      </div>
    </div>
  );
}

function ChartTile({ label, total, children }: { label: string; total: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
        <p className="text-base font-semibold tabular-nums text-stone-900">{total}</p>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="py-2 text-sm text-stone-500">{msg}</p>;
}

function Table({
  head, rows, align,
}: {
  head:  string[];
  rows:  React.ReactNode[][];
  align: ("left" | "right" | "center")[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200">
      <table className="min-w-full divide-y divide-stone-200">
        <thead className="bg-stone-50">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={`px-3 py-2 text-${align[i]} text-xs font-semibold uppercase tracking-wider text-stone-500`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-stone-50">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2 text-${align[ci]} text-sm tabular-nums text-stone-700`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FinanceTable({
  rows, className = "",
}: {
  rows: [label: string, cents: number][];
  className?: string;
}) {
  return (
    <table className={`w-full ${className}`}>
      <tbody>
        {rows.map(([label, cents], i) => {
          const isLast = i === rows.length - 1;
          const negative = cents < 0;
          return (
            <tr key={label} className={isLast ? "border-t border-stone-300" : "border-t border-stone-100"}>
              <td className={`py-2 text-sm ${isLast ? "font-semibold text-stone-900" : "text-stone-700"}`}>{label}</td>
              <td className={`py-2 text-right text-sm tabular-nums ${isLast ? "font-semibold text-stone-900" : negative ? "text-red-700" : "text-stone-900"}`}>
                {negative ? `-${formatZarCents(Math.abs(cents))}` : formatZarCents(cents)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DeviceBars({ mobile, desktop, unknown }: { mobile: number; desktop: number; unknown: number }) {
  const total = mobile + desktop + unknown;
  if (total === 0) return <Empty msg="No sessions in this window." />;
  const segs = [
    { label: "Mobile",  value: mobile,  color: "bg-pw-accent" },
    { label: "Desktop", value: desktop, color: "bg-stone-700" },
    { label: "Unknown", value: unknown, color: "bg-stone-300" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
        {segs.map((s) => (
          <div key={s.label} className={s.color} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segs.filter((s) => s.value > 0).map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-stone-700">
            <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-sm ${s.color}`} />
            {s.label} <span className="text-stone-500">{s.value} ({((s.value / total) * 100).toFixed(0)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SplitBar({
  a, b,
}: {
  a: { label: string; value: number; color: string };
  b: { label: string; value: number; color: string };
}) {
  const total = a.value + b.value;
  if (total === 0) return null;
  const pa = (a.value / total) * 100;
  const pb = 100 - pa;
  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={a.color} style={{ width: `${pa}%` }} />
        <div className={b.color} style={{ width: `${pb}%` }} />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-stone-700">{a.label} <span className="font-semibold text-stone-900">{a.value}</span> · {pa.toFixed(0)}%</span>
        <span className="text-stone-700">{b.label} <span className="font-semibold text-stone-900">{b.value}</span> · {pb.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function SmallStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function HealthTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "ok" | "warn" | "neutral" }) {
  const ringCls = tone === "warn" ? "ring-amber-300" : tone === "ok" ? "ring-green-200" : "ring-stone-200";
  const dotCls  = tone === "warn" ? "bg-amber-500"   : tone === "ok" ? "bg-green-500"   : "bg-stone-400";
  return (
    <div className={`rounded-xl bg-white p-4 ring-1 ${ringCls}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-2 w-2 rounded-full ${dotCls}`} />
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      </div>
      <p className="mt-1.5 text-base font-semibold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function ageHours(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000);
}

function agoString(iso: string): string {
  const h = ageHours(iso);
  if (h < 1)  return `${Math.max(1, Math.floor(h * 60))} min ago`;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

// ──────────────────────────────────────────────────────────────────────────
// Command center: goal, insights, channels, unit economics
// ──────────────────────────────────────────────────────────────────────────

function GoalStrip({
  mtdRevenue, mtdOrders, goalCents, goalPct, runRate, dayOfMonth, daysInMonth,
}: {
  mtdRevenue: number; mtdOrders: number; goalCents: number;
  goalPct: number | null; runRate: number; dayOfMonth: number; daysInMonth: number;
}) {
  const hasGoal = goalCents > 0 && goalPct != null;
  const onPace  = hasGoal && runRate >= goalCents;
  const pct     = hasGoal ? Math.min(100, Math.max(0, goalPct as number)) : 0;
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Revenue this month</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{formatZarCents(mtdRevenue)}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {mtdOrders} order{mtdOrders === 1 ? "" : "s"} · day {dayOfMonth} of {daysInMonth}
          </p>
        </div>
        {hasGoal ? (
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${onPace ? "bg-green-50 text-green-700 ring-green-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${onPace ? "bg-green-500" : "bg-amber-500"}`} />
              {onPace ? "On pace" : "Behind pace"}
            </span>
            <p className="mt-1 text-xs text-stone-500">Run rate {formatZarCents(runRate)} / {formatZarCents(goalCents)}</p>
          </div>
        ) : (
          <p className="max-w-xs text-right text-xs text-stone-500">
            Run rate {formatZarCents(runRate)}/mo. Set MONTHLY_REVENUE_GOAL_CENTS in analytics-config.ts to track pace.
          </p>
        )}
      </div>
      {hasGoal && (
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-pw-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-stone-500">
            <span>{(goalPct as number).toFixed(0)}% to goal</span>
            <span>{formatZarCents(goalCents)} target</span>
          </div>
        </div>
      )}
    </div>
  );
}

type Insight = { tone: "danger" | "warn" | "info"; title: string; text: string };

function InsightsPanel({ insights }: { insights: Insight[] }) {
  const dot: Record<Insight["tone"], string> = {
    danger: "bg-red-500", warn: "bg-amber-500", info: "bg-blue-500",
  };
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-900">What to do</h2>
      <ul className="mt-3 space-y-3">
        {insights.map((ins, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[ins.tone]}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900">{ins.title}</p>
              {ins.text && <p className="text-sm text-stone-600">{ins.text}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetaHealthCard({
  sent24h, failures24h, purchase24h, lastSentAt, byType, paidOrders,
}: {
  sent24h: number; failures24h: number; purchase24h: number;
  lastSentAt: string | null; byType: { type: string; count: number }[]; paidOrders: number;
}) {
  // Warn if real paid orders happened but no Purchase reached Meta, or any send failed.
  const missingPurchase = paidOrders > 0 && purchase24h === 0;
  const tone = failures24h > 0 || missingPurchase ? "warn" : sent24h > 0 ? "ok" : "neutral";
  const dot  = tone === "warn" ? "bg-amber-500" : tone === "ok" ? "bg-green-500" : "bg-stone-400";
  const headline = tone === "warn"
    ? (missingPurchase ? "Paid orders aren't reaching Meta" : `${failures24h} CAPI send${failures24h === 1 ? "" : "s"} failed in 24h`)
    : sent24h > 0 ? "Server tracking healthy" : "No server events in the last 24h";
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
          <h2 className="text-sm font-semibold text-stone-900">Meta tracking (Conversions API)</h2>
          <span className="text-xs text-stone-500">{headline}</span>
        </div>
        <span className="text-xs text-stone-500">
          {lastSentAt ? `Last send ${agoString(lastSentAt)}` : "No sends yet"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Sent 24h"     value={fmtInt(sent24h)} />
        <MiniStat label="Purchase 24h" value={fmtInt(purchase24h)} />
        <MiniStat label="Failed 24h"   value={fmtInt(failures24h)} tone={failures24h > 0 ? "warn" : undefined} />
        <MiniStat label="Event types"  value={byType.length ? byType.map((b) => `${b.type} ${b.count}`).join(" · ") : "—"} small />
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone, small }: { label: string; value: string; tone?: "warn"; small?: boolean }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-1 ${small ? "text-xs leading-snug" : "text-lg"} font-semibold tabular-nums ${tone === "warn" ? "text-amber-700" : "text-stone-900"}`}>{value}</p>
    </div>
  );
}

function ChannelTable({
  rows,
}: {
  rows: { source: string; landed: number; config: number; cart: number; paid: number; revenue_cents: number }[];
}) {
  if (rows.length === 0) return <Empty msg="No traffic in this window yet." />;
  const pctOf = (n: number, dnm: number) => (dnm > 0 ? `${Math.round((n / dnm) * 100)}%` : "—");
  return (
    <div>
      <Table
        head={["Source", "Sessions", "Config", "Cart", "Orders", "CR", "Revenue", "ROAS"]}
        rows={rows.map((r) => ([
          <span key="s" className="font-medium text-stone-900">{r.source}</span>,
          fmtInt(r.landed),
          pctOf(r.config, r.landed),
          pctOf(r.cart, r.landed),
          fmtInt(r.paid),
          <span key="cr" className={r.paid > 0 ? "font-medium text-stone-900" : "text-stone-400"}>{pctOf(r.paid, r.landed)}</span>,
          formatZarCents(r.revenue_cents),
          <span key="roas" className="text-stone-400">—</span>,
        ]))}
        align={["left", "right", "right", "right", "right", "right", "right", "right"]}
      />
      <p className="mt-3 text-xs text-stone-500">
        Add ad spend per source to unlock ROAS, CAC and profit per channel.
      </p>
    </div>
  );
}

function Configure({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3">
      <p className="text-sm text-stone-600">{text}</p>
    </div>
  );
}

function UnitEconomics({
  marginCents, marginPct, netSales, cogsCents, costsConfigured,
  roas, cacCents, ltvCacRatio, avgLtvCents, adSpendConfigured,
}: {
  marginCents: number | null; marginPct: number | null; netSales: number;
  cogsCents: number | null; costsConfigured: boolean;
  roas: number | null; cacCents: number | null; ltvCacRatio: number | null;
  avgLtvCents: number; adSpendConfigured: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PanelCard title="Contribution margin" subtitle={costsConfigured ? "net sales minus cost of goods" : "needs unit costs"}>
        {costsConfigured && marginPct != null ? (
          <div>
            <p className={`text-2xl font-semibold tabular-nums ${marginPct < 30 ? "text-amber-700" : "text-stone-900"}`}>{marginPct.toFixed(0)}%</p>
            <p className="mt-1 text-sm text-stone-600">{formatZarCents(marginCents ?? 0)} margin on {formatZarCents(netSales)} net sales</p>
            <p className="mt-0.5 text-xs text-stone-500">Cost of goods {formatZarCents(cogsCents ?? 0)}</p>
          </div>
        ) : (
          <Configure text="Add cost per m² per finish in analytics-config.ts to see gross margin per order and per finish." />
        )}
      </PanelCard>
      <PanelCard title="Blended ROAS &amp; CAC" subtitle="this month vs ad spend">
        {adSpendConfigured && roas != null ? (
          <div>
            <p className={`text-2xl font-semibold tabular-nums ${roas >= 2 ? "text-green-700" : roas < 1 ? "text-red-700" : "text-stone-900"}`}>{roas.toFixed(2)}×</p>
            <p className="mt-1 text-sm text-stone-600">revenue per R1 of ad spend</p>
            <p className="mt-0.5 text-xs text-stone-500">{cacCents != null ? `CAC ${formatZarCents(cacCents)} / new customer` : "CAC needs new customers this month"}</p>
          </div>
        ) : (
          <Configure text="Set MONTHLY_AD_SPEND_CENTS in analytics-config.ts to compute blended ROAS and CAC." />
        )}
      </PanelCard>
      <PanelCard title="LTV : CAC" subtitle="payback health">
        {adSpendConfigured && ltvCacRatio != null ? (
          <div>
            <p className={`text-2xl font-semibold tabular-nums ${ltvCacRatio >= 3 ? "text-green-700" : ltvCacRatio < 1 ? "text-red-700" : "text-stone-900"}`}>{ltvCacRatio.toFixed(1)} : 1</p>
            <p className="mt-1 text-sm text-stone-600">avg LTV {formatZarCents(avgLtvCents)} vs CAC {cacCents != null ? formatZarCents(cacCents) : "—"}</p>
            <p className="mt-0.5 text-xs text-stone-500">3:1 or better is healthy</p>
          </div>
        ) : (
          <Configure text="Unlocks once ad spend is set, using lifetime value from the customers table." />
        )}
      </PanelCard>
    </div>
  );
}

function buildInsights(d: {
  reachedSeq: number[];
  sourceFunnel: { source: string; landed: number; config: number; cart: number; paid: number; revenue_cents: number }[];
  product: { finish: string; application: string; orders: number; revenue_cents: number; total_sqm: number }[];
  deviceRows: { mobile: number; desktop: number; unknown: number };
  bounceRate: number | null;
  abandonedValueCents: number;
  conversionRate: number;
  prevConversionRate: number;
  marginPct: number | null;
}): Insight[] {
  const out: Insight[] = [];
  const STAGE_LABELS = ["pageviews", "PDP views", "configurator opens", "image uploads", "add-to-cart", "checkout starts", "checkout submits", "paid orders"];
  const totalSessions = d.reachedSeq[0] ?? 0;

  if (totalSessions < 5) {
    return [{ tone: "info", title: "Not enough traffic yet", text: "Insights sharpen once a few dozen sessions land. The tracking pipeline is live." }];
  }

  // Biggest funnel leak (largest % drop where the prior stage has real volume)
  let worst = { drop: 0, from: -1 };
  for (let i = 1; i < d.reachedSeq.length; i++) {
    const prev = d.reachedSeq[i - 1], cur = d.reachedSeq[i];
    if (prev >= 15) { const drop = (prev - cur) / prev; if (drop > worst.drop) worst = { drop, from: i - 1 }; }
  }
  if (worst.from >= 0 && worst.drop >= 0.5) {
    out.push({
      tone: worst.drop >= 0.8 ? "danger" : "warn",
      title: `Biggest drop-off: ${STAGE_LABELS[worst.from]} to ${STAGE_LABELS[worst.from + 1]}`,
      text: `${Math.round(worst.drop * 100)}% of sessions are lost at this step. Best place to focus CRO next.`,
    });
  }

  // Source conversion spread
  const sized = d.sourceFunnel.filter((s) => s.landed >= 15 && s.source !== "(direct)");
  if (sized.length >= 1) {
    const withCr = sized.map((s) => ({ ...s, cr: s.paid / s.landed })).sort((a, b) => b.cr - a.cr);
    const best = withCr[0];
    if (best.paid > 0) out.push({ tone: "info", title: `${best.source} is your best-converting source`, text: `${(best.cr * 100).toFixed(1)}% of its sessions buy. Lean into what works there.` });
    const worstSrc = withCr[withCr.length - 1];
    if (withCr.length >= 2 && worstSrc.cr < best.cr / 3 && worstSrc.landed >= 25) {
      out.push({ tone: "warn", title: `${worstSrc.source} converts poorly`, text: `${worstSrc.landed} sessions at ${(worstSrc.cr * 100).toFixed(1)}% CR. Rework the creative or cut the spend.` });
    }
  }

  // Highest-AOV finish that is under-exposed
  const finishAgg = new Map<string, { orders: number; revenue: number }>();
  for (const p of d.product) {
    const curr = finishAgg.get(p.finish) ?? { orders: 0, revenue: 0 };
    curr.orders += p.orders; curr.revenue += p.revenue_cents;
    finishAgg.set(p.finish, curr);
  }
  const finishes = Array.from(finishAgg.entries()).map(([finish, v]) => ({ finish, aov: v.orders > 0 ? v.revenue / v.orders : 0, orders: v.orders }));
  const totalFinishOrders = finishes.reduce((s, f) => s + f.orders, 0);
  if (totalFinishOrders >= 5) {
    const topAov = [...finishes].sort((a, b) => b.aov - a.aov)[0];
    const share = topAov.orders / totalFinishOrders;
    if (topAov.aov > 0 && share < 0.4) {
      out.push({ tone: "info", title: `${cap(topAov.finish)} has the highest average order`, text: `${formatZarCents(Math.round(topAov.aov))} per order but only ${Math.round(share * 100)}% of orders. Worth featuring higher.` });
    }
  }

  // Mobile share
  const devTotal = d.deviceRows.mobile + d.deviceRows.desktop + d.deviceRows.unknown;
  if (devTotal >= 20) {
    const mobShare = d.deviceRows.mobile / devTotal;
    if (mobShare >= 0.6) out.push({ tone: "info", title: `${Math.round(mobShare * 100)}% of traffic is on mobile`, text: "Mobile is where the money is. Keep the mobile configurator and checkout sharp." });
  }

  // Abandoned cart value
  if (d.abandonedValueCents >= 100000) {
    out.push({ tone: "warn", title: `${formatZarCents(d.abandonedValueCents)} sitting in abandoned carts`, text: "Abandoned-cart recovery email is your cheapest revenue. Wire it up and shorten the cron." });
  }

  // High bounce
  if (d.bounceRate != null && d.bounceRate >= 70 && totalSessions >= 30) {
    out.push({ tone: "warn", title: `Bounce rate is ${d.bounceRate.toFixed(0)}%`, text: "Most sessions leave after one page. Check landing relevance and load speed." });
  }

  // Margin
  if (d.marginPct != null && d.marginPct < 30) {
    out.push({ tone: "warn", title: `Contribution margin is ${d.marginPct.toFixed(0)}%`, text: "Thin for a made-to-order product. Revisit pricing or the cost basis." });
  }

  // Conversion trend
  if (d.prevConversionRate > 0 && d.conversionRate > 0 && d.conversionRate < d.prevConversionRate * 0.7) {
    out.push({ tone: "warn", title: "Conversion rate is dropping", text: `Down to ${d.conversionRate.toFixed(2)}% from ${d.prevConversionRate.toFixed(2)}% the prior period.` });
  }

  const rank: Record<Insight["tone"], number> = { danger: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 5);
}
