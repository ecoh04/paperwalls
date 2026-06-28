import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signedPrintUrls } from "@/lib/storage";
import { PrintTrigger } from "@/components/admin/PrintTrigger";
import {
  WALLPAPER_TYPE_LABELS,
  MATERIAL_LABELS,
  APPLICATION_LABELS,
  PROVINCE_LABELS,
} from "@/lib/admin-labels";
import { PRINT_PANEL_WIDTH_CM, panelPlan } from "@/lib/print-config";
import type { WallpaperType, WallpaperMaterial, ApplicationMethod, ShippingProvince } from "@/types/order";

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
  image_quality: { level: string; pxPerMm: number; widthPx: number; heightPx: number } | null;
  wallpaper_type: string | null;
  wallpaper_style: string;
  application_method: string;
  total_cents: number;
  created_at: string;
};

function parseImageUrls(urls: unknown): string[] {
  if (Array.isArray(urls)) return urls.filter((u): u is string => typeof u === "string");
  return [];
}

/**
 * Normalise single-wall and multi-wall orders into one array of walls in cm,
 * so the operator-facing layout below is a single loop with no special cases.
 */
function normaliseWalls(row: Row): { widthCm: number; heightCm: number; sqm: number }[] {
  if (row.walls_spec?.length) {
    return row.walls_spec.map((w) => ({
      widthCm: Math.round(w.widthM * 100),
      heightCm: Math.round(w.heightM * 100),
      sqm: w.widthM * w.heightM,
    }));
  }
  const widthCm = Math.round(Number(row.wall_width_m) * 100);
  const heightCm = Math.round(Number(row.wall_height_m) * 100);
  const single = { widthCm, heightCm, sqm: Number(row.wall_width_m) * Number(row.wall_height_m) };
  // Fall back to repeating the single dimensions wall_count times if no spec.
  const count = Math.max(1, row.wall_count || 1);
  return Array.from({ length: count }, () => single);
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
    .select("order_number, customer_name, customer_email, customer_phone, address_line1, address_line2, city, province, postal_code, wall_width_m, wall_height_m, wall_count, total_sqm, image_url, image_urls, walls_spec, image_quality, wallpaper_type, wallpaper_style, application_method, total_cents, created_at")
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  const row = order as Row;
  const paths = parseImageUrls(row.image_urls).length > 0 ? parseImageUrls(row.image_urls) : [row.image_url];
  const urls = await signedPrintUrls(paths);
  const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;
  const typeLabel = row.wallpaper_type
    ? WALLPAPER_TYPE_LABELS[row.wallpaper_type as WallpaperType] ?? row.wallpaper_type
    : "NOT SET, check the order before loading media";
  const finishLabel = MATERIAL_LABELS[(row.wallpaper_style as WallpaperMaterial)] ?? row.wallpaper_style ?? "—";
  const walls = normaliseWalls(row);
  const totalPanels = walls.reduce((sum, w) => sum + panelPlan(w.widthCm, w.heightCm).count, 0);
  const orderDate = new Date(row.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-white p-8 text-stone-900 print:p-6">
      <div className="mb-6 flex items-center justify-between no-print">
        <p className="text-sm text-stone-500">Factory print sheet</p>
        <Link
          href={`/admin/orders/${id}`}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Back to order
        </Link>
      </div>

      {/* HEADER */}
      <header className="keep-together mb-6 border-b-2 border-stone-900 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Order</p>
            <h1 className="font-mono text-4xl font-bold leading-none">{row.order_number}</h1>
          </div>
          <div className="text-right text-sm">
            <p><span className="text-stone-500">Ordered:</span> <span className="font-medium">{orderDate}</span></p>
            <p className="mt-0.5">
              <span className="text-stone-500">Walls:</span>{" "}
              <span className="font-medium">{walls.length}</span>
              <span className="text-stone-400"> · </span>
              <span className="text-stone-500">Panels to print:</span>{" "}
              <span className="font-bold">{totalPanels}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          <span><span className="text-stone-500">Customer:</span> <span className="font-medium">{row.customer_name}</span></span>
          <span><span className="text-stone-500">Ship to:</span> <span className="font-medium">{row.city}, {provinceLabel}</span></span>
        </div>
      </header>

      {/* MATERIAL / ROLL */}
      <section className="keep-together mb-6 rounded-lg border-2 border-stone-900 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">Material to load</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Type</p>
            <p className="text-2xl font-bold leading-tight">{typeLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Finish</p>
            <p className="text-2xl font-bold leading-tight capitalize">{finishLabel}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          Load the correct media for the type above before printing.
          Install method (for the kit / packing slip): <span className="font-medium">{APPLICATION_LABELS[(row.application_method as ApplicationMethod) ?? "diy"]}</span>.
        </p>
      </section>

      {/* PER WALL + PANEL PLAN */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-500">
          Walls and panel plan
        </h2>
        <p className="mb-3 text-sm text-stone-600">
          Assumed panel / roll width: <span className="font-semibold">{PRINT_PANEL_WIDTH_CM} cm</span> (configurable).
          Hang left to right, panel 1 on the left.
        </p>

        <div className="space-y-5">
          {walls.map((wall, wi) => {
            const plan = panelPlan(wall.widthCm, wall.heightCm);
            const lastPanelDiffers = plan.count > 1 && plan.lastWidthCm !== plan.fullWidthCm;
            return (
              <div key={wi} className="keep-together rounded-lg border-2 border-stone-300 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold">
                    {walls.length > 1 ? `Wall ${wi + 1} of ${walls.length}` : "Wall"}
                  </h3>
                  <span className="text-sm text-stone-500">{wall.sqm.toFixed(2)} m²</span>
                </div>

                {/* Size block — width and height on separate labelled lines. */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded border border-stone-300 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Width</p>
                    <p className="text-3xl font-bold leading-none">{wall.widthCm} cm</p>
                  </div>
                  <div className="rounded border border-stone-300 bg-stone-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Height</p>
                    <p className="text-3xl font-bold leading-none">{wall.heightCm} cm</p>
                  </div>
                </div>

                {/* Panel plan */}
                <div className="mt-4">
                  <p className="text-sm">
                    <span className="font-semibold">Print as {plan.count} panel{plan.count === 1 ? "" : "s"}, left to right:</span>{" "}
                    {plan.count === 1 ? (
                      <>panel 1 = {plan.widths[0]} cm wide x {plan.heightCm} cm tall.</>
                    ) : lastPanelDiffers ? (
                      <>
                        panels 1 to {plan.count - 1} = {plan.fullWidthCm} cm wide x {plan.heightCm} cm tall;
                        {" "}panel {plan.count} = {plan.lastWidthCm} cm wide x {plan.heightCm} cm tall.
                      </>
                    ) : (
                      <>all {plan.count} panels = {plan.fullWidthCm} cm wide x {plan.heightCm} cm tall.</>
                    )}
                  </p>

                  {/* Tiny inline visual of the panels, numbered left to right. */}
                  <div className="mt-2 flex items-stretch gap-1" aria-hidden="true">
                    {plan.widths.map((w, pi) => (
                      <div
                        key={pi}
                        className="flex h-16 items-center justify-center border border-stone-400 bg-stone-100 text-xs font-semibold text-stone-700"
                        // Width proportional to the panel's real width so a
                        // narrow final panel reads as narrow at a glance.
                        style={{ flexGrow: w, flexBasis: 0, minWidth: 28 }}
                      >
                        <div className="text-center leading-tight">
                          <div>{pi + 1}</div>
                          <div className="font-normal text-stone-500">{w}cm</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">Panels shown left to right, in hang order.</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRINT IMAGE(S) */}
      <section className="keep-together mb-6 border-t border-stone-200 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">Print image(s)</h2>
        {row.image_quality && (
          <p className={row.image_quality.level === "good" ? "mt-1 text-sm text-stone-600" : "mt-1 text-sm font-bold text-amber-700"}>
            Image resolution: ~{Math.round(row.image_quality.pxPerMm * 25.4)} dpi
            {" "}({row.image_quality.widthPx}x{row.image_quality.heightPx}px)
            {row.image_quality.level === "too_low"    ? " - LOW, buyer accepted at checkout"
              : row.image_quality.level === "borderline" ? " - borderline, buyer accepted at checkout"
              : ""}
          </p>
        )}
        <ul className="mt-2 list-disc pl-5">
          {urls.map((url, i) => (
            <li key={i}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">
                {urls.length > 1 ? `Wall ${i + 1} print file` : "Print file"}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* OPERATOR CHECKLIST */}
      <section className="keep-together rounded-lg border-2 border-stone-300 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-500">Operator checklist</h2>
        <ol className="mt-2 space-y-2 text-sm">
          {[
            `Load the correct media for the type above (${typeLabel}), finish ${finishLabel}.`,
            "Confirm the wall width and height match the size block for each wall.",
            `Print the panels at the listed sizes (${totalPanels} panel${totalPanels === 1 ? "" : "s"} total across ${walls.length} wall${walls.length === 1 ? "" : "s"}).`,
            "Label each panel 1..N, left to right, per wall.",
            "Quality check resolution and colour against the print image.",
            `Roll, label with the order number ${row.order_number}, and pack.`,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 inline-block h-5 w-5 flex-shrink-0 rounded border-2 border-stone-400" aria-hidden="true" />
              <span><span className="font-semibold">{i + 1}.</span> {step}</span>
            </li>
          ))}
        </ol>
      </section>

      <PrintTrigger />
    </div>
  );
}
