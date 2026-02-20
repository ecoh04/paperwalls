import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";
import { OrdersTableWithBulk } from "@/components/admin/OrdersTableWithBulk";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  factory?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: string;
  show_archived?: string;
  refunded?: string;
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
  const searchQ = (params.q ?? "").trim();
  const sortBy = params.sort ?? "created_desc";
  const showArchived = params.show_archived === "1";
  const refundedOnly = params.refunded === "1";

  const validStatus = [
    "pending",
    "new",
    "in_production",
    "shipped",
    "delivered",
    "cancelled",
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
      "id, order_number, customer_name, status, total_cents, created_at, updated_at, shipped_at, delivered_at, assigned_factory_id, wall_count, wall_width_m, wall_height_m, wallpaper_style, last_activity_at, last_activity_preview, refunded_at, deleted_at, factories(code, name)"
    );

  if (!showArchived) {
    query = query.is("deleted_at", null);
  }

  if (refundedOnly) {
    query = query.not("refunded_at", "is", null);
  } else if (validStatus) {
    query = query.eq("status", validStatus);
  }

  if (factoryFilter === "unassigned") {
    query = query.is("assigned_factory_id", null);
  } else if (factoryFilter && factories?.some((f) => f.id === factoryFilter)) {
    query = query.eq("assigned_factory_id", factoryFilter);
  }

  if (searchQ) {
    const term = `%${searchQ.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    query = query.or(`order_number.ilike.${term},customer_name.ilike.${term}`);
  }

  if (fromDate) {
    query = query.gte("created_at", fromDate + "T00:00:00.000Z");
  }
  if (toDate) {
    query = query.lte("created_at", toDate + "T23:59:59.999Z");
  }

  const sortField =
    sortBy === "updated_desc"
      ? "updated_at"
      : sortBy === "total_desc"
        ? "total_cents"
        : sortBy === "status"
          ? "status"
          : "created_at";
  const sortAsc = sortBy === "created_asc" || sortBy === "updated_asc";
  query = query.order(sortField, { ascending: sortAsc });

  const { data: orders, error } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Error loading orders</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const list = (orders ?? []) as Record<string, unknown>[];

  const buildHref = (overrides: Partial<SearchParams>) => {
    const q = new URLSearchParams();
    if (validStatus) q.set("status", validStatus);
    if (factoryFilter) q.set("factory", factoryFilter);
    if (fromDate) q.set("from", fromDate);
    if (toDate) q.set("to", toDate);
    if (searchQ) q.set("q", searchQ);
    if (sortBy !== "created_desc") q.set("sort", sortBy);
    if (showArchived) q.set("show_archived", "1");
    if (refundedOnly) q.set("refunded", "1");
    Object.entries(overrides).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.set(k, String(v));
      else q.delete(k);
    });
    const s = q.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  const exportHref = `/api/admin/orders/export?${new URLSearchParams({
    ...(validStatus && { status: validStatus }),
    ...(factoryFilter && { factory: factoryFilter }),
    ...(fromDate && { from: fromDate }),
    ...(toDate && { to: toDate }),
    ...(searchQ && { q: searchQ }),
    ...(showArchived && { show_archived: "1" }),
    ...(refundedOnly && { refunded: "1" }),
  }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link
              href={buildHref({ show_archived: showArchived ? undefined : "1" })}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                showArchived ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              Show archived
            </Link>
          )}
          {isAdmin && factories && (
            <div className="flex flex-wrap gap-1 rounded-lg border border-stone-200 bg-white p-1">
              <Link href={buildHref({ factory: undefined })} className={`rounded-md px-3 py-1.5 text-sm font-medium ${!factoryFilter ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                All
              </Link>
              <Link href={buildHref({ factory: "unassigned" })} className={`rounded-md px-3 py-1.5 text-sm font-medium ${factoryFilter === "unassigned" ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                Unassigned
              </Link>
              {factories.map((f) => (
                <Link key={f.id} href={buildHref({ factory: f.id })} className={`rounded-md px-3 py-1.5 text-sm font-medium ${factoryFilter === f.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                  {f.name}
                </Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href={buildHref({ status: undefined })} className={`rounded-full px-4 py-2 text-sm font-medium ${!validStatus ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}>
              All
            </Link>
            {(["new", "in_production", "shipped", "delivered", "pending", "cancelled"] as const).map((s) => (
              <Link key={s} href={buildHref({ status: s })} className={`rounded-full px-4 py-2 text-sm font-medium ${validStatus === s ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}>
                {ORDER_STATUS_LABELS[s]}
              </Link>
            ))}
          </div>
          <a
            href={exportHref}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Export CSV
          </a>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="status" value={statusFilter ?? ""} />
        <input type="hidden" name="factory" value={factoryFilter ?? ""} />
        <input type="hidden" name="show_archived" value={showArchived ? "1" : ""} />
        <div className="min-w-[180px]">
          <label htmlFor="q" className="block text-xs font-medium text-stone-500">Search</label>
          <input id="q" name="q" type="search" defaultValue={searchQ} placeholder="Order # or customer" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-stone-500">From</label>
          <input id="from" name="from" type="date" defaultValue={fromDate ?? ""} className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-stone-500">To</label>
          <input id="to" name="to" type="date" defaultValue={toDate ?? ""} className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-stone-500">Sort</label>
          <select id="sort" name="sort" defaultValue={sortBy} className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm">
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="updated_desc">Recently updated</option>
            <option value="updated_asc">Least recently updated</option>
            <option value="total_desc">Total high → low</option>
            <option value="status">Status</option>
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
          Apply
        </button>
      </form>

      <OrdersTableWithBulk
        orders={list as Parameters<typeof OrdersTableWithBulk>[0]["orders"]}
        factories={factories?.map((f) => ({ id: f.id, name: f.name })) ?? []}
        isAdmin={!!isAdmin}
      />
    </div>
  );
}
