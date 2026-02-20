import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  new: "bg-emerald-100 text-emerald-800",
  in_production: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-stone-200 text-stone-700",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  factory?: string;
  from?: string;
  to?: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = params.status;
  const factoryFilter = params.factory;
  const fromDate = params.from;
  const toDate = params.to;

  const validStatus = [
    "pending",
    "new",
    "in_production",
    "shipped",
    "delivered",
  ].includes(statusFilter ?? "")
    ? (statusFilter as OrderStatus)
    : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, factory_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: factories } = await supabase
    .from("factories")
    .select("id, code, name")
    .order("code");

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, status, total_cents, created_at, updated_at, shipped_at, delivered_at, assigned_factory_id, factories(code, name)"
    )
    .order("created_at", { ascending: false });

  if (validStatus) {
    query = query.eq("status", validStatus);
  }

  if (factoryFilter === "unassigned") {
    query = query.is("assigned_factory_id", null);
  } else if (factoryFilter && factories?.some((f) => f.id === factoryFilter)) {
    query = query.eq("assigned_factory_id", factoryFilter);
  }
  /* RLS restricts factory_staff to their factory + unassigned; no extra filter needed */

  if (fromDate) {
    query = query.gte("created_at", fromDate + "T00:00:00.000Z");
  }
  if (toDate) {
    query = query.lte("created_at", toDate + "T23:59:59.999Z");
  }

  const { data: orders, error } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Error loading orders</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const list = orders ?? [];

  const buildHref = (overrides: Partial<SearchParams>) => {
    const q = new URLSearchParams();
    if (validStatus) q.set("status", validStatus);
    if (factoryFilter) q.set("factory", factoryFilter);
    if (fromDate) q.set("from", fromDate);
    if (toDate) q.set("to", toDate);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) q.set(k, v);
      else q.delete(k);
    });
    const s = q.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && factories && (
            <div className="flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-white p-1">
              <Link
                href={buildHref({ factory: undefined })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  !factoryFilter
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                All
              </Link>
              <Link
                href={buildHref({ factory: "unassigned" })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  factoryFilter === "unassigned"
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                Unassigned
              </Link>
              {factories.map((f) => (
                <Link
                  key={f.id}
                  href={buildHref({ factory: f.id })}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    factoryFilter === f.id
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {f.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref({ status: undefined })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !validStatus
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              All
            </Link>
            {(["new", "in_production", "shipped", "delivered", "pending"] as const).map(
              (s) => (
                <Link
                  key={s}
                  href={buildHref({ status: s })}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    validStatus === s
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {ORDER_STATUS_LABELS[s]}
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="status" value={statusFilter ?? ""} />
        <input type="hidden" name="factory" value={factoryFilter ?? ""} />
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-stone-500">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromDate ?? ""}
            className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-stone-500">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toDate ?? ""}
            className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            {validStatus
              ? `No orders with status "${ORDER_STATUS_LABELS[validStatus!]}".`
              : "No orders yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Customer
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                      Factory
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Shipped
                  </th>
                  <th className="relative px-4 py-3 sm:px-6">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {list.map((row: Record<string, unknown>) => {
                  const factory = row.factories as { code: string; name: string } | null;
                  return (
                    <tr
                      key={row.id as string}
                      className="bg-white transition hover:bg-stone-50/80"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-medium text-stone-900 sm:px-6">
                        {row.order_number as string}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-600 sm:px-6">
                        {row.customer_name as string}
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                          {factory?.name ?? "—"}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[(row.status as OrderStatus) ?? "pending"]
                          }`}
                        >
                          {ORDER_STATUS_LABELS[(row.status as OrderStatus) ?? "pending"]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-stone-900 sm:px-6">
                        {formatZarCents(Number(row.total_cents))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                        {row.created_at
                          ? new Date(row.created_at as string).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                        {row.updated_at
                          ? new Date(row.updated_at as string).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                        {row.shipped_at
                          ? new Date(row.shipped_at as string).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                        <Link
                          href={`/admin/orders/${row.id}`}
                          className="text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
