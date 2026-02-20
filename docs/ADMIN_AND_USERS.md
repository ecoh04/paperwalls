# Factory admin and user setup

The factory dashboard at `/admin` uses **Supabase Auth** for login. Each user has a **profile** (factory, role) so orders can be filtered by factory (JHB, CPT, KZN) and admins see everything.

---

## 1. Run the migration

Before using the new admin, run the factory-ops migration in Supabase:

1. Open **Supabase Dashboard** → **SQL Editor** → **New query**.
2. Paste and run the contents of **`supabase/migrations/20260221_factory_ops.sql`**.

This creates:

- **factories** (JHB, CPT, KZN)
- **profiles** (per auth user: role, factory_id)
- **order_activity** (log of status changes, assignments, notes)
- New columns on **orders**: `assigned_factory_id`, `shipped_at`, `delivered_at`
- RLS so factory staff only see their factory’s orders (and unassigned); admins see all

---

## 2. Create the first user (admin)

1. In **Supabase Dashboard** → **Authentication** → **Users** → **Add user**.
2. Choose **Create new user**.
3. Enter **Email** and **Password** (and optionally **Name**). Click **Create user**.
4. The trigger will create a row in **profiles** with `role = 'factory_staff'`. To make this user an admin:
   - Go to **Table Editor** → **profiles**.
   - Find the row where **id** = the new user’s UUID (same as in Auth → Users).
   - Set **role** to `admin`. Leave **factory_id** empty.

That user can now sign in at `https://your-site.com/admin/login` and see all orders.

---

## 3. Create factory staff users

1. **Authentication** → **Users** → **Add user**.
2. Enter email and password. Create the user.
3. In **Table Editor** → **profiles**, find the new user’s row (same **id** as in Auth).
4. Set **factory_id** to the UUID of the factory they belong to:
   - **Table Editor** → **factories** to copy **id** for Johannesburg, Cape Town, or KwaZulu-Natal.
5. Leave **role** as `factory_staff`.

That user will only see:

- Orders assigned to their factory
- Unassigned orders (so they can pick them up)

---

## 4. How assignment works

- **At checkout:** New orders are auto-assigned to a factory by delivery province (e.g. Western Cape → Cape Town). You can change this in the migration’s `PROVINCE_TO_FACTORY` logic and in `src/app/api/checkout/create/route.ts` (`PROVINCE_TO_FACTORY_CODE`).
- **In admin:** Admins can change **Factory** on any order (order detail page). Factory staff can only view and update status/notes; they cannot change assignment.
- **Filters:** On **Orders**, admins can filter by **All**, **Unassigned**, **Johannesburg**, **Cape Town**, **KwaZulu-Natal**. Factory staff see only their factory + unassigned (no factory filter pills).

---

## 5. Activity log

Every **status change**, **factory assignment**, and **note** is stored in **order_activity** with:

- Who (user)
- What (action, old/new value)
- When (created_at)

Order detail shows this as a timeline. Stored values are human-readable (e.g. factory names, status labels).

---

## 6. Env vars (no more admin password)

- **ADMIN_PASSWORD** and **ADMIN_SECRET** are no longer used. You can remove them from Vercel and `.env.local`.
- Auth is handled entirely by **Supabase** (same URL and anon key you already use). No extra env vars are required for the factory dashboard.

---

## 7. Optional: invite by email

Supabase can send magic-link or email+password invites:

- **Authentication** → **Users** → **Invite user** (if enabled in your project).

After they set a password or use the link, they appear in **profiles** with `role = 'factory_staff'`. Then set **factory_id** in **profiles** as in step 3 above.
