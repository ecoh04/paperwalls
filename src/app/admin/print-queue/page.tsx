import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signedPrintUrl } from "@/lib/storage";
import { WALLPAPER_TYPE_LABELS, MATERIAL_LABELS, APPLICATION_LABELS, PROVINCE_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { WallpaperType, WallpaperMaterial, ApplicationMethod, ShippingProvince } from "@/types/order";
import { MoveToProductionButton } from "@/components/admin/MoveToProductionButton";
import { RefreshButton } from "@/components/admin/RefreshButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { OrderThumbnail } from "@/components/admin/OrderThumbnail";

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
  wallpaper_type:     string | null;
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
    return `W ${Math.round(Number(row.wall_width_m) * 100)} cm x H ${Math.round(Number(row.wall_height_m) * 100)} cm`;
  }
  if (row.walls_spec?.length) {
    return row.walls_spec
      .map((w, i) => `Wall ${i + 1}: W ${Math.round(w.widthM * 100)} x H ${Math.round(w.heightM * 100)} cm`)
      .join(" · ");
  }
  return `${row.wall_count} walls`;
}

export default async function PrintQueuePage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, product_type, customer_name, customer_phone, city, province, postal_code, wall_count, wall_width_m, wall_height_m, total_sqm, walls_spec, wallpaper_type, wallpaper_style, application_method, image_url, image_urls, total_cents, created_at"
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

  // Sign per-wall URLs with explicit download filenames so the operator
  // gets 'PW-1042-wall-1.jpg' instead of a random Supabase filename when
  // clicking the link. Saves manual rename + sort time at print volume.
  const TTL = 60 * 60 * 24 * 7; // 7 days, matches storage helper default

  const ordersWithSigned = await Promise.all(
    list.map(async (r) => {
      const paths = parsePaths(r.image_urls);
      const allPaths = paths.length > 0 ? paths : r.image_url ? [r.image_url] : [];
      const urls = await Promise.all(
        allPaths.map(async (p, i) => {
          const filename = allPaths.length === 1
            ? `${r.order_number}.jpg`
            : `${r.order_number}-wall-${i + 1}.jpg`;
          try {
            return await signedPrintUrl(p, TTL, { download: filename });
          } catch {
            return "";
          }
        })
      );
      return { row: r, urls: urls.filter(Boolean) };
    })
  );

  const newCount = list.filter((r) => r.status === "new").length;
  const inProductionCount = list.filter((r) => r.status === "in_production").length;
  const totalSqm = list.reduce((s, r) => s + Number(r.total_sqm ?? 0), 0);

  // Production load: m² waiting per finish + oldest unstarted order.
  const sqmByFinish = list.reduce<Record<string, number>>((acc, r) => {
    const f = r.wallpaper_style ?? "unknown";
    acc[f] = (acc[f] ?? 0) + Number(r.total_sqm ?? 0);
    return acc;
  }, {});
  const oldestNew = list.filter((r) => r.status === "new")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
  const oldestNewHours = oldestNew
    ? Math.floor((Date.now() - new Date(oldestNew.created_at).getTime()) / (60 * 60 * 1000))
    : null;

  const loadedAt = Date.now();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Print queue</h1>
          <p className="mt-1 text-sm text-stone-600">
            Paid orders awaiting print. Sample-pack orders are excluded.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
              {newCount} new
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
              {inProductionCount} in production
            </span>
            {totalSqm > 0 && (
              <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-700">
                {totalSqm.toFixed(2)} m² total
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {list.length > 0 && (
              <a
                href="/admin/print-queue/manifest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14H5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2zM7 10V5a2 2 0 012-2h6a2 2 0 012 2v5M9 18h6" />
                </svg>
                Pull sheet
              </a>
            )}
            <RefreshButton initialLoadedAt={loadedAt} />
          </div>
        </div>
      </header>

      {list.length > 0 && (
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Total m² to print</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{totalSqm.toFixed(1)}</p>
              <p className="mt-0.5 text-xs text-stone-500">{list.length} order{list.length === 1 ? "" : "s"} across all stages</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">By finish</p>
              <div className="mt-1 space-y-0.5">
                {Object.entries(sqmByFinish)
                  .sort((a, b) => b[1] - a[1])
                  .map(([finish, sqm]) => (
                    <div key={finish} className="flex justify-between text-sm">
                      <span className="capitalize text-stone-700">{finish}</span>
                      <span className="tabular-nums text-stone-900">{sqm.toFixed(1)} m²</span>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Oldest unstarted</p>
              {oldestNew && oldestNewHours != null ? (
                <>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
                    {oldestNewHours < 24 ? `${oldestNewHours}h` : `${Math.floor(oldestNewHours / 24)}d`}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    <Link href={`/admin/orders/${oldestNew.id}`} className="font-mono hover:text-amber-700">
                      {oldestNew.order_number}
                    </Link>{" — "}
                    paid {new Date(oldestNew.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-stone-500">No new orders waiting.</p>
              )}
            </div>
          </div>
        </section>
      )}

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
                    <OrderThumbnail
                      productType="wallpaper"
                      imageUrl={urls[0]}
                      size="md"
                    />
                    <div>
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="font-mono text-base font-bold text-stone-900 hover:text-amber-700"
                      >
                        {row.order_number}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isNew ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isNew ? "New" : "In production"}
                        </span>
                        <span className="text-xs text-stone-500">
                          Paid {new Date(row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
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
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {row.wallpaper_type
                        ? WALLPAPER_TYPE_LABELS[row.wallpaper_type as WallpaperType] ?? row.wallpaper_type
                        : "Type not set"}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-900">
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
                    <div className="mt-2">
                      <CopyButton
                        small
                        label="Copy address"
                        value={`${row.customer_name}\n${row.city}, ${provinceLabel} ${row.postal_code}\n${row.customer_phone}`}
                      />
                    </div>
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
