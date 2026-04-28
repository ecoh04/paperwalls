import { createClient } from "@/lib/supabase/server";
import { formatZarCents } from "@/lib/admin-labels";
import { LineChart } from "@/components/admin/charts/LineChart";
import { FunnelChart } from "@/components/admin/charts/FunnelChart";
import { SparklineChart } from "@/components/admin/charts/SparklineChart";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { WindowToggle } from "@/components/admin/WindowToggle";
import { WINDOW_OPTIONS, type WindowValue } from "@/components/admin/window-options";
import { DeltaIndicator } from "@/components/admin/DeltaIndicator";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = { window?: string };

const SAST       = "Africa/Johannesburg";
const FEE_PCT    = 0.035;          // PayFast standard rate (incl. card networks)
const FEE_FIXED  = 200;            // 200 cents per transaction
const VAT_PCT    = 0.15;           // SA VAT, only relevant if registered

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

  // Split current / previous windows
  const winStartKey  = filled[Math.max(0, filled.length - win.chartDays)]?.day ?? filled[0]?.day;
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
    funnelCounts,
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
  ] = await Promise.all([
    // Current + previous + live visitor counts
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.start),
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.prevStart).lt("first_seen_at", win.start),
    supabase.from("sessions").select("id", { count: "exact", head: true })
      .gte("last_seen_at", liveCutoff),

    // Funnel: distinct sessions per stage
    (async () => {
      const types = [
        ["page.viewed"],
        ["config.viewed"],
        ["config.added_to_cart"],
        ["checkout.started"],
      ] as const;
      const results = await Promise.all(
        types.map(async (typeList) => {
          const { data } = await supabase
            .from("events")
            .select("session_id")
            .in("type", typeList as unknown as string[])
            .gte("created_at", win.start)
            .not("session_id", "is", null);
          return new Set((data ?? []).map((r) => r.session_id as string)).size;
        })
      );
      return { pageviews: results[0], configStarted: results[1], addedToCart: results[2], checkoutStarted: results[3] };
    })(),

    // Window's sessions for landing page / device / country aggregations + daily count
    supabase.from("sessions")
      .select("id, first_seen_at, landing_page, country, user_agent")
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

    // Abandoned carts: cart rows older than 1h with no orders + items, in window
    (async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: carts } = await supabase
        .from("carts")
        .select("id, updated_at, status")
        .gte("updated_at", win.start)
        .lt("updated_at", oneHourAgo)
        .neq("status", "converted");
      const cartIds = ((carts ?? []) as { id: string }[]).map((c) => c.id);
      if (cartIds.length === 0) return { count: 0, items_value_cents: 0 };
      const { data: items } = await supabase
        .from("cart_items")
        .select("cart_id, subtotal_cents")
        .in("cart_id", cartIds);
      // Only carts that actually had items
      const cartsWithItems = new Set(((items ?? []) as { cart_id: string }[]).map((i) => i.cart_id));
      const value = ((items ?? []) as { cart_id: string; subtotal_cents: number }[])
        .reduce((s, i) => s + Number(i.subtotal_cents), 0);
      return { count: cartsWithItems.size, items_value_cents: value };
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
      .is("deleted_at", null),

    // Product mix
    supabase.from("orders")
      .select("wallpaper_style, application_method, total_cents, total_sqm, customer_id")
      .eq("product_type", "wallpaper")
      .gte("created_at", win.start)
      .not("status", "in", "(pending,cancelled)")
      .is("refunded_at", null)
      .is("deleted_at", null),

    // Discount usage (separate aggregation across all orders in window)
    (async () => {
      const { data } = await supabase.from("orders")
        .select("discount_cents, discount_code")
        .gte("created_at", win.start)
        .gt("discount_cents", 0)
        .is("deleted_at", null);
      const totalDiscount = ((data ?? []) as { discount_cents: number }[])
        .reduce((s, r) => s + Number(r.discount_cents), 0);
      return { count: (data ?? []).length, total_cents: totalDiscount };
    })(),
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
  const diyOrders = product.filter((p) => p.application === "diy")
    .reduce((s, r) => s + r.orders, 0);
  const diyRevenue = product.filter((p) => p.application === "diy")
    .reduce((s, r) => s + r.revenue_cents, 0);
  const proOrders = product.filter((p) => p.application === "pro_installer" || p.application === "installer")
    .reduce((s, r) => s + r.orders, 0);
  const proRevenue = product.filter((p) => p.application === "pro_installer" || p.application === "installer")
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

  // ── Sparkline points (always last 14 days regardless of window)
  const sparkPoints = filled.slice(-14).map((r, i) => ({ x: i, y: Number(r.paid_revenue_cents) }));

  // Funnel for chart
  const funnel = [
    { rank: 1, stage: "pageview",         sessions: funnelCounts.pageviews },
    { rank: 2, stage: "config_started",   sessions: funnelCounts.configStarted },
    { rank: 3, stage: "add_to_cart",      sessions: funnelCounts.addedToCart },
    { rank: 4, stage: "checkout_started", sessions: funnelCounts.checkoutStarted },
    { rank: 5, stage: "order_paid",       sessions: currentOrders },
  ];

  const loadedAt = Date.now();

  return (
    <div className="space-y-10">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-600">
            First-party data from your own events table. No ad-blocker loss, no consent throttling.
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
            goodIfUp={false}
          />
        </div>
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

      {/* ── Funnel ───────────────────────────────────────────────────── */}
      <Section title="Conversion funnel" note={`unique sessions per stage · ${win.label.toLowerCase()}`}>
        <FunnelChart data={funnel} />
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
            <div className="space-y-2">
              <p className="text-3xl font-semibold tabular-nums text-stone-900">{fmtInt(abandonedAgg.count)}</p>
              <p className="text-sm text-stone-600">
                ≈ {formatZarCents(abandonedAgg.items_value_cents)} of unrealised revenue
              </p>
              <p className="text-xs text-stone-500">
                Abandoned-cart email recovery: configure once cron + Resend are wired.
              </p>
            </div>
          </PanelCard>
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
                  head={["Finish", "Install", "Orders", "m²", "Revenue"]}
                  rows={product.map((r) => [
                    <span key="f" className="capitalize">{r.finish}</span>,
                    r.application === "diy"
                      ? <span className="text-stone-700">DIY</span>
                      : r.application === "pro_installer" || r.application === "installer"
                        ? <span className="font-medium text-purple-700">Pro</span>
                        : r.application,
                    fmtInt(r.orders),
                    r.total_sqm.toFixed(1),
                    formatZarCents(r.revenue_cents),
                  ])}
                  align={["left", "left", "right", "right", "right"]}
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

      {/* ── Profit (placeholder) ─────────────────────────────────────── */}
      <Section title="Profit & margin" note="needs cost data">
        <PanelCard
          title="Configure costs to see margin"
          subtitle="Cost per m² per finish, fulfilment cost, packaging cost"
        >
          <p className="text-sm text-stone-600">
            We can compute gross margin and per-finish profit once you give us the unit costs
            for satin / matte / linen and the fulfilment overhead. Lives outside this dashboard
            so you don&rsquo;t expose your margins to anyone with admin access by accident.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            <span className="font-medium text-stone-900">{formatZarCents(totalCollected)}</span> collected this window.
            Subtract your cost basis to see margin.
          </p>
        </PanelCard>
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
  label, value, delta, sub, spark,
}: {
  label: string;
  value: string;
  delta: React.ReactNode;
  sub?:  string;
  spark?: React.ReactNode;
  goodIfUp?: boolean;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tabular-nums text-stone-900">{value}</p>
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
