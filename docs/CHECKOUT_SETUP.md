# Checkout setup

To go live with the full checkout flow (Stitch Express + Supabase):

## 1. Database

- **New project:** Run `supabase/schema.sql` in Supabase SQL Editor (creates `orders` with `pending`, `image_urls`, `walls_spec`).
- **Existing project:** Run `supabase/migrations/20260216_checkout.sql` to add `pending` status and `image_urls`, `walls_spec` columns.

## 2. Storage bucket (print images)

Create a bucket named **print-files** and allow uploads from the app:

- **Option A:** In Supabase Dashboard → Storage → New bucket → name: `print-files`, set **Public**.
- **Option B:** Run `supabase/storage-bucket.sql` in the SQL Editor (creates bucket and policies).

Without this bucket, the create-order API will fail when uploading images.

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` – required for orders and storage.
- `NEXT_PUBLIC_APP_URL` – your site URL (e.g. `https://paperwalls.co.za`). Used for payment redirect and success URL.
- `STITCH_API_URL`, `STITCH_API_KEY` – from Stitch Express. If omitted, checkout skips payment and redirects to the success page (for local testing).

## 4. Stitch Express

- In the Stitch dashboard, set the **webhook URL** to:  
  `https://your-domain.com/api/webhooks/stitch`
- Ensure the webhook payload includes payment status and metadata (e.g. `order_numbers`). Adjust `src/app/api/webhooks/stitch/route.ts` if your webhook shape differs.
- The create-payment request in `src/lib/stitch.ts` may need to match Stitch’s exact API (amount format, field names). Update that file using [Stitch Express API docs](https://express.stitch.money/api-docs).

## 5. Flow summary

1. Customer fills checkout form → POST `/api/checkout/create` with address + cart (including image data URLs).
2. Server uploads each print image to Supabase Storage, creates one order per cart item (status `pending`), then creates a Stitch payment and returns a redirect URL.
3. Customer is sent to Stitch to pay; after payment, Stitch redirects to `/checkout/success?orders=PW-xxx,PW-yyy` and calls your webhook.
4. Webhook handler updates those orders to status `new` and stores the Stitch payment id.
5. Success page shows order numbers and clears the cart.
