# PaperWalls – Project roadmap

Evaluation and phased next steps for the consumer front-end, factory ops, and analytics.

---

## Current state (what’s done)

| Area | Status |
|------|--------|
| **Site & content** | Home, Shop, Custom wallpaper, About, FAQ, Contact, Shipping, Returns, Privacy, Terms, 404 |
| **Configurator** | Dimensions (1–4 walls, same/different), image upload, preview & crop (frame = print area), style, installation, live pricing |
| **Cart** | CartProvider, localStorage, items with cropped image(s), “Proceed to checkout” |
| **Checkout** | Placeholder page only – no form, no payment, no order creation |
| **Data** | Supabase client wired; `orders` table in schema; no Stitch Express yet; no image upload (R2/Supabase Storage) |
| **Admin / factory** | None |
| **Analytics** | None |

So: **consumer flow is complete up to “Proceed to checkout”.** The missing piece for an MVP front-end is a real checkout that collects details, takes payment, uploads the print image(s), and creates an order.

---

## Phase 1: MVP front-end (consumer-facing) – finish checkout

Goal: a customer can complete an order end-to-end (cart → checkout → payment → order created).

### 1.1 Checkout page (real UI)

- **Address form:** name, email, phone, line1, line2, city, province, postal code (ZAR-friendly).
- **Order summary:** cart items, subtotal, shipping (see below), total. Read from cart context.
- **Validation:** required fields, basic format (e.g. email), optional client-side checks.

### 1.2 Shipping (ZAR)

- **Option A (MVP):** Fixed shipping in ZAR (e.g. one rate or a few zones). Show “Shipping: R XXX” at checkout; add to total.
- **Option B:** Province-based zones (you already have `ShippingProvince` in `src/types/order.ts`). Simple table: province → shipping_cents; lookup by selected province.

### 1.3 Payment (Stitch Express, ZAR)

