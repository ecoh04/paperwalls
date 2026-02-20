import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import { formatZarCents } from "@/lib/admin-labels";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const factory = searchParams.get("factory");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = (searchParams.get("q") ?? "").trim();
  const showArchived = searchParams.get("show_archived") === "1";
  const refunded = searchParams.get("refunded") === "1";

  let query = supabase
    .from("orders")
    .select(
      "order_number, customer_name, customer_email, customer_phone, status, total_cents, created_at, updated_at, shipped_at, assigned_factory_id, factories(name)"
    );

  if (!showArchived) query = query.is("deleted_at", null);
  if (refunded) query = query.not("refunded_at", "is", null);
  else if (status) query = query.eq("status", status);
  if (factory === "unassigned") query = query.is("assigned_factory_id", null);
  else if (factory) query = query.eq("assigned_factory_id", factory);
  if (q) {
    const term = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    query = query.or(`order_number.ilike.${term},customer_name.ilike.${term}`);
  }
  if (from) query = query.gte("created_at", from + "T00:00:00.000Z");
  if (to) query = query.lte("created_at", to + "T23:59:59.999Z");
  query = query.order("created_at", { ascending: false });

  const { data: orders, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (orders ?? []) as Record<string, unknown>[];
  const headers = [
    "Order",
    "Customer",
    "Email",
    "Phone",
    "Status",
    "Total",
    "Created",
    "Updated",
    "Shipped",
    "Factory",
  ];
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.order_number,
        r.customer_name,
        r.customer_email,
        r.customer_phone,
        ORDER_STATUS_LABELS[(r.status as keyof typeof ORDER_STATUS_LABELS) ?? "pending"],
        formatZarCents(Number(r.total_cents)),
        r.created_at ? new Date(r.created_at as string).toISOString().slice(0, 10) : "",
        r.updated_at ? new Date(r.updated_at as string).toISOString().slice(0, 10) : "",
        r.shipped_at ? new Date(r.shipped_at as string).toISOString().slice(0, 10) : "",
        (r.factories as { name?: string } | null)?.name ?? "",
      ].map(escape).join(",")
    ),
  ];
  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
