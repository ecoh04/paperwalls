import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { signedPrintUrl } from "@/lib/storage";
import { CartClearOnMount } from "@/components/checkout/CartClearOnMount";
import { PurchasePixelTrigger } from "@/components/checkout/PurchasePixelTrigger";
import { addBusinessDays, formatSaDate } from "@/lib/business-days";

// ──────────────────────────────────────────────────────────────────────────
// /checkout/success — the moment a customer sees right after PayFast.
//
// Goals:
//   1. Reinforce the purchase emotionally. Their image, their order, their
//      timeline. No generic "thank you for your order, here's a checkmark".
//   2. Reassure. Specific dates instead of "within 5 days".
//   3. Variant-aware. Sample packs and pro-install orders have genuinely
//      different next steps, so the copy diverges where it matters.
//
// Server-rendered so the hero image, dates, and personalised greeting all
// land in the first paint. A tiny client child clears the cart on mount.
// ──────────────────────────────────────────────────────────────────────────

type SearchParams = { orders?: string };

type OrderRow = {
  order_number:       string;
  customer_name:      string | null;
  customer_email:     string | null;
  product_type:       string | null;
  application_method: string | null;
  image_url:          string | null;
  image_urls:         string[] | null;
  total_cents:        number;
  total_sqm:          number | null;
  wall_count:         number;
  wallpaper_style:    string | null;
  quantity:           number;
};

function maskEmail(email: string | null | undefined): string {
  if (!email) return "your email";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const stars   = "•".repeat(Math.max(2, local.length - 2));
  return `${visible}${stars}@${domain}`;
}

function firstName(full: string | null | undefined): string {
  if (!full) return "";
  const parts = full.trim().split(/\s+/);
  return parts[0] ?? "";
}

