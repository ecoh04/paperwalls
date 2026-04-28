import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

type Customer = {
  id:                 string;
  email:              string;
  name:               string | null;
  phone:              string | null;
  marketing_source:   string | null;
  marketing_opt_in:   boolean;
  total_orders:       number;
  total_spent_cents:  number;
  created_at:         string;
  last_seen_at:       string | null;
};

type OrderRow = {
  id:           string;
  order_number: string;
  status:       string;
  product_type: string;
  total_cents:  number;
  city:         string | null;
  province:     string | null;
  created_at:   string;
  shipped_at:   string | null;
  delivered_at: string | null;
  refunded_at:  string | null;
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, name, phone, marketing_source, marketing_opt_in, total_orders, total_spent_cents, created_at, last_seen_at")
    .eq("id", id)
    .single();
  if (!customer) notFound();
  const c = customer as Customer;

  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, order_number, status, product_type, total_cents, city, province, created_at, shipped_at, delivered_at, refunded_at")
    .eq("customer_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const orders = (orderRows ?? []) as OrderRow[];

  const paidOrders = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled" && o.refunded_at == null);
  const aov = paidOrders.length > 0
    ? Math.round(paidOrders.reduce((s, o) => s + o.total_cents, 0) / paidOrders.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="text-sm font-medium text-stone-500 hover:text-stone-900">
          ← Customers
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">{c.name ?? c.email}</h1>
        <p className="mt-1 text-sm text-stone-600">
          <a href={`mailto:${c.email}`} className="text-amber-700 hover:underline">{c.email}</a>
          {c.phone && <span className="ml-3"><a href={`tel:${c.phone}`} className="text-amber-700 hover:underline">{c.phone}</a></span>}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Lifetime orders" value={String(c.total_orders)} />
        <Stat label="Lifetime spend"  value={formatZarCents(c.total_spent_cents)} />
        <Stat label="Avg order value" value={paidOrders.length > 0 ? formatZarCents(aov) : "—"} />
        <Stat label="First seen"      value={new Date(c.created_at).toLocaleDateString("en-ZA")} />
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Profile</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Pair label="Marketing source"  value={c.marketing_source ?? "—"} />
          <Pair label="Marketing opt-in"  value={c.marketing_opt_in ? "Yes" : "No"} />
          <Pair label="Last seen"         value={c.last_seen_at ? new Date(c.last_seen_at).toLocaleString("en-ZA") : "—"} />
          <Pair label="Customer since"    value={new Date(c.created_at).toLocaleDateString("en-ZA")} />
        </dl>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Order</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-medium text-stone-900 hover:text-amber-700">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-stone-700">
                      {o.refunded_at ? "Refunded" : ORDER_STATUS_LABELS[(o.status as OrderStatus) ?? "pending"]}
                    </td>
                    <td className="px-4 py-2 text-sm text-stone-600">
                      {o.product_type === "sample_pack" ? "Sample pack" : "Wallpaper"}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-stone-900">
                      {formatZarCents(o.total_cents)}
                    </td>
                    <td className="px-4 py-2 text-sm text-stone-500">
                      {new Date(o.created_at).toLocaleDateString("en-ZA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-stone-900">{value}</dd>
    </div>
  );
}
