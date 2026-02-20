import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "pending",
  "new",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, factory_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, created_at, assigned_factory_id")
    .is("deleted_at", null);

  const list = (orders ?? []) as {
    id: string;
    status: string;
    created_at: string;
    assigned_factory_id: string | null;
  }[];

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const byStatus: Record<string, number> = {};
  STATUSES.forEach((s) => (byStatus[s] = 0));
  let overdue = 0;

  for (const o of list) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    if (
      (o.status === "new" || o.status === "in_production") &&
      new Date(o.created_at) < fiveDaysAgo
    ) {
      overdue++;
    }
  }

  let byFactory: { name: string; count: number }[] = [];
  if (isAdmin) {
    const { data: factories } = await supabase
      .from("factories")
      .select("id, name")
      .order("name");
    const unassigned = list.filter((o) => !o.assigned_factory_id).length;
    byFactory = [
      { name: "Unassigned", count: unassigned },
      ...(factories ?? []).map((f) => ({
        name: f.name,
        count: list.filter((o) => o.assigned_factory_id === f.id).length,
      })),
    ].filter((x) => x.count > 0);
  } else if (profile?.factory_id) {
    const myCount = list.filter((o) => o.assigned_factory_id === profile.factory_id).length;
    if (myCount > 0) {
      const { data: f } = await supabase
        .from("factories")
        .select("name")
        .eq("id", profile.factory_id)
        .single();
      byFactory = [{ name: f?.name ?? "My factory", count: myCount }];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Production overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          Active orders and workload at a glance. Use this to plan production.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders${status === "pending" ? "" : `?status=${status}`}`}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
              {ORDER_STATUS_LABELS[status]}
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-900">{byStatus[status] ?? 0}</p>
          </Link>
        ))}
      </section>

      {(overdue > 0 || byFactory.length > 0) && (
        <section className="grid gap-6 sm:grid-cols-2">
          {overdue > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h2 className="text-sm font-semibold text-stone-900">Overdue</h2>
              <p className="mt-1 text-2xl font-bold text-amber-800">
                {overdue} order{overdue !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                New or In production for 5+ days
              </p>
              <Link
                href="/admin/orders?status=new"
                className="mt-3 inline-block text-sm font-medium text-amber-700 hover:underline"
              >
                View in orders →
              </Link>
            </div>
          )}
          {byFactory.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-900">By factory</h2>
              <ul className="mt-3 space-y-2">
                {byFactory.map(({ name, count }) => (
                  <li key={name} className="flex justify-between text-sm">
                    <span className="text-stone-600">{name}</span>
                    <span className="font-medium text-stone-900">{count}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/orders"
                className="mt-3 inline-block text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                View orders →
              </Link>
            </div>
          )}
        </section>
      )}

      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Open orders list
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
