# Checkout, data, deploy & ops – your questions answered

This doc covers: (1) data/tracking/security, (2) one domain + logins, (3) when to go live on Vercel, (4) how edits work after deploy. Payment stack: **Stitch Express** (South Africa).

---

## 1. Data, tracking & security – set up like a pro

### Data storage and format

- **Single source of truth:** All order and customer data lives in **Supabase** (`orders` table). Same schema for checkout, admin, and analytics. No duplicate “order” stores.
- **Structured and consistent:**
  - **Orders:** One row per order; all monetary values in **ZAR cents** (no floats); dates in **ISO/UTC** (`timestamptz` in Postgres).
  - **Customer/address:** Normalised fields (name, email, phone, address_line1, address_line2, city, province, postal_code). Use the same enums (e.g. `ShippingProvince`) everywhere.
  - **Ids:** `order_number` human-readable (e.g. `PW-20260216-0001`); `id` UUID for internal/API use; store **Stitch payment/transaction id** on the order for reconciliation.
- **Print assets:** Store **permanent URLs** (Supabase Storage or R2) in `orders.image_url` (and if multi-wall, `image_urls` or JSON). Never rely only on client-held data URLs for production.

### Tracking (analytics and events)

- **Server-side (recommended for “truth”):** When an order is created or status changes, you already have that in the DB. Use the same DB for analytics (e.g. `/admin/analytics` reading from `orders`). Optionally emit a **server-side event** (e.g. to PostHog, Mixpanel, or a small internal log) on order creation so you have a clean event stream without relying on the client.
- **Client-side (optional):** If you add marketing/UX analytics (e.g. “reached checkout”, “payment started”), use a single place (e.g. one script or one provider), respect consent (e.g. cookie banner), and keep event names and payloads consistent (e.g. `order_created` with `order_number`, `total_cents`).
- **Payment:** Rely on **Stitch webhooks** for payment confirmation, not only on the client redirect. Store the Stitch payment/transaction id on the order (e.g. in the existing `stripe_payment_id` column or a new `stitch_payment_id` column) so you have a clear audit trail.

### Security

- **Secrets:** All payment and API keys (Stitch, Supabase service role if used, storage keys) in **environment variables** (e.g. Vercel env vars). Never in the repo or client bundle.
- **Server-only:** Create Stitch payment requests and handle webhooks in **API routes or server actions** only. The client only gets a payment URL or session id to redirect to; it never sees secret keys.
- **HTTPS:** Vercel gives you HTTPS by default. Stitch webhooks require HTTPS.
- **Admin:** Protect `/admin` (and `/admin/analytics`) with login; use a strong password or proper auth (e.g. Supabase Auth). RLS on `orders` can restrict who can read/update (e.g. service role or a dedicated “admin” role).

Implementing checkout will follow these rules: env-based secrets, server-side Stitch calls, webhook handler that updates the order, and a single orders schema used everywhere.

---

## 2. One domain with logins – recommended approach

**Yes: build front-end, back-end (ops), and analytics under one domain and one codebase.**

- **One Next.js app:**  
  - **Public:** `/`, `/shop`, `/config`, `/cart`, `/checkout`, `/checkout/success`, content pages.  
  - **Protected:** `/admin` (login), `/admin/orders`, `/admin/orders/[id]`, `/admin/analytics`.

- **One domain (e.g. `paperwalls.co.za`):**  
  - Same origin for cookies/sessions, simpler CORS, one SSL cert, one place to configure security headers.

- **Logins:**  
  - **Admin only:** One login for ops (factory) and analytics. No customer accounts required for MVP (checkout is guest checkout).  
  - **Flow:** User goes to `/admin` → login (password or Supabase Auth) → session/cookie → can access all admin routes.  
  - **Later:** If you add “my orders” or customer accounts, you can add a separate auth scope (e.g. customer vs admin) still on the same domain.

- **Benefits:**  
  - Single deploy, single repo, one set of env vars.  
  - Easy to link from “Order confirmed” page to “Track your order” (e.g. by order number + email) without needing a separate admin domain.

