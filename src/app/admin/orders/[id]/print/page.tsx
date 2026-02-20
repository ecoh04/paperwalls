import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintTrigger } from "@/components/admin/PrintTrigger";
import {
  STYLE_LABELS,
  APPLICATION_LABELS,
  PROVINCE_LABELS,
  formatZarCents,
} from "@/lib/admin-labels";
import type { WallpaperStyle, ApplicationMethod, ShippingProvince } from "@/types/order";

export const dynamic = "force-dynamic";

type Row = {
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
  total_cents: number;
};

function parseImageUrls(urls: unknown): string[] {
  if (Array.isArray(urls)) return urls.filter((u): u is string => typeof u === "string");
  return [];
}

export default async function AdminOrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("order_number, customer_name, customer_email, customer_phone, address_line1, address_line2, city, province, postal_code, wall_width_m, wall_height_m, wall_count, total_sqm, image_url, image_urls, walls_spec, wallpaper_style, application_method, total_cents")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  const row = order as Row;
  const urls = parseImageUrls(row.image_urls).length > 0 ? parseImageUrls(row.image_urls) : [row.image_url];
  const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;

  return (
    <div className="min-h-screen bg-white p-8 text-stone-900 print:p-6">
      <div className="mb-6 flex items-center justify-between print:mb-4">
        <h1 className="text-2xl font-bold">Order {row.order_number}</h1>
        <Link
          href={`/admin/orders/${id}`}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white no-print hover:bg-stone-700"
        >
          Back to order
        </Link>
      </div>

      <section className="mb-6 border-b border-stone-200 pb-4">
        <h2 className="text-sm font-semibold uppercase text-stone-500">Customer & delivery</h2>
        <p className="mt-1 font-medium">{row.customer_name}</p>
        <p>{row.customer_email}</p>
        <p>{row.customer_phone}</p>
        <p className="mt-2">
          {row.address_line1}
          {row.address_line2 ? `, ${row.address_line2}` : ""}
          <br />
          {row.city}, {provinceLabel} {row.postal_code}
        </p>
      </section>

      <section className="mb-6 border-b border-stone-200 pb-4">
        <h2 className="text-sm font-semibold uppercase text-stone-500">Print specs</h2>
        <p className="mt-1">
          {row.wall_count === 1
            ? `${Number(row.wall_width_m).toFixed(2)} m × ${Number(row.wall_height_m).toFixed(2)} m (${Number(row.total_sqm).toFixed(2)} m²)`
            : `${row.wall_count} walls, ${Number(row.total_sqm).toFixed(2)} m² total`}
        </p>
        <p>Finish: {STYLE_LABELS[(row.wallpaper_style as WallpaperStyle) ?? "matte"]}</p>
        <p>Application: {APPLICATION_LABELS[(row.application_method as ApplicationMethod) ?? "diy"]}</p>
      </section>

      <section className="mb-6 border-b border-stone-200 pb-4">
        <h2 className="text-sm font-semibold uppercase text-stone-500">Print files</h2>
        <ul className="mt-1 list-disc pl-5">
          {urls.map((url, i) => (
            <li key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">
                {urls.length > 1 ? `Wall ${i + 1}` : "Print file"}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-sm text-stone-500">Total: {formatZarCents(Number(row.total_cents))}</p>
      </section>

      <PrintTrigger />
    </div>
  );
}
