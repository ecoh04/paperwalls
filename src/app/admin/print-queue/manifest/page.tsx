import { createClient } from "@/lib/supabase/server";
import { signedPrintUrls } from "@/lib/storage";
import { MATERIAL_LABELS, APPLICATION_LABELS, PROVINCE_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { WallpaperMaterial, ApplicationMethod, ShippingProvince } from "@/types/order";
import { PrintTrigger } from "@/components/admin/PrintTrigger";

// Print-team pull sheet. One printable page summarising every order
// currently in the queue (status='new' or 'in_production'). The operator
// prints this once at the start of a shift, pins it to the press wall,
// and ticks off orders as they go.
//
// Designed to print cleanly on A4: page-break per order so each order
// is its own physical sheet (or chunk). Big thumbnails for visual ID,
// big address blocks for hand-writing labels, big spec blocks so nobody
// squints at the press.
//
// Renders without the admin chrome — it's a working document, not part
// of the dashboard layout.

export const dynamic = "force-dynamic";

type Row = {
  id:                 string;
  order_number:       string;
  status:             string;
  customer_name:      string;
  customer_email:     string;
  customer_phone:     string;
  address_line1:      string;
  address_line2:      string | null;
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

export default async function PrintManifestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-white p-12">
        <p className="text-sm text-stone-700">Please log in to view this page.</p>
      </main>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, customer_email, customer_phone, address_line1, address_line2, city, province, postal_code, wall_count, wall_width_m, wall_height_m, total_sqm, walls_spec, wallpaper_style, application_method, image_url, image_urls, total_cents, created_at"
    )
    .in("status", ["new", "in_production"])
    .eq("product_type", "wallpaper")
    .is("deleted_at", null)
    .is("refunded_at", null)
    .order("created_at", { ascending: true });

  const list = (orders ?? []) as Row[];

  // Sign all image URLs in one pass.
  const flatPaths = list.flatMap((r) => {
    const paths = parsePaths(r.image_urls);
    return paths.length > 0 ? paths : r.image_url ? [r.image_url] : [];
  });
  const signed = await signedPrintUrls(flatPaths);
  let signedIdx = 0;
  const decorated = list.map((r) => {
    const paths = parsePaths(r.image_urls);
    const count = paths.length > 0 ? paths.length : r.image_url ? 1 : 0;
    const urls  = signed.slice(signedIdx, signedIdx + count);
    signedIdx += count;
    return { row: r, urls };
  });

  const totalSqm = list.reduce((s, r) => s + Number(r.total_sqm ?? 0), 0);
  const generatedAt = new Date().toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-white p-8 print:p-6">
      <PrintTrigger />

      <header className="mb-6 flex items-baseline justify-between border-b-2 border-stone-900 pb-4 print:mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Print pull sheet</h1>
          <p className="mt-1 text-sm text-stone-600">
            {list.length} order{list.length === 1 ? "" : "s"}
            {totalSqm > 0 ? ` · ${totalSqm.toFixed(2)} m² total` : ""}
            {" · "}generated {generatedAt} SAST
          </p>
        </div>
        <a
          href="/admin/print-queue"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 no-print"
        >
          ← Print queue
        </a>
      </header>

      {list.length === 0 ? (
        <p className="text-stone-600">Nothing in the queue. New paid wallpaper orders will show here.</p>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {decorated.map(({ row, urls }, i) => {
            const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;
            return (
              <article
                key={row.id}
                className={[
                  "border-2 border-stone-900 p-6",
                  // Force a new page per order on print, except the first one
                  i > 0 ? "print:break-before-page" : "",
                ].join(" ")}
              >
                {/* Top strip */}
                <div className="mb-5 flex items-start justify-between gap-4 border-b border-stone-300 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Order</p>
                    <p className="mt-0.5 font-mono text-2xl font-bold text-stone-900">{row.order_number}</p>
                    <p className="text-xs text-stone-500">
                      Paid {new Date(row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{formatZarCents(row.total_cents)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={[
                        "inline-block rounded border-2 px-3 py-1 text-sm font-bold uppercase tracking-wider",
                        row.status === "new"
                          ? "border-amber-600 bg-amber-100 text-amber-900"
                          : "border-blue-600 bg-blue-100 text-blue-900",
                      ].join(" ")}
                    >
                      {row.status === "new" ? "TO PRINT" : "IN PRODUCTION"}
                    </span>
                    <div className="mt-3 flex items-end gap-2">
                      <input type="checkbox" id={`done-${row.id}`} className="h-5 w-5 rounded border-2 border-stone-700" aria-label="Mark printed" />
                      <label htmlFor={`done-${row.id}`} className="text-sm font-semibold uppercase tracking-wider text-stone-700">Printed</label>
                    </div>
                  </div>
                </div>

                {/* 3-column grid: thumbnail / specs / address */}
                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_1.2fr]">
                  {/* Thumbnails */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Print {urls.length === 1 ? "file" : `files (${urls.length})`}
                    </p>
                    {urls.length === 0 ? (
                      <p className="mt-2 text-sm font-medium text-red-700">⚠ NO IMAGE — DO NOT PRINT</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {urls.map((u, idx) => (
                          <div key={idx} className="relative aspect-square overflow-hidden border border-stone-300 bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt={`Wall ${idx + 1}`} className="h-full w-full object-cover" />
                            {urls.length > 1 && (
                              <span className="absolute left-1 top-1 rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                Wall {idx + 1}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Specs</p>
                    <dl className="mt-2 space-y-1.5 text-sm">
                      <Row label="Walls" value={String(row.wall_count)} />
                      <Row
                        label="Dimensions"
                        value={
                          row.walls_spec?.length
                            ? row.walls_spec.map((w) => `${Math.round(w.widthM * 100)} × ${Math.round(w.heightM * 100)} cm`).join(" · ")
                            : `${Math.round(Number(row.wall_width_m) * 100)} × ${Math.round(Number(row.wall_height_m) * 100)} cm`
                        }
                      />
                      <Row label="Total" value={row.total_sqm ? `${Number(row.total_sqm).toFixed(2)} m²` : "—"} />
                      <Row label="Finish" value={MATERIAL_LABELS[(row.wallpaper_style as WallpaperMaterial)] ?? row.wallpaper_style ?? "—"} />
                      <Row label="Install" value={APPLICATION_LABELS[(row.application_method as ApplicationMethod) ?? "diy"]} />
                    </dl>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ship to</p>
                    <div className="mt-2 space-y-1 text-sm leading-snug">
                      <p className="font-bold text-stone-900">{row.customer_name}</p>
                      <p>{row.address_line1}</p>
                      {row.address_line2 && <p>{row.address_line2}</p>}
                      <p>{row.city}, {provinceLabel} {row.postal_code}</p>
                      <p className="pt-2 text-stone-700">📞 {row.customer_phone}</p>
                      <p className="text-xs text-stone-500">{row.customer_email}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-900 text-right">{value}</dd>
    </div>
  );
}
