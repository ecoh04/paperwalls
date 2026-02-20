# Fix Supabase: Stripe → Stitch (one-time)

The project now uses **Stitch Express** only. The database column is **`stitch_payment_id`** (no more `stripe_payment_id`).

---

## You already ran old SQL in Supabase

Your `orders` table probably has a column named **`stripe_payment_id`**. You do **not** need to delete the table or drop data.

**Do this once:**

1. Go to **Supabase** → your project → **SQL Editor** → **New query**.
2. Copy the full contents of **`supabase/migrate-stripe-to-stitch.sql`** and paste into the editor.
3. Click **Run**.

That script **renames** `stripe_payment_id` → `stitch_payment_id` (no data loss). If the column was already renamed or doesn’t exist, the script skips or adds the new column.

---

## Nothing to “delete” in Supabase

- Do **not** delete the `orders` table.
- Do **not** delete the `print-files` bucket.
- Only run the migration above so the column name matches the app (`stitch_payment_id`).

---

## New / fresh Supabase projects

For a **new** project where you haven’t run any SQL yet: run **`supabase/full-setup.sql`** only. It already uses `stitch_payment_id` and creates everything (orders table, RLS, storage bucket and policies).

---

## After Supabase is updated

Commit and push the code changes (see “What to commit to Git” in the main message) so the app and database stay in sync.
