# API keys and env – exactly what you need

The app only uses **two external services** plus your site URL. No other APIs (no email, no R2, no analytics) are required for checkout to work.

---

## 1. Supabase (database + image storage)

**Where:** Supabase Dashboard → your project → **Settings** → **API**.

| Env variable | What to paste | Example |
|--------------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (no trailing slash) | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** key (long string under "Project API keys") | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

Use the **anon public** key only (not the service_role key) for the app.

---

## 2. Stitch Express (payments)

**Where:** Stitch Express dashboard / developer or API section.  
If you don’t have these yet, use their docs or support to get:

- The **base URL** for the API (e.g. `https://api.express.stitch.money` or whatever they give you).
- An **API key** or **secret key** for creating payments (server-side only).

| Env variable | What to paste | Example |
|--------------|----------------|---------|
| `STITCH_API_URL` | Full URL of the endpoint that **creates a payment** (e.g. “Create payment” or “Payment request”). Include path, no trailing slash. | `https://api.express.stitch.money/v1/payments` (replace with Stitch’s real URL) |
| `STITCH_API_KEY` | Your Stitch **API key** or **secret** (the one used in the `Authorization` header). | `sk_live_...` or whatever format Stitch uses |

If you’re not sure of the exact URL or key name, send me:

- The **exact API base URL** (e.g. `https://...`).
- The **exact endpoint path** for “create payment” (e.g. `/v1/payment-requests`).
- The **key value** and how they say to send it (e.g. “Bearer token” or “X-API-Key: …”).

I can then tell you the exact `STITCH_API_URL` and `STITCH_API_KEY` values to put in `.env.local` and adjust the code if their request/response format differs.

---

## 3. Your site URL (redirects)

| Env variable | What to paste | Example (local) | Example (live) |
|--------------|----------------|------------------|----------------|
| `NEXT_PUBLIC_APP_URL` | The URL where your app is reachable (no trailing slash). | `http://localhost:3000` | `https://paperwalls.co.za` |

Used for: “Proceed to payment” redirect and “Back to your site” / success URL after payment.

---

## Paste this into `.env.local`

Create or edit `.env.local` in the project root and paste the block below. Replace only the **right-hand side** of each line with your real values (no quotes unless the value itself contains spaces).

```env
# Supabase (from Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Stitch Express (from Stitch dashboard / API docs)
STITCH_API_URL=
STITCH_API_KEY=

# Your site URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Example filled in (fake values):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NTU1NTU1fQ.xxx
STITCH_API_URL=https://api.express.stitch.money/v1/payments
STITCH_API_KEY=sk_live_abc123
NEXT_PUBLIC_APP_URL=https://paperwalls.co.za
```

---

## What you don’t need (for current checkout)

- No email API (SendGrid, Resend, etc.) – not used yet.
- No Cloudflare R2 or other object storage – we use Supabase Storage.
- No analytics or tracking keys – not used in the code.
- No Supabase **service_role** key for the main app – only anon is used for orders and storage.

---

## After you paste the keys

1. Restart the dev server: `npm run dev`.
2. Ensure the Supabase **print-files** bucket exists (see `docs/CHECKOUT_SETUP.md`).
3. In Stitch, set the **webhook URL** to:  
   `https://YOUR_DOMAIN/api/webhooks/stitch`  
   (use your real `NEXT_PUBLIC_APP_URL` + `/api/webhooks/stitch`).

If you send me the exact Stitch “create payment” URL and how they want the key (e.g. header name and value format), I can confirm the exact `STITCH_API_URL` and `STITCH_API_KEY` format and adjust the code if needed.
