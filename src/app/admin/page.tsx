import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatZarCents } from "@/lib/admin-labels";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { FunnelChart } from "@/components/admin/charts/FunnelChart";
import { SparklineChart } from "@/components/admin/charts/SparklineChart";
import { RefreshButton } from "@/components/admin/RefreshButton";

export const dynamic = "force-dynamic";

type DailyRevRow = {
  day:                 string;
  paid_orders:         number;
  paid_revenue_cents:  number;
  pending_orders:      number;
  refunded_orders:     number;
};

type FunnelRow      = { rank: number; stage: string; sessions: number };
type AttributionRow = { utm_source: string; utm_medium: string; utm_campaign: string; orders: number; revenue_cents: number; aov_cents: number };
type FinishRow      = { finish: string; application: string; orders: number; revenue_cents: number; total_sqm: number };

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function sumWindow(data: DailyRevRow[], start: Date): { revenue: number; orders: number } {
  let revenue = 0, orders = 0;
  for (const r of data) {
    if (new Date(r.day) >= start) {
      revenue += Number(r.paid_revenue_cents);
      orders  += Number(r.paid_orders);
    }
  }
  return { revenue, orders };
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Please log in to view the dashboard.</p>
      </div>
    );
  }

  // Pull last 30 days of daily revenue
  const since = daysAgo(29).toISOString().slice(0, 10);
  const { data: revRows } = await supabase
    .from("v_daily_revenue")
    .select("day, paid_orders, paid_revenue_cents, pending_orders, refunded_orders")
    .gte("day", since)
    .order("day", { ascending: true });

  // Backfill missing days with zeros so the chart is continuous
  const daily: DailyRevRow[] = [];
  const map = new Map<string, DailyRevRow>();
  for (const r of (revRows ?? []) as DailyRevRow[]) map.set(r.day, r);
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    daily.push(
      map.get(key) ?? { day: key, paid_orders: 0, paid_revenue_cents: 0, pending_orders: 0, refunded_orders: 0 }
    );
  }

  const today    = sumWindow(daily, startOfTodayUtc());
  const last7    = sumWindow(daily, daysAgo(6));
  const last30   = sumWindow(daily, daysAgo(29));
  const aov30    = last30.orders > 0 ? Math.round(last30.revenue / last30.orders) : 0;

  // Funnel
  const { data: funnelRows } = await supabase
    .from("v_funnel_30d")
    .select("rank, stage, sessions");
  const funnel = (funnelRows ?? []) as FunnelRow[];

  // UTMs
  const { data: attribRows } = await supabase
    .from("v_attribution_30d")
    .select("utm_source, utm_medium, utm_campaign, orders, revenue_cents, aov_cents")
    .limit(10);
  const attribution = (attribRows ?? []) as AttributionRow[];

  // Finish split
  const { data: finishRows } = await supabase
    .from("v_finish_split_30d")
    .select("finish, application, orders, revenue_cents, total_sqm");
  const finishes = (finishRows ?? []) as FinishRow[];

  // Pending unresolved orders count
  const pending30 = daily.reduce((s, r) => s + Number(r.pending_orders), 0);
  const refunded30 = daily.reduce((s, r) => s + Number(r.refunded_orders), 0);

  // Sparkline points for the revenue stat card
  const sparkPoints = daily.map((r, i) => ({ x: i, y: Number(r.paid_revenue_cents) }));

  const loadedAt = Date.now();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-600">
            Live revenue, funnel, and attribution. Pulled fresh from first-party events on every load.
          </p>
        </div>
        <RefreshButton initialLoadedAt={loadedAt} />
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today"           value={formatZarCents(today.revenue)} sub={`${today.orders} order${today.orders === 1 ? "" : "s"}`} />
        <StatCard label="Last 7 days"     value={formatZarCents(last7.revenue)} sub={`${last7.orders} order${last7.orders === 1 ? "" : "s"}`} />
        <StatCard
          label="Last 30 days"
          value={formatZarCents(last30.revenue)}
          sub={`${last30.orders} orders · AOV ${last30.orders > 0 ? formatZarCents(aov30) : "—"}`}
          spark={<SparklineChart data={sparkPoints} />}
        />
        <StatCard
          label="Pending / refunded"
          value={`${pending30} / ${refunded30}`}
          sub={refunded30 > 0 ? `${((refunded30 / Math.max(1, last30.orders + refunded30)) * 100).toFixed(1)}% refund rate` : "Last 30 days"}
        />
      </section>

      {/* Revenue chart */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Daily revenue · last 30 days</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            View orders →
          </Link>
        </header>
        <RevenueChart data={daily.map((d) => ({ day: d.day, revenue_cents: Number(d.paid_revenue_cents) }))} />
      </section>

      {/* Funnel */}
      <section>
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Conversion funnel · last 30 days</h2>
          <span className="text-xs text-stone-500">Unique sessions reaching each step</span>
        </header>
        <FunnelChart data={funnel} />
      </section>

      {/* Attribution + Finish split */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Top sources · last 30 days</h2>
            <span className="text-xs text-stone-500">Revenue by UTM source/medium</span>
          </header>
          {attribution.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No paid orders in the last 30 days yet.
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
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900">{formatZarCents(Number(r.revenue_cents))}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-700">{formatZarCents(Number(r.aov_cents))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Finish &amp; install · last 30 days</h2>
            <span className="text-xs text-stone-500">Wallpaper orders only</span>
          </header>
          {finishes.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No wallpaper orders yet. Sample-pack orders are excluded here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Finish</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Install</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Orders</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">m²</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {finishes.map((r, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="px-3 py-2 text-sm capitalize text-stone-900">{r.finish}</td>
                      <td className="px-3 py-2 text-sm text-stone-600">{r.application === "diy" ? "DIY" : r.application === "pro_installer" ? "Pro" : r.application}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-900">{r.orders}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-stone-700">{Number(r.total_sqm).toFixed(1)}</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-stone-900">{formatZarCents(Number(r.revenue_cents))}</td>
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
  label, value, sub, spark,
}: {
  label: string;
  value: string;
  sub:   string;
  spark?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        {spark}
      </div>
      <p className="mt-1 text-xs text-stone-500">{sub}</p>
    </div>
  );
}
