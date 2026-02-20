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

const STATUSES: OrderStatus[] = [
  "pending",
  "new",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const params = await searchParams;
    const statusFilter = params.status;
    const factoryFilter = params.factory;
    const fromDate = params.from;
    const toDate = params.to;
    const searchQ = (params.q ?? "").trim();
    const sortBy = params.sort ?? "created_desc";
    const showArchived = params.show_archived === "1";
    const refundedOnly = params.refunded === "1";

    const validStatus = STATUSES.includes((statusFilter ?? "") as OrderStatus)
      ? (statusFilter as OrderStatus)
      : null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="font-medium">Please log in to view orders.</p>
        </div>
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, factory_id")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let factories: { id: string; code: string; name: string }[] = [];
    try {
      const { data: factoriesData } = await supabase
        .from("factories")
        .select("id, code, name")
        .order("code");
      factories = (factoriesData ?? []) as { id: string; code: string; name: string }[];
    } catch {
      // factories table may not exist
    }

    // Summary counts (lightweight)
    let counts: Record<string, number> = {};
    let countQuery = supabase.from("orders").select("id, status");
    if (!showArchived) {
      countQuery = countQuery.is("deleted_at", null);
    }
    const { data: countRows } = await countQuery;
    counts = (countRows ?? []).reduce(
      (acc, row: { status?: string }) => {
        const s = row.status ?? "pending";
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    STATUSES.forEach((s) => {
      if (counts[s] === undefined) counts[s] = 0;
    });

    // Main orders query
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
          <p className="mt-3 text-xs">
            If you just set up the database, run the migrations in order:{" "}
            <code className="rounded bg-red-100 px-1">20260221_factory_ops.sql</code>, then{" "}
            <code className="rounded bg-red-100 px-1">20260222_order_management_full.sql</code> (see{" "}
            <code className="rounded bg-red-100 px-1">docs/SUPABASE_FULL_SETUP.md</code>).
          </p>
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
        </div>

        {/* Summary cards – Shopify-style */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={
                status === "pending"
                  ? "/admin/orders"
                  : `/admin/orders?status=${status}`
              }
              className={`rounded-lg border p-4 transition ${
                validStatus === status
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:shadow-sm"
              }`}
            >
              <p className="text-xs font-medium opacity-80">
                {ORDER_STATUS_LABELS[status]}
              </p>
              <p className="mt-1 text-2xl font-bold">{counts[status] ?? 0}</p>
            </Link>
          ))}
        </section>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildHref({ status: undefined })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              !validStatus ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
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

        <OrdersFiltersCollapse
          validStatus={validStatus}
          statusFilter={statusFilter}
          factoryFilter={factoryFilter}
          factories={factories.map((f) => ({ id: f.id, name: f.name }))}
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
          factories={factories.map((f) => ({ id: f.id, name: f.name }))}
          isAdmin={!!isAdmin}
        />
      </div>
    );
  } catch (err) {
    console.error("Admin orders page error:", err);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "An unexpected error occurred."}
        </p>
        <p className="mt-3 text-xs">
          Run the migrations in <code className="rounded bg-red-100 px-1">docs/SUPABASE_FULL_SETUP.md</code> if
          you just set up the database.
        </p>
      </div>
    );
  }
}
