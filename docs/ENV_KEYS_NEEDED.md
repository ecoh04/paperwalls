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

**Where:** Stitch dashboard → **API Details** (the section with Client ID and Client Secret).

| Env variable | What to paste | Where to get it |
|--------------|----------------|------------------|
| `STITCH_API_BASE_URL` | Stitch API base URL **with no trailing slash**. | Use **`https://express.stitch.money`** (same origin as the API docs). |
| `STITCH_CLIENT_ID` | Your **Client ID**. | Copy from Stitch → API Details (e.g. `test-e1a603b6-0115-4538-a347-c03f101c0e46`). |
| `STITCH_CLIENT_SECRET` | Your **Client Secret**. | In API Details click **View Client Secret**, then copy the value. |

**In Stitch you also need to:**

- **Redirect URLs:** Add your success URL, e.g. `https://paperwalls.vercel.app/checkout/success` (and optionally cancel: `https://paperwalls.vercel.app/checkout`).
- **Webhooks:** Click **Configure webhooks** and set the webhook URL to `https://paperwalls.vercel.app/api/webhooks/stitch`.

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

# Stitch Express (from Stitch → API Details). Base URL = https://express.stitch.money
STITCH_API_BASE_URL=https://express.stitch.money
STITCH_CLIENT_ID=
STITCH_CLIENT_SECRET=

# Your site URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Example filled in (fake values):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NTU1NTU1fQ.xxx
STITCH_API_BASE_URL=https://express.stitch.money
STITCH_CLIENT_ID=test-xxxx
STITCH_CLIENT_SECRET=your-secret-from-view-button
NEXT_PUBLIC_APP_URL=https://paperwalls.vercel.app
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
3. In Stitch: add **Redirect URL** `https://paperwalls.vercel.app/checkout/success`, and set **webhook** to `https://paperwalls.vercel.app/api/webhooks/stitch`.
