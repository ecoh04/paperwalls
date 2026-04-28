import { createClient } from "@/lib/supabase/server";
import { formatZarCents } from "@/lib/admin-labels";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { FunnelChart } from "@/components/admin/charts/FunnelChart";
import { SparklineChart } from "@/components/admin/charts/SparklineChart";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { WindowToggle, type WindowValue, WINDOW_OPTIONS } from "@/components/admin/WindowToggle";
import { DeltaIndicator } from "@/components/admin/DeltaIndicator";

export const dynamic = "force-dynamic";

type SearchParams = { window?: string };

const SAST = "Africa/Johannesburg";

// ──────────────────────────────────────────────────────────────────────────
// Window math — all in SAST, where the buyer lives. UTC days would slice a
// SA buyer ordering at 23:30 onto the wrong day.
// ──────────────────────────────────────────────────────────────────────────

type WindowSpec = {
  /** Inclusive start as ISO timestamp (UTC). */
  start:        string;
  /** Inclusive start of the previous comparison window. */
  prevStart:    string;
  /** Number of SAST-days the chart should render. */
  chartDays:    number;
  /** Human label for the window. */
  label:        string;
  /** Suffix for the delta indicator. */
  vsLabel:      string;
};

function todayInSast(): Date {
  const now = new Date();
  // Build a Date that's midnight SAST today, expressed as UTC.
  const sastFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAST,
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const ymd = sastFmt.format(now); // YYYY-MM-DD in SAST
  // SAST = UTC+2 fixed (no DST), so midnight SAST = 22:00 UTC the previous day.
  const midnightSast = new Date(`${ymd}T00:00:00+02:00`);
  return midnightSast;
}

function buildWindow(value: WindowValue): WindowSpec {
  const todayStartUtc = todayInSast();
  const day = 24 * 60 * 60 * 1000;

  switch (value) {
    case "today":
      return {
        start:     todayStartUtc.toISOString(),
        prevStart: new Date(todayStartUtc.getTime() - day).toISOString(),
        chartDays: 7,
        label:     "Today",
        vsLabel:   "vs yesterday",
      };
    case "7d":
      return {
        start:     new Date(todayStartUtc.getTime() - 6  * day).toISOString(),
        prevStart: new Date(todayStartUtc.getTime() - 13 * day).toISOString(),
        chartDays: 7,
        label:     "Last 7 days",
        vsLabel:   "vs prior 7d",
      };
    case "30d":
      return {
        start:     new Date(todayStartUtc.getTime() - 29 * day).toISOString(),
        prevStart: new Date(todayStartUtc.getTime() - 59 * day).toISOString(),
        chartDays: 30,
        label:     "Last 30 days",
        vsLabel:   "vs prior 30d",
      };
    case "90d":
      return {
        start:     new Date(todayStartUtc.getTime() - 89  * day).toISOString(),
        prevStart: new Date(todayStartUtc.getTime() - 179 * day).toISOString(),
        chartDays: 90,
        label:     "Last 90 days",
        vsLabel:   "vs prior 90d",
      };
  }
}

