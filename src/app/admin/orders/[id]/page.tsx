import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signedPrintUrls } from "@/lib/storage";
import {
  ORDER_STATUS_LABELS,
  WALLPAPER_TYPE_LABELS,
  MATERIAL_LABELS,
  APPLICATION_LABELS,
  PROVINCE_LABELS,
  formatZarCents,
} from "@/lib/admin-labels";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { OrderNoteForm } from "@/components/admin/OrderNoteForm";
import {
  updateOrderStatus,
  addOrderNote,
} from "@/app/admin/orders/actions";
import { OrderEditForm } from "@/components/admin/OrderEditForm";
import { OrderActionButtons } from "@/components/admin/OrderActionButtons";
import { ShipOrderForm } from "@/components/admin/ShipOrderForm";
import { MarkDeliveredButton } from "@/components/admin/MarkDeliveredButton";
import { PreflightChecks } from "@/components/admin/PreflightChecks";
import { ResendEmailButtons } from "@/components/admin/ResendEmailButtons";
import { OrderTypeBadge } from "@/components/admin/OrderTypeBadge";
import { EmailHistoryPanel } from "@/components/admin/EmailHistoryPanel";
import { CopyButton } from "@/components/admin/CopyButton";
import type { OrderStatus, WallpaperType, WallpaperMaterial, ApplicationMethod, ShippingProvince } from "@/types/order";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  order_number: string;
  status: string;
  product_type: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province: string;
  postal_code: string;
  wall_width_m: number | null;
  wall_height_m: number | null;
  wall_count: number;
  total_sqm: number | null;
  image_url: string | null;
  image_urls: string[] | null;
  walls_spec: { widthM: number; heightM: number }[] | null;
  image_quality: { level: string; pxPerMm: number; widthPx: number; heightPx: number } | null;
  wallpaper_type: string | null;
  wallpaper_style: string | null;
  application_method: string | null;
  tracking_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  discount_code: string | null;
  total_cents: number;
  payment_id: string | null;
  payments: { gateway_payment_id: string | null; status: string } | null;
  shipping_notes: string | null;
  notes: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  refunded_at: string | null;
  deleted_at: string | null;
};

