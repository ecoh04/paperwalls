import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ORDER_STATUS_LABELS,
  STYLE_LABELS,
  APPLICATION_LABELS,
  PROVINCE_LABELS,
  formatZarCents,
} from "@/lib/admin-labels";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { OrderFactorySelect } from "@/components/admin/OrderFactorySelect";
import { OrderNoteForm } from "@/components/admin/OrderNoteForm";
import {
  updateOrderStatus,
  assignOrderFactory,
  addOrderNote,
} from "@/app/admin/orders/actions";
import { OrderEditForm } from "@/components/admin/OrderEditForm";
import { OrderActionButtons } from "@/components/admin/OrderActionButtons";
import type { OrderStatus, WallpaperStyle, ApplicationMethod, ShippingProvince } from "@/types/order";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  wall_width_m: number;
  wall_height_m: number;
  wall_count: number;
  total_sqm: number;
  image_url: string;
  image_urls: string[] | null;
  walls_spec: { widthM: number; heightM: number }[] | null;
  wallpaper_style: string;
  application_method: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: string;
  stitch_payment_id: string | null;
  assigned_factory_id: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  refunded_at: string | null;
  deleted_at: string | null;
  factories: { code: string; name: string } | null;
};

type ActivityRow = {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

function parseImageUrls(urls: unknown): string[] {
  if (Array.isArray(urls)) {
    return urls.filter((u): u is string => typeof u === "string");
  }
  return [];
}

function formatActivity(action: string, oldVal: string | null, newVal: string | null): string {
  switch (action) {
    case "status_change":
      return `Status: ${oldVal ?? "—"} → ${newVal ?? "—"}`;
    case "assigned":
      return `Factory: ${oldVal ?? "Unassigned"} → ${newVal ?? "Unassigned"}`;
    case "note":
      return newVal ?? "";
    case "address_edit":
    case "customer_edit":
    case "spec_edit":
      return `Updated: ${newVal ?? ""}`;
    case "print_file_replaced":
      return newVal ?? "Print file replaced";
    case "cancelled":
      return `Cancelled${newVal ? `: ${newVal}` : ""}`;
    case "archived":
      return "Archived";
    case "restored":
      return "Restored";
    case "refunded":
      return "Marked refunded";
    default:
      return newVal ?? "";
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, factories(code, name)")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();
  const isAdmin = profile?.role === "admin";

  const { data: factories } = isAdmin
    ? await supabase.from("factories").select("id, code, name").order("code")
    : { data: [] };

  const { data: activity } = await supabase
    .from("order_activity")
    .select("id, action, old_value, new_value, created_at, profiles(full_name, email)")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const row = order as Row;
  const imageUrls = parseImageUrls(row.image_urls);
  const urls = imageUrls.length > 0 ? imageUrls : [row.image_url];
  const status = (row.status ?? "new") as OrderStatus;
  const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;
  const activityList = ((activity ?? []) as unknown) as ActivityRow[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-stone-500 hover:text-stone-900"
          >
            ← Orders
          </Link>
          <h1 className="mt-1 font-mono text-2xl font-bold text-stone-900">
            {row.order_number}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isAdmin && factories && factories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">Factory</span>
              <OrderFactorySelect
                orderId={id}
                currentFactoryId={row.assigned_factory_id}
                factories={factories}
                assignFactory={assignOrderFactory}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Status</span>
            {status === "pending" || status === "cancelled" || !isAdmin ? (
              <span
                className={
                  status === "cancelled"
                    ? "rounded-full bg-stone-200 px-3 py-1 text-sm font-medium text-stone-700"
                    : status === "pending"
                      ? "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                      : "rounded-full bg-stone-200 px-3 py-1 text-sm font-medium text-stone-700"
                }
              >
                {ORDER_STATUS_LABELS[status]}
              </span>
            ) : (
              <OrderStatusSelect
                orderId={id}
                currentStatus={status}
                updateStatus={updateOrderStatus}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <OrderActionButtons
          orderId={id}
          status={status}
          refundedAt={row.refunded_at ?? null}
          deletedAt={row.deleted_at ?? null}
          wallCount={row.wall_count}
          isAdmin={!!isAdmin}
        />
      </div>

      {isAdmin && (
      <OrderEditForm
        orderId={id}
        initial={{
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          address_line1: row.address_line1,
          address_line2: row.address_line2,
          city: row.city,
          province: row.province,
          postal_code: row.postal_code,
          wall_width_m: Number(row.wall_width_m),
          wall_height_m: Number(row.wall_height_m),
          wall_count: row.wall_count,
          total_sqm: Number(row.total_sqm),
          wallpaper_style: row.wallpaper_style,
          application_method: row.application_method,
          walls_spec: row.walls_spec ?? null,
        }}
      />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-lg font-semibold text-stone-900">Print specs</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Wall(s)</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {row.wall_count === 1 ? (
                  <>
                    {Number(row.wall_width_m).toFixed(2)} m × {Number(row.wall_height_m).toFixed(2)} m
                    {row.total_sqm ? ` (${Number(row.total_sqm).toFixed(2)} m²)` : ""}
                  </>
                ) : (
                  <>
                    {row.wall_count} walls
                    {row.walls_spec?.length
                      ? `: ${row.walls_spec.map((w) => `${w.widthM}×${w.heightM}m`).join(", ")}`
                      : `, ${Number(row.total_sqm).toFixed(2)} m² total`}
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Finish</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {STYLE_LABELS[(row.wallpaper_style as WallpaperStyle) ?? "matte"]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Application</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {APPLICATION_LABELS[(row.application_method as ApplicationMethod) ?? "diy"]}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-stone-700">Print files</h3>
            <p className="mt-1 text-xs text-stone-500">
              Download the exact file(s) to print. One file per wall when multiple.
            </p>
            <ul className="mt-3 space-y-2">
              {urls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-900 ring-1 ring-stone-200 hover:bg-stone-50 hover:ring-amber-300"
                  >
                    <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {urls.length > 1 ? `Wall ${i + 1}` : "Download print file"}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Customer & delivery</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Name</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{row.customer_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Email</dt>
              <dd className="mt-0.5">
                <a href={`mailto:${row.customer_email}`} className="text-amber-600 hover:underline">
                  {row.customer_email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Phone</dt>
              <dd className="mt-0.5">
                <a href={`tel:${row.customer_phone}`} className="text-amber-600 hover:underline">
                  {row.customer_phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Address</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {row.address_line1}
                {row.address_line2 ? `, ${row.address_line2}` : ""}
                <br />
                {row.city}, {provinceLabel} {row.postal_code}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Order totals & dates</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-stone-500">Subtotal</dt>
            <dd className="font-medium text-stone-900">{formatZarCents(Number(row.subtotal_cents))}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Shipping</dt>
            <dd className="font-medium text-stone-900">{formatZarCents(Number(row.shipping_cents))}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Total</dt>
            <dd className="font-semibold text-stone-900">{formatZarCents(Number(row.total_cents))}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Payment ID</dt>
            <dd className="font-mono text-xs text-stone-600">{row.stitch_payment_id ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-2 border-t border-stone-200 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-stone-500">Created</span>
            <span className="ml-2 font-medium text-stone-900">
              {new Date(row.created_at).toLocaleString("en-ZA")}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Updated</span>
            <span className="ml-2 font-medium text-stone-900">
              {new Date(row.updated_at).toLocaleString("en-ZA")}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Shipped</span>
            <span className="ml-2 font-medium text-stone-900">
              {row.shipped_at
                ? new Date(row.shipped_at).toLocaleString("en-ZA")
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Delivered</span>
            <span className="ml-2 font-medium text-stone-900">
              {row.delivered_at
                ? new Date(row.delivered_at).toLocaleString("en-ZA")
                : "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Activity log</h2>
        <p className="mt-1 text-sm text-stone-500">
          Status changes, factory assignments, and notes. Newest first.
        </p>
        <div className="mt-4">
          <OrderNoteForm orderId={id} addNote={addOrderNote} />
        </div>
        <ul className="mt-6 space-y-3">
          {activityList.length === 0 ? (
            <li className="text-sm text-stone-500">No activity yet.</li>
          ) : (
            activityList.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-0.5 border-l-2 border-stone-200 pl-4 py-1"
              >
                <span className="text-sm font-medium text-stone-900">
                  {formatActivity(a.action, a.old_value, a.new_value)}
                </span>
                <span className="text-xs text-stone-500">
                  {(Array.isArray(a.profiles) ? a.profiles[0] : a.profiles)?.full_name ||
                    (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles)?.email ||
                    "Someone"}{" "}
                  ·{" "}
                  {new Date(a.created_at).toLocaleString("en-ZA")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
