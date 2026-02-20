# Order system & back-end ops – review for produce & ship

Review of what’s in place and what’s **critical or recommended** for the factory to produce and ship orders, plus notes on shipping providers and future integration.

---

## What’s solid today

| Area | Status |
|------|--------|
| **Order creation** | Checkout creates order rows with customer, address, print URLs, money; Stitch payment; webhook sets status to `new` and stores `stitch_payment_id`. |
| **Factory workflow** | Overview (counts by status/factory, overdue), orders list with filters, order detail with print specs, print file download, status progression (New → In production → Shipped → Delivered), notes, admin-only edits. |
| **Data** | One `orders` table; `shipped_at` / `delivered_at` set when status changes; address and customer on the order for packing/shipping. |
| **Single source of truth** | Orders and payment id in Supabase; success page shows order number(s). |

So: **creating paid orders and moving them through production in the dashboard is covered.** Gaps are mainly **customer communication**, **tracking**, and **security**.

---

## Critical gaps (factory can’t fully “produce and ship” without these)

### 1. **No confirmation email**

- **Current:** Success page says “We’ll send a confirmation email shortly” but no email is sent.
- **Why it matters:** Customer has no record except the browser; if they close the tab they only have memory. Support and disputes are harder.
- **Fix:** Add an email provider (e.g. Resend, SendGrid), then send one transactional email after the **webhook** confirms payment (so only paid orders get it). Include: order number(s), short summary, “we’ll notify you when it ships,” and support/contact. Optional: attach a simple PDF summary or link to “track your order” (see below).

### 2. **No tracking number (or carrier) when marking “Shipped”**

- **Current:** When admin sets status to **Shipped**, we only set `shipped_at`. There is no tracking number, carrier name, or link stored.
- **Why it matters:** Customer and support can’t track the parcel. You can’t send a “your order has shipped” email with a link.
- **Fix (minimal):** Add to `orders`:
  - `tracking_number` (text, nullable)
  - `carrier` (text, nullable) – e.g. “The Courier Guy”, “DHL”, “RAM”
  - Optional: `tracking_url` (text, nullable) – link to carrier’s tracking page
  - In admin order detail: when status is Shipped (or when changing to Shipped), show fields to enter tracking number and carrier (and optionally URL). Save with the status update.
  - Later: when you integrate a 3rd-party API, you can auto-fill these from the API response.

### 3. **No “shipped” / “delivered” email to customer**

- **Current:** No email when order is marked Shipped or Delivered.
- **Why it matters:** Customers expect “your order has shipped” with tracking; optional “your order was delivered” improves experience and reduces “where’s my order?” tickets.
- **Fix:** Once (1) and (2) are in place: when status is set to **Shipped**, send an email with tracking number and link (if present). Optionally send a short “Delivered” email when status is set to **Delivered**.

### 4. **No customer-facing “track your order”**

- **Current:** Customer only sees order number on the success page. There is no page where they can enter order number + email to see status (and tracking if present).
- **Why it matters:** Success page says “Keep this number for tracking” but there’s nowhere to use it. Customers lose the number or want to check status later.
- **Fix:** Add a page (e.g. `/track` or `/order-status`) with a form: order number + email. Look up order by `order_number` and check that `customer_email` matches (case-insensitive). If match: show status, `shipped_at` / `delivered_at`, and if present `tracking_number` / `tracking_url`. No login required; order number + email is the “secret”. Don’t expose internal data (e.g. internal id, factory, notes).

---

## Important but not blocking day one

### 5. **Webhook signature verification (Stitch)**

- **Current:** The Stitch webhook handler does **not** verify the webhook signature. The comment says to verify; the code doesn’t.
- **Risk:** Anyone who can POST to your webhook URL could send a fake “payment completed” and move orders to `new` without real payment.
- **Fix:** Use Stitch’s/Svix’s docs to verify the signature (using the webhook secret from Stitch) before updating orders. Reject requests with invalid or missing signature.

### 6. **Order lookup by customer – rate limiting & abuse**

- When you add “track your order”, add simple rate limiting (e.g. by IP or by order_number+email) so the endpoint can’t be used for brute-force enumeration of order numbers. Optional: require a captcha or similar for public form.

---

## What’s optional / later

- **3rd-party shipping API (carrier integration)**  
  - You’re not sure of the carrier yet; that’s fine. When you choose one (e.g. The Courier Guy, DHL, RAM, etc.):
    - You can integrate their API to: create shipment, get label, get tracking number/URL.
    - Your app would: call their API when admin marks “Shipped” (or from a “Create shipment” button), store `tracking_number` / `carrier` / `tracking_url` on the order, then send the “shipped” email with that link.
  - Adding `tracking_number`, `carrier`, and `tracking_url` to the schema **now** (see above) keeps you ready; the rest can wait until you have a carrier and API keys.

- **Inventory / materials**  
  - You mentioned future inventory; that’s a separate feature (stock, reorder points, etc.). Not required for “produce and ship” with current flow.

- **Revenue / analytics**  
  - Not required for production; you already have order data to add dashboards later.

---

## Summary: is everything vital there?

- **For production and shipping to function:**  
  - **Vital:** (1) Confirmation email after payment, (2) Store tracking (and optionally carrier/URL) when marking Shipped, (3) “Shipped” email with tracking, (4) Customer “track your order” page.  
  - **Strongly recommended:** (5) Webhook signature verification.

- **3rd-party shipping:**  
  - You can add a carrier later and integrate their API (create shipment, get tracking, optionally labels). The schema should reserve a place for tracking/carrier/URL so that integration is a matter of calling their API and saving the result into existing columns.

- **Back-end ops today:**  
  - Order creation, payment confirmation, factory workflow, and address/specs for packing are in place. The main missing pieces are **customer communication** (emails, track page) and **storing and showing tracking**. Once those are in place, the factory can produce and ship and customers can be informed and track.

---

## Suggested order of work

1. **Schema:** Add `tracking_number`, `carrier`, `tracking_url` to `orders` (migration).
2. **Admin:** When setting status to Shipped, allow (optional) tracking number + carrier + URL; save with the status update.
3. **Email:** Add provider (e.g. Resend), send confirmation email from webhook after payment; send “shipped” email when status set to Shipped (include tracking link if present).
4. **Track page:** Public “track your order” (order number + email → status + tracking).
5. **Security:** Verify Stitch webhook signature before updating orders.

After that, when you have a carrier and API: add “Create shipment” (or similar) that calls their API and fills `tracking_*` and optionally triggers the “shipped” email.