type ActivityRow = {
  id: string;
  action: string;
  actor_email: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
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
    .select("*, payments(gateway_payment_id, status)")
    .eq("id", id)
    .single();

  // (`select *` already returns the new tracking_* / dispatched_at columns
  // — Row type was extended above so TS sees them.)

  if (error || !order) {
    notFound();
  }

  const isAdmin = true; // single-admin setup

  const { data: activity } = await supabase
    .from("order_activity")
    .select("id, action, actor_email, old_value, new_value, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Customer lifetime stats — surface "this person has spent R X over N
  // orders" inline on the order so the operator instantly knows whether to
  // treat as VIP or first-timer. Only fetched when the order is linked to a
  // customer record (won't be true for the very first order before
  // identify_customer ran).
  const customerId = (order as { customer_id?: string | null }).customer_id ?? null;
  const { data: customerStats } = customerId
    ? await supabase
        .from("customers")
        .select("id, total_orders, total_spent_cents, last_seen_at, first_seen_at")
        .eq("id", customerId)
        .maybeSingle()
    : { data: null as null | {
        id: string;
        total_orders: number;
        total_spent_cents: number;
        last_seen_at: string | null;
        first_seen_at: string | null;
      } };

  // Latest successful send per type, so the resend buttons can show "last sent X ago".
  const { data: lastSentRows } = await supabase
    .from("scheduled_emails")
    .select("type, sent_at")
    .eq("order_id", id)
    .eq("status", "sent")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false });
  const lastSent: Record<string, string> = {};
  for (const r of (lastSentRows ?? []) as { type: string; sent_at: string }[]) {
    if (!lastSent[r.type]) lastSent[r.type] = r.sent_at;
  }

  const row = order as Row;
  const imageUrls = parseImageUrls(row.image_urls);
  const paths = imageUrls.length > 0 ? imageUrls : row.image_url ? [row.image_url] : [];
  const urls = await signedPrintUrls(paths);
  const status = (row.status ?? "new") as OrderStatus;
  const provinceLabel = PROVINCE_LABELS[(row.province as ShippingProvince) ?? "other"] ?? row.province;
  const activityList = ((activity ?? []) as unknown) as ActivityRow[];
  // 'pro_installer' is the canonical token in the orders schema; legacy
  // rows used 'installer'. Match both so the banner surfaces correctly.
  const needsInstaller = row.application_method === "pro_installer" || row.application_method === "installer";

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
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-stone-900">
              {row.order_number}
            </h1>
            <OrderTypeBadge type={row.product_type} size="md" />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {row.product_type === "sample_pack"
              ? `Sample pack · qty ${row.quantity}`
              : `Custom wallpaper · ${row.wall_count} wall${row.wall_count === 1 ? "" : "s"}${row.total_sqm ? ` · ${Number(row.total_sqm).toFixed(2)} m²` : ""}`}
          </p>
          {row.product_type !== "sample_pack" && row.image_quality && (() => {
            const q = row.image_quality;
            const dpi = Math.round(q.pxPerMm * 25.4);
            const tone = q.level === "too_low"    ? "bg-red-100 text-red-800"
                       : q.level === "borderline" ? "bg-amber-100 text-amber-800"
                       :                             "bg-green-100 text-green-800";
            const label = q.level === "too_low"    ? "Low res — buyer accepted"
                        : q.level === "borderline" ? "Borderline — buyer accepted"
                        :                             "Good resolution";
            return (
              <p className="mt-1.5">
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
                  {label} · ~{dpi} dpi · {q.widthPx}×{q.heightPx}px
                </span>
              </p>
            );
          })()}
        </div>
        <div className="flex flex-wrap items-center gap-4">
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

      {/* Pro install banner — fulfilment is genuinely different (the
          installer collects or we ship to them), so surface it loudly. */}
      {needsInstaller && status !== "cancelled" && !row.deleted_at && (
        <section className="rounded-xl border-2 border-purple-300 bg-purple-50 p-5">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.49 3.17a.75.75 0 011.06 0l4.28 4.28a.75.75 0 010 1.06l-9.42 9.42a.75.75 0 01-.32.19l-4.28 1.21a.75.75 0 01-.92-.92l1.21-4.28a.75.75 0 01.19-.32l9.42-9.64z" />
            </svg>
            <div>
              <h2 className="text-base font-semibold text-purple-900">Pro installer required</h2>
              <p className="mt-1 text-sm text-purple-900/80">
                The customer paid for professional installation. <strong>Coordinate with your
                installer before dispatching</strong> — they may collect the rolls from the
                press or you may need to ship to a different (installer&rsquo;s) address.
                Don&rsquo;t default-ship to the customer&rsquo;s address.
              </p>
              <p className="mt-2 text-xs text-purple-900/70">
                Tracking should reflect whichever leg the customer actually receives.
              </p>
            </div>
          </div>
        </section>
      )}

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

      {/* Pre-flight readiness — surfaced for every non-cancelled order.
          The component itself swaps its checklist based on product_type,
          so wallpaper looks for print files / dimensions / finish, while
          sample packs only validate quantity + address + phone. */}
      {status !== "cancelled" && !row.deleted_at && (
        <PreflightChecks
          productType={(row.product_type === "sample_pack" ? "sample_pack" : "wallpaper") as "sample_pack" | "wallpaper"}
          imagesPresent={paths.length > 0}
          imageCount={paths.length}
          wallCount={row.wall_count}
          totalSqm={row.total_sqm ? Number(row.total_sqm) : null}
          province={row.province}
          postalCode={row.postal_code}
          addressLine1={row.address_line1}
          customerPhone={row.customer_phone}
          wallpaperStyle={row.wallpaper_style}
          applicationMethod={row.application_method}
          quantity={row.quantity}
        />
      )}

      {/* Fulfilment: ship + notify, then mark delivered. Only for paid orders
          on the customer-fulfilment path (skip pending / cancelled / refunded). */}
      {isAdmin
        && !row.deleted_at
        && row.refunded_at == null
        && (status === "in_production" || status === "new" || status === "shipped") && (
        <ShipOrderForm
          orderId={id}
          initialCourier={row.courier_name}
          initialTracking={row.tracking_number}
          initialTrackingUrl={row.tracking_url}
          alreadyShipped={status === "shipped"}
        />
      )}

      {isAdmin && status === "shipped" && !row.deleted_at && (
        <MarkDeliveredButton orderId={id} />
      )}

      {isAdmin
        && !row.deleted_at
        && row.refunded_at == null
        && status !== "pending"
        && status !== "cancelled"
        && row.customer_email && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">Resend customer email</p>
          <p className="mt-1 text-xs text-stone-500">
            Use when the customer says they didn't get one. Each click queues a fresh send.
          </p>
          <div className="mt-3">
            <ResendEmailButtons
              orderId={id}
              status={status}
              hasTracking={!!row.tracking_number}
              lastSent={{
                order_confirmed: lastSent["order_confirmed"],
                order_shipped:   lastSent["order_shipped"],
                order_delivered: lastSent["order_delivered"],
              }}
            />
          </div>
        </div>
      )}

      {isAdmin && row.product_type === "wallpaper" && (
        <OrderEditForm
          orderId={id}
          initial={{
            customer_name:      row.customer_name,
            customer_email:     row.customer_email,
            customer_phone:     row.customer_phone,
            address_line1:      row.address_line1,
            address_line2:      row.address_line2,
            city:               row.city,
            province:           row.province,
            postal_code:        row.postal_code,
            wall_width_m:       Number(row.wall_width_m ?? 0),
            wall_height_m:      Number(row.wall_height_m ?? 0),
            wall_count:         row.wall_count,
            total_sqm:          Number(row.total_sqm ?? 0),
            wallpaper_style:    row.wallpaper_style ?? "",
            application_method: row.application_method ?? "",
            walls_spec:         row.walls_spec ?? null,
          }}
        />
      )}

      {/* Sample-pack orders skip the print-spec grid entirely; they ship
          directly. Show a thin info card instead. */}
      {row.product_type === "sample_pack" && (
        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Sample pack</h2>
          <p className="mt-2 text-sm text-stone-700">
            All three finishes (satin, matte, linen) — A5 swatches, no print files needed. Pick, pack, ship.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Quantity: {row.quantity}
          </p>
        </section>
      )}

      <div className={`grid gap-6 ${row.product_type === "wallpaper" ? "lg:grid-cols-2" : ""}`}>
        {row.product_type === "wallpaper" && (
        <section className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-lg font-semibold text-stone-900">Print specs</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Type</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {row.wallpaper_type
                  ? WALLPAPER_TYPE_LABELS[row.wallpaper_type as WallpaperType] ?? row.wallpaper_type
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Wall(s)</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {row.wall_count === 1 ? (
                  <>
                    W {Math.round(Number(row.wall_width_m) * 100)} cm&nbsp;&nbsp;x&nbsp;&nbsp;H {Math.round(Number(row.wall_height_m) * 100)} cm
                    {row.total_sqm ? ` (${Number(row.total_sqm).toFixed(2)} m²)` : ""}
                  </>
                ) : row.walls_spec?.length ? (
                  <>
                    {row.wall_count} walls:
                    <ul className="mt-1 space-y-0.5">
                      {row.walls_spec.map((w, i) => (
                        <li key={i}>
                          Wall {i + 1}: W {Math.round(w.widthM * 100)} cm&nbsp;&nbsp;x&nbsp;&nbsp;H {Math.round(w.heightM * 100)} cm
                        </li>
                      ))}
                    </ul>
                    {row.total_sqm ? (
                      <span className="text-sm font-normal text-stone-600">{Number(row.total_sqm).toFixed(2)} m² total</span>
                    ) : null}
                  </>
                ) : (
                  <>
                    {row.wall_count} x (W {Math.round(Number(row.wall_width_m) * 100)} cm&nbsp;&nbsp;x&nbsp;&nbsp;H {Math.round(Number(row.wall_height_m) * 100)} cm)
                    {row.total_sqm ? ` (${Number(row.total_sqm).toFixed(2)} m² total)` : ""}
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500">Finish</dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {MATERIAL_LABELS[(row.wallpaper_style as WallpaperMaterial)] ?? row.wallpaper_style ?? "—"}
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
        )}

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-900">Customer & delivery</h2>
            {customerStats && (
              <Link
                href={`/admin/customers/${customerStats.id}`}
                className="text-xs font-medium text-amber-600 hover:underline"
              >
                Full history →
              </Link>
            )}
          </div>

          {customerStats && (() => {
            // total_orders includes the current order — it counts as the
            // customer's Nth purchase. Frame it that way: clearer than
            // "X prior orders" and matches Shopify's wording.
            const orderNumberInLifetime = Math.max(1, customerStats.total_orders ?? 1);
            const lifetimeR             = Math.round((customerStats.total_spent_cents ?? 0) / 100);
            const isVip                 = lifetimeR >= 5000 || orderNumberInLifetime >= 3;
            const isFirstTime           = orderNumberInLifetime === 1;
            const lastSeenIso           = customerStats.last_seen_at ?? customerStats.first_seen_at ?? null;
            const daysSinceLastSeen     = lastSeenIso
              ? Math.floor((Date.now() - new Date(lastSeenIso).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            const lastSeenLabel = daysSinceLastSeen == null
              ? null
              : daysSinceLastSeen < 1
                ? "today"
                : daysSinceLastSeen === 1
                  ? "yesterday"
                  : daysSinceLastSeen < 30
                    ? `${daysSinceLastSeen} days ago`
                    : `${Math.floor(daysSinceLastSeen / 30)} mo ago`;

            return (
              <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                isFirstTime
                  ? "bg-sky-50 ring-1 ring-sky-200 text-sky-900"
                  : isVip
                    ? "bg-amber-50 ring-1 ring-amber-200 text-amber-900"
                    : "bg-stone-50 ring-1 ring-stone-200 text-stone-700"
              }`}>
                {isFirstTime ? (
                  <span className="font-semibold">First-time customer</span>
                ) : (
                  <>
                    <span className="font-semibold">
                      {isVip && <span className="mr-1.5">★</span>}
                      Order #{orderNumberInLifetime} for this customer
                    </span>
                    <span className="text-stone-400">·</span>
                    <span>R&nbsp;{lifetimeR.toLocaleString("en-ZA")} lifetime spend</span>
                    {lastSeenLabel && (
                      <>
                        <span className="text-stone-400">·</span>
                        <span>last seen {lastSeenLabel}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}

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
              <dd className="mt-0.5 flex items-center gap-2">
                <a
                  href={`tel:${row.customer_phone}`}
                  className="inline-flex items-center gap-1.5 text-amber-600 hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {row.customer_phone}
                </a>
                <CopyButton value={row.customer_phone} label="Copy" small />
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
              <div className="mt-2">
                <CopyButton
                  value={`${row.customer_name}\n${row.address_line1}${row.address_line2 ? `\n${row.address_line2}` : ""}\n${row.city}, ${provinceLabel} ${row.postal_code}\n${row.customer_phone}`}
                  label="Copy address block"
                  small
                />
              </div>
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
            <dt className="text-xs text-stone-500">Payment reference</dt>
            <dd className="font-mono text-xs text-stone-600">
              {row.payments?.gateway_payment_id ?? "—"}
              {row.payments?.status && row.payments.status !== "paid" && (
                <span className="ml-2 rounded bg-amber-100 px-1 py-0.5 text-xs text-amber-800">
                  {row.payments.status}
                </span>
              )}
            </dd>
          </div>
          {row.discount_code && (
            <div>
              <dt className="text-xs text-stone-500">Discount</dt>
              <dd className="font-mono text-xs text-stone-600">
                {row.discount_code}
                {row.discount_cents > 0 && (
                  <span className="ml-2 text-green-700">−{formatZarCents(row.discount_cents)}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
        {(row.shipping_notes || row.utm_source) && (
          <div className="mt-4 grid gap-2 border-t border-stone-200 pt-4 sm:grid-cols-2">
            {row.shipping_notes && (
              <div>
                <span className="text-xs font-medium text-stone-500">Shipping notes</span>
                <p className="mt-0.5 text-sm text-stone-900">{row.shipping_notes}</p>
              </div>
            )}
            {row.utm_source && (
              <div>
                <span className="text-xs font-medium text-stone-500">Source</span>
                <p className="mt-0.5 text-sm text-stone-600">
                  {row.utm_source}
                  {row.utm_campaign && <span className="ml-2 text-stone-400">/ {row.utm_campaign}</span>}
                </p>
              </div>
            )}
          </div>
        )}

        {(row.tracking_number || row.courier_name) && (
          <div className="mt-4 grid gap-2 border-t border-stone-200 pt-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium text-stone-500">Courier</span>
              <p className="mt-0.5 text-sm text-stone-900">{row.courier_name ?? "—"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-stone-500">Tracking number</span>
              <p className="mt-0.5 font-mono text-sm text-stone-900">
                {row.tracking_url ? (
                  <a href={row.tracking_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline">
                    {row.tracking_number}
                  </a>
                ) : (
                  row.tracking_number ?? "—"
                )}
              </p>
            </div>
          </div>
        )}
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

      <EmailHistoryPanel orderId={id} />

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Activity log</h2>
        <p className="mt-1 text-sm text-stone-500">
          Status changes and notes. Newest first.
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
                  {a.actor_email || "System"}{" "}·{" "}
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
