# Get your edits to Git and Vercel (step-by-step)

Use this when you (or the assistant) have changed code and you want those changes live on Vercel.

---

## Part 1: Put the latest code on GitHub

You’re in your project folder. We’ll save the changes (commit) and send them to GitHub (push).

### Step 1 – Open Terminal

- **Mac:** Open the **Terminal** app (or use the terminal inside Cursor).

### Step 2 – Go to your project folder

Paste this and press Enter:

```bash
cd "/Users/elad/PaperWalls (V1)"
```

### Step 3 – See what changed

Paste this and press Enter:

```bash
git status
```

You should see a list of modified files (e.g. `src/lib/stitch.ts`, `docs/...`). That’s the code that was edited.

### Step 4 – Stage all changes

Paste this and press Enter:

```bash
git add .
```

(That’s a dot at the end. This means “include all changed files.”)

### Step 5 – Commit (save) the changes

Paste this and press Enter:

```bash
git commit -m "Stitch payment-links integration and docs"
```

If it says “nothing to commit,” there were no file changes; you can skip to Part 2.

### Step 6 – Push to GitHub

Paste this and press Enter:

```bash
git push origin main
```

When that finishes without errors, the latest code (including the assistant’s edits) is on GitHub.

---

## Part 2: Vercel picks up the new code

Vercel is connected to your GitHub repo. When you push to `main`, Vercel usually **builds and deploys automatically**.

1. Go to [vercel.com](https://vercel.com) and open your **paperwalls** project.
2. Open the **Deployments** tab.
3. You should see a new deployment “Building” or “Queued” a short time after you ran `git push`. Wait until it shows **Ready**.
4. Click the deployment and open the **Visit** link. That’s your live site with the new code.

If no new deployment appears, click **Redeploy** on the latest one (three dots → Redeploy).

---

## Part 3: Env vars in Vercel (do this once, then after any change)

Your app needs these in Vercel so checkout and Stitch work.

1. In Vercel, open your **paperwalls** project.
2. Go to **Settings** → **Environment Variables**.
3. Make sure you have **exactly** these names and your real values (no quotes in the value box):

   | Name | Value (your real values) |
   |------|---------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NEXT_PUBLIC_APP_URL` | `https://paperwalls.vercel.app` (no trailing slash) |
   | `STITCH_API_BASE_URL` | `https://express.stitch.money` |
   | `STITCH_CLIENT_ID` | Your Stitch Client ID (e.g. `test-e1a603b6-...`) |
   | `STITCH_CLIENT_SECRET` | Your Stitch Client Secret (from “View Client Secret”) |

4. **Save** each one. If you add or change any variable, trigger a **Redeploy** (Deployments → … → Redeploy) so the new values are used.

---

## Quick checklist

- [ ] Terminal: `cd "/Users/elad/PaperWalls (V1)"`
- [ ] `git add .`
- [ ] `git commit -m "Stitch payment-links integration and docs"`
- [ ] `git push origin main`
- [ ] Vercel: check Deployments for a new build, or Redeploy
- [ ] Vercel: Settings → Environment Variables – all six vars set, then Redeploy if you changed any

After this, your edits are in Git and live on Vercel.
