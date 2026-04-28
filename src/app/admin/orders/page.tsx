import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/order";
import { OrdersTableWithBulk } from "@/components/admin/OrdersTableWithBulk";
import { OrdersStatusTabs } from "@/components/admin/OrdersStatusTabs";
import { OrdersToolbar } from "@/components/admin/OrdersToolbar";
import { OrdersActiveFilters } from "@/components/admin/OrdersActiveFilters";
import { OrdersAdvancedFilters } from "@/components/admin/OrdersAdvancedFilters";
import { signedPrintUrls } from "@/lib/storage";

// Note: factory routing is removed — orders are manually assigned externally.

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  type?: string;
  install?: string;
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
    const typeFilter    = params.type === "wallpaper" || params.type === "sample_pack" ? params.type : null;
    const installFilter = params.install === "diy" || params.install === "pro_installer" ? params.install : null;
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

    const isAdmin = true; // single-admin setup — all authenticated users are admins

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
        "id, order_number, customer_name, customer_email, status, product_type, application_method, total_cents, created_at, updated_at, shipped_at, delivered_at, wall_count, wall_width_m, wall_height_m, total_sqm, quantity, wallpaper_style, last_activity_at, last_activity_preview, refunded_at, deleted_at, utm_source, image_url, image_urls"
      );

    if (!showArchived) {
      query = query.is("deleted_at", null);
    }
    if (refundedOnly) {
      query = query.not("refunded_at", "is", null);
    } else if (validStatus) {
      query = query.eq("status", validStatus);
    }
    if (typeFilter) {
      query = query.eq("product_type", typeFilter);
    }
    if (installFilter) {
      query = query.eq("application_method", installFilter);
    }
    if (searchQ) {
      const term = `%${searchQ.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      query = query.or(`order_number.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term}`);
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

    // ── Sign thumbnail URLs in one batch and pull note counts. ──────────
    // Sample-pack rows skip signing (use the static flat-lay). Wallpaper
    // rows take the first image. Failures fall through to a placeholder
    // in the OrderThumbnail component.
    const wallpaperPaths: { id: string; path: string }[] = [];
    for (const r of list) {
      if (r.product_type !== "wallpaper") continue;
      const urls = Array.isArray(r.image_urls) ? (r.image_urls as string[]) : [];
      const path = urls[0] ?? (r.image_url as string | null) ?? null;
      if (path) wallpaperPaths.push({ id: r.id as string, path });
    }
    const signed = wallpaperPaths.length > 0
      ? await signedPrintUrls(wallpaperPaths.map((p) => p.path))
      : [];
    const thumbsByOrder = new Map<string, string>();
    wallpaperPaths.forEach((p, i) => {
      const url = signed[i];
      if (url) thumbsByOrder.set(p.id, url);
    });

    // Note counts so the row can show a small icon when there are notes.
    const orderIds = list.map((r) => r.id as string);
    const noteCountByOrder = new Map<string, number>();
    if (orderIds.length > 0) {
      const { data: notes } = await supabase
        .from("order_activity")
        .select("order_id")
        .eq("action", "note")
        .in("order_id", orderIds);
      for (const r of (notes ?? []) as { order_id: string }[]) {
        noteCountByOrder.set(r.order_id, (noteCountByOrder.get(r.order_id) ?? 0) + 1);
      }
    }

    // Decorate each row so the table component doesn't need to know how
    // to sign URLs or count notes.
    const decoratedList = list.map((r) => ({
      ...r,
      thumb_url:  thumbsByOrder.get(r.id as string) ?? "",
      note_count: noteCountByOrder.get(r.id as string) ?? 0,
    }));

    const buildHref = (overrides: Partial<SearchParams>) => {
      const q = new URLSearchParams();
      if (validStatus) q.set("status", validStatus);
      if (typeFilter)  q.set("type",   typeFilter);
      if (installFilter) q.set("install", installFilter);
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
      ...(typeFilter  && { type:   typeFilter }),
      ...(fromDate && { from: fromDate }),
      ...(toDate && { to: toDate }),
      ...(searchQ && { q: searchQ }),
      ...(showArchived && { show_archived: "1" }),
      ...(refundedOnly && { refunded: "1" }),
    }).toString()}`;

    const buildHrefForChips = (overrides: Record<string, string | undefined>) =>
      buildHref(overrides as Partial<SearchParams>);

    return (
      <div className="space-y-5">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
          <p className="text-sm text-stone-500">
            {list.length} order{list.length === 1 ? "" : "s"} match the current view
          </p>
        </header>

        {/* Status tabs — primary navigation. Replaces the old 6-card grid
            and the standalone status chip row. */}
        <OrdersStatusTabs
          current={validStatus}
          counts={counts}
          buildHref={buildHrefForChips}
        />

        {/* Compact toolbar — search + Type / Install / Sort selects + Export. */}
        <OrdersToolbar
          searchQ={searchQ}
          type={typeFilter}
          install={installFilter}
          sort={sortBy}
          isWallpaperContext={typeFilter !== "sample_pack"}
          exportHref={exportHref}
          isAdmin={!!isAdmin}
        />

        {/* Active filter chips — only render when something is filtered.
            Each chip has an X to clear just that one filter. */}
        <OrdersActiveFilters
          searchQ={searchQ}
          type={typeFilter}
          install={installFilter}
          fromDate={fromDate}
          toDate={toDate}
          showArchived={showArchived}
          refundedOnly={refundedOnly}
          buildHref={buildHrefForChips}
        />

        {/* Advanced (date / archived / refunded) — collapsed by default
            unless one of those filters is currently active. */}
        <OrdersAdvancedFilters
          fromDate={fromDate}
          toDate={toDate}
          showArchived={showArchived}
          refundedOnly={refundedOnly}
          isAdmin={!!isAdmin}
        />

        <OrdersTableWithBulk
          orders={decoratedList as Parameters<typeof OrdersTableWithBulk>[0]["orders"]}
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
