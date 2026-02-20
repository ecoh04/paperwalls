# Supabase full setup – one-time guide

This doc ties the **project and roadmap** to **Supabase**: what lives where, how data is linked (right image → right customer), and exactly what to run so everything is set up properly.

---

## How it’s planned: data and links

- **No separate “users” table for MVP.** Customers don’t sign up; they checkout as guests. Each **order** row is self-contained: one customer, one delivery address, and that order’s print image(s).
- **Right image → right user:**  
  - Checkout creates **one order row per cart item**.  
  - Each row has: `customer_*`, `address_*`, `image_url`, `image_urls`, `order_number`, etc.  
  - So the print file(s) for an order are stored on the **same row** as the customer and address. The factory uses that row: customer, address, and image URL(s) always match.
- **Storage:** Print images are uploaded to the **`print-files`** bucket. The app stores the **public URL** of each file in `orders.image_url` (and `orders.image_urls` for multi-wall). So “which file?” is answered by the order row; no extra linking table.

So: **everything needed is already in the app logic.** Supabase only needs the right **schema** (orders table + storage bucket + policies). No extra “connectors” or tables for “image to user” — the order row is the link.

---

## What Supabase must have

| Piece | Purpose |
|-------|--------|
| **`orders` table** | One row per order: customer, address, dimensions, `image_url` / `image_urls`, style, application, money, status, Stitch payment id. |
| **RLS on `orders`** | Allow anon to **insert** (checkout), **select** (admin/list), **update** (webhook + admin status). |
| **`print-files` bucket** | Holds the uploaded print images. |
| **Storage policies** | Anon can **insert** into `print-files`; **public** can **select** (read) so image URLs work. |

That’s it for the current app and roadmap (Phase 1 + future admin/analytics reading from the same table).

---

## One-time setup: run the full SQL

1. Go to **[supabase.com](https://supabase.com)** → your project.
2. Open **SQL Editor** → **New query**.
3. Open the file **`supabase/full-setup.sql`** in your project (it’s in the repo). Copy its **entire** contents and paste into the SQL Editor.
4. Click **Run** (or Cmd+Enter).

That single script:

- Creates the **`orders`** table with all columns (or adds missing `image_urls` / `walls_spec` if the table already exists).
- Ensures the **status** check includes `pending`.
- Creates indexes and the **updated_at** trigger.
- Enables **RLS** on `orders` and creates the three policies (insert, select, update for anon).
- Creates the **`print-files`** bucket (or updates it to public).
- Creates the two **storage** policies (anon insert, public select) for `print-files`.

After it runs successfully, Supabase is fully set up for:

- Checkout (insert orders, upload images to `print-files`, store URLs in the same order row).
- Stitch webhook (update order status by `order_number`).
- Future admin (read/update orders; images are already linked by row).

---

## Verify

- **Table:** In Supabase, **Table Editor** → you should see **`orders`** with columns like `order_number`, `customer_email`, `image_url`, `image_urls`, `status`, etc.
- **Storage:** **Storage** → you should see bucket **`print-files`** (public). Uploads from checkout will appear here; each file is referenced by URL in `orders.image_url` / `orders.image_urls`.
- **Checkout:** Run through a test checkout. You should get no “Bucket not found” and no “row-level security” errors; an order row should appear with the correct image URL(s) for that order.

---

## Summary

- **Planned and implemented:** One order row = one customer + one address + that order’s print image(s). No extra “image → user” table.
- **What you do:** Run **`supabase/full-setup.sql`** once in the SQL Editor. After that, Supabase is fully set up for the current app and roadmap; you only need to keep env vars (and optional future migrations) in sync.