function isWindowValue(s: string | undefined): s is WindowValue {
  return WINDOW_OPTIONS.some((o) => o.value === s);
}

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const windowValue: WindowValue = isWindowValue(params.window) ? params.window : "30d";
  const win  = buildWindow(windowValue);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Please log in to view analytics.</p>
      </div>
    );
  }

  // ── Daily revenue (SAST), enough days to render the chart + sparkline + previous window
  const sparkLookbackStart = new Date(new Date(win.prevStart).getTime()).toISOString().slice(0, 10);
  const { data: revRows } = await supabase
    .from("v_daily_revenue")
    .select("day, paid_orders, paid_revenue_cents, refunded_orders")
    .gte("day", sparkLookbackStart)
    .order("day", { ascending: true });

  type DailyRev = { day: string; paid_orders: number; paid_revenue_cents: number; refunded_orders: number };
  const daily = (revRows ?? []) as DailyRev[];

  // Backfill missing days with zero so the chart is continuous.
  const filled: DailyRev[] = [];
  const map = new Map<string, DailyRev>();
  for (const r of daily) map.set(r.day, r);

  // Build all days from prevStart to today (inclusive).
  const dayMs = 24 * 60 * 60 * 1000;
  const startMs = new Date(win.prevStart).getTime();
  const todayMs = todayInSast().getTime();
  for (let t = startMs; t <= todayMs; t += dayMs) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: SAST, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(new Date(t));
    filled.push(map.get(key) ?? { day: key, paid_orders: 0, paid_revenue_cents: 0, refunded_orders: 0 });
  }

  // Split into current and previous windows by date.
  const winStartKey = filled[Math.max(0, filled.length - win.chartDays)]?.day ?? filled[0]?.day;
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

  // ── Visitors: distinct sessions in the window
  const [{ count: currentVisitors }, { count: previousVisitors }] = await Promise.all([
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.start),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .gte("first_seen_at", win.prevStart)
      .lt("first_seen_at",  win.start),
  ]);

  // ── Funnel: distinct sessions that hit each step in the window.
  // We deliberately use config.added_to_cart (single fire per add) NOT
  // cart.updated (fires on every mutation incl. removal).
  async function distinctSessionsInWindow(types: string[]): Promise<number> {
    if (types.length === 0) return 0;
    const { data } = await supabase
      .from("events")
      .select("session_id")
      .in("type", types)
      .gte("created_at", win.start)
      .not("session_id", "is", null);
    return new Set((data ?? []).map((r) => r.session_id as string)).size;
  }

  const [pageviews, configStarted, addedToCart, checkoutStarted] = await Promise.all([
    distinctSessionsInWindow(["page.viewed"]),
    distinctSessionsInWindow(["config.viewed"]),
    distinctSessionsInWindow(["config.added_to_cart"]),
    distinctSessionsInWindow(["checkout.started"]),
  ]);

  const funnel = [
    { rank: 1, stage: "pageview",         sessions: pageviews },
    { rank: 2, stage: "config_started",   sessions: configStarted },
    { rank: 3, stage: "add_to_cart",      sessions: addedToCart },
    { rank: 4, stage: "checkout_started", sessions: checkoutStarted },
    { rank: 5, stage: "order_paid",       sessions: currentOrders },
  ];

  // ── Attribution: revenue by UTM (current window, paid only).
  const { data: attribRowsRaw } = await supabase
    .from("orders")
    .select("utm_source, utm_medium, utm_campaign, total_cents")
    .gte("created_at", win.start)
    .not("status", "in", "(pending,cancelled)")
    .is("refunded_at", null)
    .is("deleted_at", null);

  type OrderUtm = { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; total_cents: number };
  const attribAgg = new Map<string, { utm_source: string; utm_medium: string; utm_campaign: string; orders: number; revenue_cents: number }>();
  for (const r of (attribRowsRaw ?? []) as OrderUtm[]) {
    const src = r.utm_source   || "(direct)";
    const med = r.utm_medium   || "(none)";
    const cmp = r.utm_campaign || "(none)";
    const k   = `${src}|${med}|${cmp}`;
    const cur = attribAgg.get(k);
    if (cur) {
      cur.orders        += 1;
      cur.revenue_cents += Number(r.total_cents);
    } else {
      attribAgg.set(k, { utm_source: src, utm_medium: med, utm_campaign: cmp, orders: 1, revenue_cents: Number(r.total_cents) });
    }
  }
  const attribution = Array.from(attribAgg.values())
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 10);

  // ── Product mix: finish + install, wallpaper-only, paid in window.
  const { data: productRows } = await supabase
    .from("orders")
    .select("wallpaper_style, application_method, total_cents, total_sqm")
    .eq("product_type", "wallpaper")
    .gte("created_at", win.start)
    .not("status", "in", "(pending,cancelled)")
    .is("refunded_at", null)
    .is("deleted_at", null);

  type ProductRow = { wallpaper_style: string | null; application_method: string | null; total_cents: number; total_sqm: number | null };
  const productAgg = new Map<string, { finish: string; application: string; orders: number; revenue_cents: number; total_sqm: number }>();
  for (const r of (productRows ?? []) as ProductRow[]) {
    const f = r.wallpaper_style    || "unknown";
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

  // Sparkline points for the revenue stat card (always last 14 days regardless of window).
  const sparkPoints = filled
    .slice(-14)
    .map((r, i) => ({ x: i, y: Number(r.paid_revenue_cents) }));

  const loadedAt = Date.now();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="mt-1 text-sm text-stone-600">
            First-party only. Numbers below come straight from your events table — no ad-blocker
            loss, no consent throttling.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WindowToggle active={windowValue} />
          <RefreshButton initialLoadedAt={loadedAt} />
        </div>
      </header>

      {/* Money + reach */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{win.label}</h2>
          <span className="text-xs text-stone-500">All values in SAST</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Visitors"
            value={(currentVisitors ?? 0).toLocaleString()}
            delta={<DeltaIndicator current={currentVisitors ?? 0} previous={previousVisitors ?? 0} label={win.vsLabel} />}
          />
          <StatCard
            label="Orders"
            value={currentOrders.toLocaleString()}
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
        </div>
      </section>

      {/* Daily trend */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Daily revenue</h2>
          <span className="text-xs text-stone-500">{win.label}</span>
        </header>
        <RevenueChart
          data={currentRows.map((d) => ({ day: d.day, revenue_cents: Number(d.paid_revenue_cents) }))}
        />
      </section>

      {/* Funnel */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Conversion funnel</h2>
          <span className="text-xs text-stone-500">Unique sessions per stage · {win.label.toLowerCase()}</span>
        </header>
        <FunnelChart data={funnel} />
      </section>

      {/* Attribution + Product side-by-side on desktop */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Top sources</h2>
            <span className="text-xs text-stone-500">By revenue · {win.label.toLowerCase()}</span>
          </header>
          {attribution.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No paid orders in this window yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Source / Medium</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Orders</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">AOV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {attribution.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="px-3 py-2 text-sm text-stone-900">
                        <div className="font-medium">{r.utm_source}</div>
                        <div className="text-xs text-stone-500">
                          {r.utm_medium}{r.utm_campaign !== "(none)" ? ` · ${r.utm_campaign}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-900">{r.orders}</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900">{formatZarCents(r.revenue_cents)}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-700">
                        {formatZarCents(Math.round(r.revenue_cents / r.orders))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Product mix</h2>
            <span className="text-xs text-stone-500">Wallpaper only · {win.label.toLowerCase()}</span>
          </header>
          {product.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No wallpaper orders in this window. Sample-pack orders are excluded.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-3 py-2 text-left  text-xs font-semibold uppercase tracking-wider text-stone-500">Finish</th>
                    <th className="px-3 py-2 text-left  text-xs font-semibold uppercase tracking-wider text-stone-500">Install</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Orders</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">m²</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {product.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="px-3 py-2 text-sm capitalize text-stone-900">{r.finish}</td>
                      <td className="px-3 py-2 text-sm text-stone-600">
                        {r.application === "diy" ? "DIY" : r.application === "pro_installer" ? "Pro" : r.application}
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-900">{r.orders}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-700">{r.total_sqm.toFixed(1)}</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900">{formatZarCents(r.revenue_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
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