- Use **Stitch Express** ([API docs](https://express.stitch.money/api-docs)) for South African payments.
- **Checkout flow:** Server creates a payment (or payment request) in ZAR via Stitch API; client redirects customer to Stitch payment URL; after payment, Stitch redirects back to your success page and sends a **webhook** to your HTTPS endpoint. Webhook handler updates/creates the order (store Stitch payment/transaction id). Never expose API keys to the client.
- **Security:** All Stitch API calls and webhook handling on the server only; keys in env vars. Verify webhook signatures. See `docs/CHECKOUT_DEPLOY_AND_OPS.md` for data, tracking, and security.

### 1.4 Image upload before payment

- Cart currently holds **data URLs** (base64). For production you need a **stable URL** for the factory (e.g. R2 or Supabase Storage).
- **Flow:** On “Place order” (or when entering checkout):
  1. For each cart item, upload the print image (from `imageDataUrl` or `imageDataUrls`) to your storage (e.g. Supabase Storage bucket or Cloudflare R2 via API).
  2. Get back a permanent URL per image.
- **DB:** Your `orders` table has a single `image_url`. For multi-wall orders with different images per wall, either:
  - Add `image_urls text[]` (or JSON) to the schema and store one URL per wall, or
  - Keep one “primary” or composite reference in `image_url` and store the rest in JSON/metadata until you formalise the schema.

### 1.5 Order creation

- After successful payment and upload:
  - Generate `order_number` (e.g. `PW-YYYYMMDD-XXXX`).
  - Insert one row into `orders` with: customer, address, wall dimensions, `image_url` (or URLs), style, application, subtotal_cents, shipping_cents, total_cents, status `'new'`, Stitch payment/transaction id (e.g. `stitch_payment_id`), timestamps.
- Then: clear cart (or remove paid items), redirect to a **thank-you / order confirmation** page (e.g. `/checkout/success?order=PW-...`) showing order number and “we’ll email you”.

### 1.6 MVP “done” checklist (front-end)

- [ ] Checkout form (address + summary).
- [ ] Shipping calculation (fixed or by province).
- [ ] Stitch Express payment in ZAR; order created/updated from webhook after success.
- [ ] Upload print image(s) to storage; order stores URL(s).
- [ ] Success page and cart cleared after payment.

**See also:** `docs/CHECKOUT_DEPLOY_AND_OPS.md` – data/tracking/security, one domain + logins, when to deploy to Vercel, how to make edits after go-live.

---

## Phase 2: Back-end ops – factory dashboard and flow

Goal: ops/factory can see orders, update status, and use the same print assets you store at checkout.

### 2.1 Access control

- **MVP:** Simple password-protected route (e.g. `/admin` with middleware or a login form that sets a signed cookie or session). No full auth system required for v1.
- **Later:** Proper auth (e.g. Supabase Auth or NextAuth) and role-based access.

### 2.2 Dashboard (orders list)

- **Route:** e.g. `/admin` or `/admin/orders`.
- **List:** All orders (newest first); columns e.g. order_number, date, customer name, status, total (ZAR). Filter by status (`new`, `in_production`, `shipped`, `delivered`).
- **Data:** Read from Supabase `orders` table (already in schema).

### 2.3 Order detail and print specs

- **Route:** e.g. `/admin/orders/[id]`.
- **Show:** Full address, dimensions, style, application, image URL(s), Stitch payment id, timestamps.
- **Print specs:** Clear display of wall size(s), finish, and **link/button to open or download the print file** (the image URL from checkout). Factory uses this exact asset to print.

### 2.4 Status workflow

- **Actions:** Buttons or dropdown to set status: `new` → `in_production` → `shipped` → `delivered`.
- **Persistence:** Update `orders` in Supabase; optional `updated_at` (you already have a trigger in schema).
- **Optional:** Simple “notes” or “internal ref” field on the order for factory use (add column if needed).

### 2.5 Optional: email to factory

- On order creation (Phase 1), optionally send an email to the factory with order number and link to admin order detail. Can be a server action or API route calling SendGrid, Resend, or similar.

---

## Phase 3: Analytics and performance dashboard

Goal: understand business and product performance (not just “did the site load fast”).

### 3.1 What to measure

- **Business:** Orders per day/week/month, revenue (from `orders.total_cents`), average order value, conversion (e.g. config starts vs orders completed if you add tracking).
- **Product:** Orders by wallpaper style, by application method, by province; cart size distribution.
- **Performance (optional):** Core Web Vitals (LCP, FID, CLS) via Vercel Analytics or a small script sending to your backend.

### 3.2 Implementation options

- **Option A – Supabase + admin UI:** Use existing `orders` table. Add an **analytics view** in the admin app: e.g. `/admin/analytics` with date range, and compute aggregates in the client or via Supabase RPC/functions (e.g. “revenue in period”, “orders by status”, “orders by style”). No new infra; good for MVP.
- **Option B – Dedicated analytics DB or warehouse:** Export or stream orders to a warehouse (BigQuery, Snowflake, etc.) and use Metabase, Looker, or similar for dashboards. Overkill for MVP; consider once volume justifies it.
- **Option C – Third-party:** Send key events (e.g. “order_created”) to Mixpanel, Amplitude, or PostHog; build dashboards there. Complements Option A for funnels and behaviour.

### 3.3 Suggested MVP (Phase 3)

- **Single analytics page:** `/admin/analytics` (same protection as `/admin`).
- **Metrics:** Revenue (ZAR) and order count over a chosen period; simple table or chart (e.g. orders by day). Optionally: breakdown by style, by application, by province (from `orders`).
- **Data source:** Supabase `orders` only; no new pipelines for v1.

---

## Summary: what’s next

| Phase | Next step |
|-------|-----------|
| **1 – MVP front-end** | Implement checkout: form, shipping, Stitch Express (ZAR), image upload to storage, order creation, success page. |
| **2 – Factory ops** | Add `/admin` (password or auth), orders list, order detail with print URL(s), status updates. |
| **3 – Analytics** | Add `/admin/analytics` using `orders`: revenue, order count, optional breakdowns. |

Dependencies: Phase 2 and 3 assume Phase 1 is in place (orders exist in DB and have `image_url` and payment id). You can build the admin UI to read “test” orders before go-live if you seed the DB manually.
