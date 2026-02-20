# Phase 1: Project Setup — What We Built

This document explains **what** we built and **why**, and what **you** need to do next.

---

## What We Built (In Simple Terms)

We created the **foundation** of your PaperWalls site:

1. **Next.js app** — The framework that runs your website (pages, forms, and later the configurator and checkout).
2. **TypeScript** — So the code is typed and fewer bugs slip in.
3. **Tailwind CSS** — So we can style the site quickly and keep it responsive.
4. **Folder structure** — A clear place for pages, components, database client, and types.
5. **Database schema** — The exact table structure for orders in Supabase (you’ll run this in Supabase).
6. **Supabase connection** — Code that talks to your database; it only activates once you add your Supabase keys.

---

## Files Created and What They Do

| File or folder | What it does |
|----------------|--------------|
| `package.json` | Lists all dependencies (Next.js, React, Supabase, etc.) and scripts like `npm run dev`. |
| `tsconfig.json` | TypeScript settings and path alias `@/*` so we can import from `@/components`, etc. |
| `next.config.mjs` | Next.js configuration (we’ll add more here later if needed). |
| `tailwind.config.ts` | Tailwind theme and which files to scan for CSS classes. |
| `postcss.config.mjs` | Tells the build to use Tailwind and Autoprefixer. |
| `src/app/layout.tsx` | Root layout: wraps every page (title, font, etc.). |
| `src/app/page.tsx` | Homepage: right now just a “PaperWalls” placeholder. |
| `src/app/globals.css` | Global styles and Tailwind imports. |
| `src/lib/supabase.ts` | Supabase client: used to save and load orders. Safe if env vars are missing. |
| `src/types/order.ts` | TypeScript types for Order, status, wallpaper style, application method. |
| `src/components/` | Empty for now; we’ll put configurator and UI components here in Phase 2. |
| `supabase/schema.sql` | SQL to create the `orders` table and indexes in Supabase. |
| `.env.local.example` | Template for your secret keys; you copy it to `.env.local` and fill in real values. |
| `.gitignore` | Tells Git to ignore `node_modules`, `.env.local`, and build outputs. |

---

## What You Need to Do (Step by Step)

### Step 1: Install dependencies (if not already done)

In a terminal, open your project folder and run:

```bash
cd "/Users/elad/PaperWalls (V1)"
npm install
```

Wait until it finishes (you may see some deprecation warnings; that’s normal).

---

### Step 2: Create a Supabase account and project

1. Go to **[supabase.com](https://supabase.com)** and sign up (or log in).
2. Click **“New project”**.
3. Choose an organization (or create one).
4. Set:
   - **Name:** e.g. `paperwalls`
   - **Database password:** choose a strong password and **save it somewhere safe**.
   - **Region:** pick one close to South Africa if available (e.g. Frankfurt or similar).
5. Click **“Create new project”** and wait until the project is ready.

---

### Step 3: Run the database schema in Supabase

1. In the Supabase dashboard, open your project.
2. In the left sidebar, click **“SQL Editor”**.
3. Click **“New query”**.
4. Open the file **`supabase/schema.sql`** in your project (in Cursor or any editor).
5. Copy **all** of its contents and paste into the Supabase SQL Editor.
6. Click **“Run”** (or press Cmd+Enter).
7. You should see a success message and the `orders` table will appear under **Table Editor**.

---

### Step 4: Get your Supabase URL and key

1. In Supabase, go to **Settings** (gear icon in the sidebar) → **API**.
2. You’ll see:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** key (long string).
3. Keep this page open; you’ll paste these into your app in the next step.

---

### Step 5: Add your keys to the project

1. In your project folder, find the file **`.env.local.example`**.
2. **Copy** that file and name the copy **`.env.local`** (same folder as `package.json`).
3. Open **`.env.local`** and replace the placeholders with your real values:
   - `NEXT_PUBLIC_SUPABASE_URL` = your **Project URL** from Step 4.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your **anon public** key from Step 4.
4. Save the file.  
   **Important:** Never commit `.env.local` to Git (it’s already in `.gitignore`).

---

### Step 6: Run the app and test

In the terminal:

```bash
cd "/Users/elad/PaperWalls (V1)"
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser. You should see the PaperWalls placeholder page. If you do, Phase 1 is complete.

---

## How to Test That the Database Is Connected

We haven’t built any UI that reads/writes orders yet. After Phase 2 and 3 we’ll add “Add to Cart” and checkout, which will insert into `orders`. For now, a successful **Run** of `schema.sql` in Supabase and a working **Table Editor** view of the `orders` table is enough to confirm the database is ready.

---

## Next: Phase 2

Once the steps above work and you see the homepage at `localhost:3000`, we’ll move to **Phase 2: Build the Configurator** (dimensions, image upload, preview, style, application method, and live pricing).

If anything in these steps fails (e.g. “module not found”, Supabase errors, or the page doesn’t load), tell me exactly what you see and we’ll fix it step by step.