So: **one domain, one app, one login for admin/analytics** is the process we’ll follow.

---

## 3. When to upload to Vercel and go live

**You can deploy to Vercel at any time.** “Live” just means your site is reachable at your Vercel URL (or custom domain).

- **Now:** You can deploy the current app (with placeholder checkout) to get the URL, connect the domain, and start wiring Stitch/Supabase against **production-like** env (e.g. Stitch test/sandbox, Supabase project). That way you’re not testing only on localhost.

- **Recommended for testing the full order flow:**  
  - Deploy when **checkout is implemented** (form, shipping, **Stitch Express** create-payment → redirect, **webhook** to confirm payment and create/update order, success page).  
  - Stitch webhooks need a **public HTTPS URL** (e.g. `https://yoursite.com/api/webhooks/stitch`). So going live on Vercel (even to a staging URL) is the point at which you can fully integrate and test the real order flow.

- **Practical sequence:**  
  1. Complete checkout in the repo (Stitch Express, Supabase, image upload, order creation, webhook).  
  2. Add Vercel project, connect repo, set env vars (Stitch, Supabase, storage).  
  3. Deploy.  
  4. In Stitch dashboard, set webhook URL to `https://your-vercel-url/api/webhooks/stitch`.  
  5. Run test orders end-to-end (pay with Stitch test methods).  
  6. Point your domain to Vercel when ready.

So: **the point at which you can start integrating and testing the site’s order flow is as soon as the app is deployed to Vercel with checkout + webhook route in place.** You don’t need to wait for factory dashboard or analytics.

---

## 4. Making small edits after uploading to Vercel

**You do not re-upload the site manually. Edits are done in code, then Vercel redeploys from your repo.**

- **How it works:**  
  - Vercel is connected to your **Git repo** (GitHub/GitLab/Bitbucket).  
  - You edit in **Cursor** (or any editor), commit, and **push** to the repo.  
  - Vercel runs a **new build** and deploys. In seconds to a couple of minutes the live site is updated.

- **Small edits:**  
  - Change copy, styles, or logic in the repo → commit → push → Vercel deploys.  
  - You can keep using **prompt logic in Cursor** exactly as now; the flow is “edit → commit → push” instead of “re-upload”.

- **Env vars / config:**  
  - For things like API keys or feature flags, change them in **Vercel Project → Settings → Environment Variables**. Redeploy (or push a small commit) so the new values are picked up. No need to re-upload code for env-only changes.

- **No “re-upload the site” step:**  
  - There’s no manual FTP or “upload build folder”. One push = one new deployment. You can use **Preview deployments** for branches so you can test changes before merging to main (and thus before they go to production).

So: **making small edits is easy: edit in Cursor, commit, push; Vercel handles the rest. You can keep using prompts and your normal workflow.**

---

## Stitch Express – integration outline

- **Docs:** [Stitch Express API](https://express.stitch.money/api-docs) and [Stitch Express + the API](https://help-express.stitch.money/en/articles/10506312-stitch-express-the-api).
- **Flow for our checkout:**  
  1. **Server:** Create a payment (or payment request) via Stitch API in ZAR; get a payment URL (and optionally payment/transaction id).  
  2. **Client:** Redirect the customer to that URL to pay (Stitch hosts the payment UI).  
  3. **Webhook:** Stitch sends payment outcome to your HTTPS endpoint (they use Svix). Your handler verifies the signature, then creates/updates the order in Supabase (status, `stripe_payment_id` → we’ll name it `stitch_payment_id` or similar in schema).  
  4. **Redirect:** After payment, Stitch redirects the user back to your success URL (e.g. `/checkout/success?order=PW-...`). Optionally show “We’ve received your payment” and order number; the webhook is the source of truth for “paid”.

- **Security:** Store Stitch API keys in env; only server-side. Verify webhook signatures before updating orders.

When we implement checkout, we’ll use this flow and keep all data and tracking as in section 1.
