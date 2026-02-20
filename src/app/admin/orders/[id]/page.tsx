import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ORDER_STATUS_LABELS,
  STYLE_LABELS,
  APPLICATION_LABELS,
  PROVINCE_LABELS,
  formatZarCents,
} from "@/lib/admin-labels";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
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
  created_at: string;
  updated_at: string;
};

function parseImageUrls(urls: unknown): string[] {
  if (Array.isArray(urls)) {
    return urls.filter((u): u is string => typeof u === "string");
  }
  return [];
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Database not configured.</p>
      </div>
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const row = order as Row;
  const imageUrls = parseImageUrls(row.image_urls);
  const urls = imageUrls.length > 0 ? imageUrls : [row.image_url];
  const status = (row.status ?? "new") as OrderStatus;
  const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;

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
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">Status</span>
          {status === "pending" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              {ORDER_STATUS_LABELS.pending}
            </span>
          ) : (
            <OrderStatusSelect orderId={id} currentStatus={status} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Print specs – primary for factory */}
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

        {/* Customer & address */}
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

      {/* Totals & meta */}
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Order totals</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-3">
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
        </dl>
        <div className="mt-4 flex flex-wrap gap-4 border-t border-stone-200 pt-4 text-sm text-stone-500">
          <span>Created {new Date(row.created_at).toLocaleString("en-ZA")}</span>
          <span>Updated {new Date(row.updated_at).toLocaleString("en-ZA")}</span>
          {row.stitch_payment_id && (
            <span className="font-mono">Payment: {row.stitch_payment_id}</span>
          )}
        </div>
      </section>
    </div>
  );
}