async function fetchOrders(orderNumbers: string[]): Promise<OrderRow[]> {
  if (!supabaseAdmin || orderNumbers.length === 0) return [];
  const { data } = await supabaseAdmin
    .from("orders")
    .select(
      "order_number, customer_name, customer_email, product_type, application_method, image_url, image_urls, total_cents, total_sqm, wall_count, wallpaper_style, quantity"
    )
    .in("order_number", orderNumbers);
  return (data ?? []) as OrderRow[];
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderNumbers = (params.orders ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const orders = await fetchOrders(orderNumbers);
  const primary = orders[0];
  const isSample      = primary?.product_type === "sample_pack";
  const isProInstall  = primary?.application_method === "pro_installer" || primary?.application_method === "installer";

  // Pick a hero image:
  //   1. The customer's own wallpaper (signed URL of their first print file).
  //   2. The sample-pack flat lay if it's a sample order.
  //   3. A real-home shot as a graceful fallback when the image isn't fetchable.
  const heroPath = primary
    ? (Array.isArray(primary.image_urls) && primary.image_urls.length > 0
        ? primary.image_urls[0]
        : primary.image_url)
    : null;

  let heroSrc: string;
  let heroIsCustomerImage = false;
  if (isSample) {
    heroSrc = "/images/product/pdp-14-sample.jpg";
  } else if (heroPath) {
    try {
      heroSrc = await signedPrintUrl(heroPath, 60 * 60 * 24); // 24h is plenty for a one-time view
      heroIsCustomerImage = true;
    } catch {
      heroSrc = "/images/product/pdp-11-home-1.jpg";
    }
  } else {
    heroSrc = "/images/product/pdp-11-home-1.jpg";
  }

  // Date math from now (SAST). Rough timeline:
  //   Today        — order received, file going on press
  //   +2 biz days  — printed and packed
  //   +5 biz days  — courier collected, tracking emailed
  //   +7-10 biz    — estimated delivery (we say 7-10 to give buffer)
  const now      = new Date();
  const packedBy = formatSaDate(addBusinessDays(now, 2));
  const shipsBy  = formatSaDate(addBusinessDays(now, 5));
  const earlyEta = formatSaDate(addBusinessDays(now, 7));
  const lateEta  = formatSaDate(addBusinessDays(now, 10));

  const greeting = primary?.customer_name ? `Thank you, ${firstName(primary.customer_name)}.` : "Thank you.";
  const maskedEmail = maskEmail(primary?.customer_email);

  return (
    <Suspense>
      <CartClearOnMount />
      {orderNumbers.length > 0 && (
        <PurchasePixelTrigger
          orderNumbers={orderNumbers}
          valueCents={orders.reduce((s, o) => s + Number(o.total_cents ?? 0), 0)}
          numItems={orders.length}
        />
      )}

      <main className="bg-pw-bg pb-20 sm:pb-24">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="border-b border-pw-stone bg-pw-surface">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 lg:grid-cols-12">
            <div className="order-2 flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:order-1 lg:col-span-6 lg:px-12 lg:py-20">
              <p className="pw-overline text-pw-accent">Order confirmed</p>
              <h1 className="pw-display mt-3 text-pw-ink sm:mt-4">
                {greeting}
              </h1>
              <p className="pw-body-lg mt-4 max-w-md text-pw-ink/70 sm:mt-5">
                {isSample
                  ? `Your sample pack ships within 1–2 business days. R150 of what you paid will credit against your first wallpaper order.`
                  : isProInstall
                    ? `Your wallpaper goes on the press today. Your installer will be in touch within 2 business days to arrange the wall.`
                    : `Your wallpaper goes on the press today. We'll keep you posted at every step.`}
              </p>

              {orderNumbers.length > 0 && (
                <div className="mt-7 inline-flex flex-col gap-2 self-start rounded-pw border border-pw-stone bg-pw-bg px-5 py-4">
                  <p className="pw-overline text-pw-muted">
                    Order number{orderNumbers.length > 1 ? "s" : ""}
                  </p>
                  <p className="pw-h3 font-mono text-pw-ink">
                    {orderNumbers.join(" · ")}
                  </p>
                  <p className="pw-small text-pw-muted">
                    Confirmation sent to <span className="font-medium text-pw-ink">{maskedEmail}</span>. Check spam if it doesn&rsquo;t land.
                  </p>
                </div>
              )}
            </div>

            <div className="relative order-1 aspect-[4/3] lg:order-2 lg:col-span-6 lg:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroSrc}
                alt={isSample
                  ? "Your PaperWalls sample pack"
                  : heroIsCustomerImage
                    ? "Your wallpaper, going on the press"
                    : "PaperWalls real-home installation"}
                className="h-full w-full object-cover"
              />
              {heroIsCustomerImage && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-5 sm:p-6">
                  <p className="pw-overline text-white/80">Your wallpaper</p>
                  <p className="pw-small mt-0.5 text-white">
                    {primary?.wall_count ?? 1} wall{(primary?.wall_count ?? 1) === 1 ? "" : "s"}
                    {primary?.total_sqm ? ` · ${Number(primary.total_sqm).toFixed(2)} m²` : ""}
                    {primary?.wallpaper_style ? ` · ${primary.wallpaper_style[0].toUpperCase()}${primary.wallpaper_style.slice(1)}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Pro-install banner ────────────────────────────────────── */}
        {isProInstall && (
          <section className="border-b border-pw-stone bg-purple-50">
            <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-12">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M11.49 3.17a.75.75 0 011.06 0l4.28 4.28a.75.75 0 010 1.06l-9.42 9.42a.75.75 0 01-.32.19l-4.28 1.21a.75.75 0 01-.92-.92l1.21-4.28a.75.75 0 01.19-.32l9.42-9.64z" />
                </svg>
                <div>
                  <p className="pw-small font-semibold text-purple-900">
                    Your installer will reach out within 2 business days
                  </p>
                  <p className="pw-small mt-1 text-purple-900/75">
                    They&rsquo;ll arrange a wall prep + install date with you directly. You don&rsquo;t need to do anything
                    until they&rsquo;re in touch. Reply <a href="mailto:hello@paperwalls.co.za" className="underline underline-offset-[3px]">hello@paperwalls.co.za</a> if you don&rsquo;t hear from them by {packedBy}.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Anticipation timeline ─────────────────────────────────── */}
        <section className="bg-pw-bg py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
            <p className="pw-overline text-pw-muted">What happens next</p>
            <h2 className="pw-h2 mt-3 text-pw-ink">Here&rsquo;s the schedule.</h2>

            <ol className="mt-8 space-y-6">
              {(isSample
                ? [
                    { when: "Today",                  t: "Order received",            b: "We'll pack your sample pack tomorrow." },
                    { when: shipsBy,                  t: "Shipped via courier",       b: "Tracking number arrives by email." },
                    { when: `${earlyEta} – ${lateEta}`, t: "Estimated delivery",       b: "Most addresses receive in 1–3 business days." },
                  ]
                : isProInstall
                  ? [
                      { when: "Today",                t: "Order received",            b: "Your file is checked and on the press." },
                      { when: packedBy,               t: "Printed and packed",        b: "Your installer is contacted to arrange handover." },
                      { when: shipsBy,                t: "Handed over to your installer", b: "They'll schedule the install with you directly." },
                      { when: `${earlyEta} – ${lateEta}`, t: "Wall complete",          b: "Your installer confirms when finished." },
                    ]
                  : [
                      { when: "Today",                t: "Order received",            b: "Your file is checked and on the press." },
                      { when: packedBy,               t: "Printed and packed",        b: "Trimmed, rolled, and labelled in Cape Town." },
                      { when: shipsBy,                t: "Shipped via courier",       b: "Tracking number arrives by email." },
                      { when: `${earlyEta} – ${lateEta}`, t: "Estimated delivery",     b: "Most SA addresses receive in 1–3 business days." },
                    ]
              ).map((step, i, arr) => (
                <li key={step.t} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className="pw-overline flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-pw-ink/20 bg-pw-surface text-pw-ink"
                    >
                      {i + 1}
                    </span>
                    {i < arr.length - 1 && <span aria-hidden className="mt-1 h-full w-px flex-1 bg-pw-stone" />}
                  </div>
                  <div className="pb-2">
                    <p className="pw-overline text-pw-muted">{step.when}</p>
                    <p className="pw-body mt-1 font-semibold text-pw-ink">{step.t}</p>
                    <p className="pw-small mt-1 text-pw-ink/70">{step.b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Promise band ──────────────────────────────────────────── */}
        <section className="border-y border-pw-stone bg-pw-surface py-10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <ul className="grid gap-6 sm:grid-cols-3">
              <PromiseItem
                title="Free reprints"
                body="If anything ships imperfect, we reprint at our cost. No return shipping."
              />
              <PromiseItem
                title="Reply within 1 business day"
                body={`Real people reply. Email hello@paperwalls.co.za any time.`}
              />
              <PromiseItem
                title="Free SA delivery"
                body="Insured, tracked, and included on every order."
              />
            </ul>
          </div>
        </section>

        {/* ── While you wait ────────────────────────────────────────── */}
        {!isSample && (
          <section className="bg-pw-bg py-14 sm:py-16">
            <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
              <p className="pw-overline text-pw-muted">While you wait</p>
              <h2 className="pw-h3 mt-3 text-pw-ink">Get the wall ready.</h2>
              <ul className="mt-6 space-y-3">
                <WaitingLink href="/how-it-works#prep"
                             title="Prepare your wall"
                             body="Clean, dry, primed. We&rsquo;ll send a checklist a day before delivery." />
                <WaitingLink href="/materials"
                             title="Care guide"
                             body="How to clean your finish. What to avoid. How long it lasts." />
                <WaitingLink href="/faq"
                             title="Common questions"
                             body="Lift hours, bubbles, removing later. Most answers in two minutes." />
              </ul>
            </div>
          </section>
        )}

        {/* ── Footer line ───────────────────────────────────────────── */}
        <section className="bg-pw-bg pb-14 sm:pb-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-3 border-t border-pw-stone pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="pw-small text-pw-muted">
                Anything to ask?{" "}
                <a href="mailto:hello@paperwalls.co.za" className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors">
                  hello@paperwalls.co.za
                </a>
              </p>
              <Link
                href="/"
                className="pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
              >
                Continue browsing →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Suspense>
  );
}

function PromiseItem({ title, body }: { title: string; body: string }) {
  return (
    <li>
      <p className="pw-body font-semibold text-pw-ink">{title}</p>
      <p className="pw-small mt-1 text-pw-ink/70">{body}</p>
    </li>
  );
}

function WaitingLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-pw border border-pw-stone bg-pw-surface p-5 transition hover:border-pw-ink/40 hover:shadow-pw-sm"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="pw-body font-semibold text-pw-ink">{title}</p>
          <span aria-hidden className="text-pw-muted transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <p className="pw-small mt-1 text-pw-ink/70">{body}</p>
      </Link>
    </li>
  );
}
