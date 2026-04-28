import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedPrintUrls } from "@/lib/storage";
import { MATERIAL_LABELS, APPLICATION_LABELS, PROVINCE_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { WallpaperMaterial, ApplicationMethod, ShippingProvince } from "@/types/order";
import { MoveToProductionButton } from "@/components/admin/MoveToProductionButton";

export const dynamic = "force-dynamic";

type Row = {
  id:                 string;
  order_number:       string;
  status:             string;
  product_type:       string;
  customer_name:      string;
  customer_phone:     string;
  city:               string;
  province:           string;
  postal_code:        string;
  wall_count:         number;
  wall_width_m:       number | null;
  wall_height_m:      number | null;
  total_sqm:          number | null;
  walls_spec:         { widthM: number; heightM: number }[] | null;
  wallpaper_style:    string | null;
  application_method: string | null;
  image_url:          string | null;
  image_urls:         string[] | null;
  total_cents:        number;
  created_at:         string;
};

function parsePaths(urls: unknown): string[] {
  if (Array.isArray(urls)) return urls.filter((u): u is string => typeof u === "string");
  return [];
}

function formatWalls(row: Row): string {
  if (row.wall_count === 1) {
    return `${Math.round(Number(row.wall_width_m) * 100)} × ${Math.round(Number(row.wall_height_m) * 100)} cm`;
  }
  if (row.walls_spec?.length) {
    return row.walls_spec
      .map((w) => `${Math.round(w.widthM * 100)}×${Math.round(w.heightM * 100)}`)
      .join(" · ") + " cm";
  }
  return `${row.wall_count} walls`;
}

export default async function PrintQueuePage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, product_type, customer_name, customer_phone, city, province, postal_code, wall_count, wall_width_m, wall_height_m, total_sqm, walls_spec, wallpaper_style, application_method, image_url, image_urls, total_cents, created_at"
    )
    .in("status", ["new", "in_production"])
    .eq("product_type", "wallpaper")
    .is("deleted_at", null)
    .is("refunded_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Couldn't load print queue</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const list = (orders ?? []) as Row[];

  // Sign all paths in one pass (24h TTL — operator can re-sign by reloading).
  const flatPaths = list.flatMap((r) => {
    const paths = parsePaths(r.image_urls);
    return paths.length > 0 ? paths : r.image_url ? [r.image_url] : [];
  });
  const signed = await signedPrintUrls(flatPaths);

  // Map signed URLs back to each order in original order
  let signedIdx = 0;
  const ordersWithSigned = list.map((r) => {
    const paths = parsePaths(r.image_urls);
    const count = paths.length > 0 ? paths.length : r.image_url ? 1 : 0;
    const urls  = signed.slice(signedIdx, signedIdx + count);
    signedIdx += count;
    return { row: r, urls };
  });

  const newCount = list.filter((r) => r.status === "new").length;
  const inProductionCount = list.filter((r) => r.status === "in_production").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Print queue</h1>
          <p className="mt-1 text-sm text-stone-600">
            Paid orders awaiting print. Sample-pack orders are excluded.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
            {newCount} new
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
            {inProductionCount} in production
          </span>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500">
          Nothing in the queue. New paid orders show up here automatically.
        </div>
      ) : (
        <div className="space-y-4">
          {ordersWithSigned.map(({ row, urls }) => {
            const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;
            const isNew = row.status === "new";
            return (
              <article
                key={row.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="font-mono text-base font-bold text-stone-900 hover:text-amber-700"
                    >
                      {row.order_number}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isNew ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isNew ? "New" : "In production"}
                    </span>
                    <span className="text-sm text-stone-500">
                      Paid {new Date(row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNew && <MoveToProductionButton orderId={row.id} />}
                    <Link
                      href={`/admin/orders/${row.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-stone-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
                    >
                      Print sheet
                    </Link>
                  </div>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Specs</p>
                    <p className="mt-1 text-sm text-stone-900">{formatWalls(row)}</p>
                    {row.total_sqm && (
                      <p className="text-xs text-stone-500">
                        {Number(row.total_sqm).toFixed(2)} m² · {formatZarCents(row.total_cents)}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-stone-900">
                      <span className="font-medium">{MATERIAL_LABELS[(row.wallpaper_style as WallpaperMaterial)] ?? row.wallpaper_style ?? "—"}</span>
                      <span className="text-stone-400"> · </span>
                      <span>{APPLICATION_LABELS[(row.application_method as ApplicationMethod) ?? "diy"]}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Customer</p>
                    <p className="mt-1 text-sm font-medium text-stone-900">{row.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      <a href={`tel:${row.customer_phone}`} className="hover:text-stone-700">{row.customer_phone}</a>
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {row.city}, {provinceLabel} {row.postal_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                      Print files {urls.length > 0 && `(${urls.length})`}
                    </p>
                    {urls.length === 0 ? (
                      <p className="mt-1 text-sm text-red-700">⚠ No image attached</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {urls.map((u, i) => (
                          <li key={i}>
                            <a
                              href={u}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-amber-700 underline hover:text-amber-900"
                            >
                              {urls.length > 1 ? `Wall ${i + 1}` : "Open print file"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
