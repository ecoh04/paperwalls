# Testing environment – test like a pro

Ways to test the order flow and changes without affecting production.

---

## 1. Vercel Preview (recommended)

Every **branch** you push to GitHub gets its own URL on Vercel.

- **Production:** `main` branch → `https://paperwalls.vercel.app`
- **Preview:** Any other branch (e.g. `staging` or `test`) → `https://paperwalls-xxxx-staging.ecoh04.vercel.app` (Vercel shows the exact URL after deploy)

**How to use it:**

1. Create a branch for testing: `git checkout -b staging` (or `test`).
2. Make changes on that branch, commit, and push: `git push -u origin staging`.
3. Vercel will build and give you a **Preview** URL. Use that URL to test.
4. When you’re happy, merge into `main` (e.g. via a Pull Request). Production updates only when you merge.

**Env vars:** Preview deployments use the same env vars as Production unless you add **Preview**-only vars in Vercel (Settings → Environment Variables → choose “Preview” when adding). So you can test with the same Supabase/Stitch, or add a second Supabase project and set Preview-only vars for a fully separate test DB.

---

## 2. Local testing

Run the app on your machine with `npm run dev`. Use `.env.local` with:

- **Same Supabase** as production (real orders go to the same DB), or
- **A separate Supabase project** (e.g. “PaperWalls Staging”) and put its URL and anon key in `.env.local` so test orders don’t mix with real ones.

Stitch: if you leave `STITCH_API_URL` / `STITCH_CLIENT_SECRET` empty in `.env.local`, checkout will skip payment and send you straight to the success page so you can test the rest of the flow.

---

## 3. Staging Supabase (optional)

For a clean test database:

1. Create a second project in Supabase (e.g. “PaperWalls Staging”).
2. Run the same SQL there: `supabase/schema.sql` and `supabase/migrations/20260216_checkout.sql`, plus the storage bucket from `supabase/storage-bucket.sql`.
3. In Vercel, add **Preview**-only env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the staging project. Leave Production vars pointing at the real project.

Then: production uses the real DB, preview/staging uses the test DB.

---

## Quick checklist for testing the order flow

- [ ] Add item in configurator → cart → checkout.
- [ ] Fill address, see shipping and total update when province changes.
- [ ] Submit: either redirect to Stitch (if configured) or straight to success page.
- [ ] Success page shows order number(s) and cart is empty.
- [ ] In Supabase (Table Editor → `orders`): new row(s) with status `pending` or `new`.
- [ ] If Stitch webhook is set: after paying (or simulating), order status in DB should change to `new`.

Use **Preview** for “test like a pro” without touching production until you merge.
