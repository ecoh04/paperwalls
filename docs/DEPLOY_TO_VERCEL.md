# Deploy PaperWalls to Vercel (step-by-step)

This gets your site live at a URL like `paperwalls.vercel.app` so you can add that URL to your env and test the order flow.

---

## What you need before starting

- Your project folder (this one) on your computer.
- A **GitHub** account (free). If you don’t have one: [github.com](https://github.com) → Sign up.
- A **Vercel** account (free). Sign up at [vercel.com](https://vercel.com) — use “Continue with GitHub” so linking is easy.

---

## Part 1: Put your code on GitHub

Vercel doesn’t “upload files” by hand. It connects to a **Git repository** and deploys when you push. So first we put the project on GitHub.

### Step 1.1: Create a new repository on GitHub

1. Go to [github.com](https://github.com) and log in.
2. Click the **+** (top right) → **New repository**.
3. **Repository name:** e.g. `paperwalls` (or any name you like).
4. Leave it **Public**.
5. **Do not** check “Add a README” or “Add .gitignore” — we already have a project.
6. Click **Create repository**.

You’ll see a page that says “Quick setup” and shows a URL like `https://github.com/YOUR_USERNAME/paperwalls.git`. Keep this page open or copy that URL.

### Step 1.2: Open Terminal on your computer

- **Mac:** Open **Terminal** (search “Terminal” in Spotlight).
- **Windows:** You can use **PowerShell** or **Git Bash** (if you installed Git).

### Step 1.3: Go to your project folder

In Terminal, type (replace with your real path if different):

```bash
cd "/Users/elad/PaperWalls (V1)"
```

Press Enter.

### Step 1.4: Turn the folder into a Git repo and push to GitHub

Copy and run these commands **one at a time** (replace `YOUR_USERNAME` and `paperwalls` with your GitHub username and repo name if different):

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - PaperWalls"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/paperwalls.git
```

```bash
git push -u origin main
```

- If it asks for your GitHub **username and password:** use your GitHub email and a **Personal Access Token** (not your normal password). To create one: GitHub → Settings → Developer settings → Personal access tokens → Generate new token. Give it “repo” scope.
- If you get “remote origin already exists”, run: `git remote remove origin` then run the `git remote add origin ...` line again with your URL.

When `git push` finishes without errors, your code is on GitHub.

---

## Part 2: Deploy on Vercel

### Step 2.1: Import the project

1. Go to [vercel.com](https://vercel.com) and log in (with GitHub).
2. Click **Add New…** → **Project**.
3. You should see a list of your GitHub repos. Find **paperwalls** (or whatever you named it) and click **Import** next to it.

### Step 2.2: Configure the project (first screen)

- **Framework Preset:** Vercel should detect **Next.js**. Leave it.
- **Root Directory:** Leave as **./** (default).
- **Build and Output Settings:** Leave defaults.

Do **not** click Deploy yet. First add env vars.

### Step 2.3: Add Environment Variables

On the same page, find **Environment Variables**.

Add each of these (name on the left, value on the right). Use your real values from Supabase and Stitch; for now you can leave Stitch blank if you’re not ready:

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | From Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Same place |
| `STITCH_API_URL` | Your Stitch API URL | Or leave blank to test without payment |
| `STITCH_API_KEY` | Your Stitch API key | Or leave blank |
| `NEXT_PUBLIC_APP_URL` | **Leave empty for now** | We’ll set it after first deploy |

- For each row: type the **Name**, paste the **Value**, click **Add** (or **Save**).
- **NEXT_PUBLIC_APP_URL:** Leave empty on first deploy. After the first deploy you’ll get a URL like `https://paperwalls.vercel.app`. Then we’ll add that here and redeploy.

Click **Deploy**.

### Step 2.4: Wait for the build

Vercel will build your project (usually 1–2 minutes). When it’s done you’ll see **Congratulations** and a link like **https://paperwalls-xxxx.vercel.app**.

That link is your **Vercel project URL**. Click it to open your site.

### Step 2.5: Set the app URL and redeploy

1. In Vercel, open your project → **Settings** → **Environment Variables**.
2. Add (or edit):
   - **Name:** `NEXT_PUBLIC_APP_URL`
   - **Value:** Your Vercel URL, e.g. `https://paperwalls-xxxx.vercel.app` (no trailing slash).
3. Save.
4. Go to **Deployments**, click the **…** on the latest deployment → **Redeploy** (so the new env is used).

---

## Part 3: After you have the Vercel URL

1. **Stitch webhook**  
   In Stitch’s dashboard, set the webhook URL to:
   ```text
   https://YOUR_VERCEL_URL/api/webhooks/stitch
   ```  
   Example: `https://paperwalls-xxxx.vercel.app/api/webhooks/stitch`.

2. **Optional: custom domain later**  
   When you’re ready to use your main domain: Vercel → Project → **Settings** → **Domains** → add your domain and follow the DNS instructions Vercel shows.

3. **Testing the order flow**  
   - Add something to the cart on the configurator.
   - Go to Checkout and fill in the form.
   - Proceed to payment. If Stitch is configured, you’ll go to Stitch and then back to your success page. If Stitch env vars are still empty, you’ll go straight to the success page (so you can test the rest of the flow).

---

## Quick checklist

- [ ] GitHub repo created and code pushed (`git init` … `git push`).
- [ ] Vercel account linked to GitHub.
- [ ] New project imported from GitHub repo.
- [ ] Env vars added (at least Supabase; Stitch optional at first).
- [ ] First deploy finished and you have the `*.vercel.app` URL.
- [ ] `NEXT_PUBLIC_APP_URL` set to that URL and redeployed.
- [ ] Stitch webhook URL set to `https://YOUR_VERCEL_URL/api/webhooks/stitch` when you’re ready to test payments.

If any step fails, tell me which step and what you see (error message or screen), and we can fix it.
