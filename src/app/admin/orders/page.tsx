import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";
import { OrdersTableWithBulk } from "@/components/admin/OrdersTableWithBulk";
import { OrdersFiltersCollapse } from "@/components/admin/OrdersFiltersCollapse";

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            ← Overview
          </Link>
          <h1 className="mt-0.5 text-2xl font-bold text-stone-900">Orders</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={buildHref({ status: undefined })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !validStatus ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All
          </Link>
          {(["new", "in_production", "shipped", "delivered", "pending", "cancelled"] as const).map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                validStatus === s ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      <OrdersFiltersCollapse
        buildHref={buildHref}
        validStatus={validStatus}
        statusFilter={statusFilter}
        factoryFilter={factoryFilter}
        factories={factories?.map((f) => ({ id: f.id, name: f.name })) ?? []}
        fromDate={fromDate}
        toDate={toDate}
        searchQ={searchQ}
        sortBy={sortBy}
        showArchived={showArchived}
        refundedOnly={refundedOnly}
        isAdmin={!!isAdmin}
        exportHref={exportHref}
      />

      <OrdersTableWithBulk
        orders={list as Parameters<typeof OrdersTableWithBulk>[0]["orders"]}
        factories={factories?.map((f) => ({ id: f.id, name: f.name })) ?? []}
        isAdmin={!!isAdmin}
      />
    </div>
  );
}
