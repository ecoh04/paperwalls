import { createClient } from "@/lib/supabase/server";
import { SendTestEmailButton, CopyableCommand } from "./SetupActions";

// Pre-launch setup page. Live-checks every prerequisite for Path A
// (payments + emails working end-to-end) and gives copy-paste-ready
// instructions next to each amber check. As env vars and crons are
// wired, dots turn green.
//
// Designed so that once everything is green, you know with confidence
// that a real customer paying right now would: payment captured →
// webhook fired → payments row written → customer email queued →
// drainer sent → customer received it → admin alerted.

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;

type CheckTone = "ok" | "warn" | "neutral";
type Check = {
  label:    string;
  tone:     CheckTone;
  status:   string;
  detail?:  string;
};

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Please log in to view setup.
      </div>
    );
  }

  // ── Env-var presence (server-side, never reveal values) ───────────────
  const env = {
    RESEND_API_KEY:           !!process.env.RESEND_API_KEY?.trim(),
    EMAIL_FROM:               !!process.env.EMAIL_FROM?.trim(),
    EMAIL_REPLY_TO:           !!process.env.EMAIL_REPLY_TO?.trim(),
    ADMIN_NOTIFICATION_EMAIL: !!process.env.ADMIN_NOTIFICATION_EMAIL?.trim(),
    CRON_SECRET:              !!process.env.CRON_SECRET?.trim(),
    NEXT_PUBLIC_APP_URL:      !!process.env.NEXT_PUBLIC_APP_URL?.trim(),
    PAYFAST_MERCHANT_ID:      !!process.env.PAYFAST_MERCHANT_ID?.trim(),
    PAYFAST_MERCHANT_KEY:     !!process.env.PAYFAST_MERCHANT_KEY?.trim(),
    PAYFAST_PASSPHRASE:       !!process.env.PAYFAST_PASSPHRASE?.trim(),
    SLACK_ALERTS_URL:         !!process.env.SLACK_ALERTS_URL?.trim(),
  };

  // ── Heartbeat events from cron jobs ───────────────────────────────────
  const [drainerEvt, reconcileEvt, paymentEvt] = await Promise.all([
    supabase.from("events").select("created_at").eq("type", "cron.drain_emails")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("created_at").eq("type", "cron.reconcile_payments")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("events").select("created_at").eq("type", "payment.completed")
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  function ago(iso: string | null | undefined): string {
    if (!iso) return "never";
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < HOUR) return `${Math.max(1, Math.floor(ms / 60000))} min ago`;
    if (ms < 24 * HOUR) return `${Math.floor(ms / HOUR)} h ago`;
    return `${Math.floor(ms / (24 * HOUR))} d ago`;
  }

  const drainerLast    = drainerEvt.data?.created_at;
  const reconcileLast  = reconcileEvt.data?.created_at;
  const paymentLast    = paymentEvt.data?.created_at;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://paperwalls.vercel.app";

  // ── Build the section-by-section checks ───────────────────────────────
  const emailChecks: Check[] = [
    { label: "RESEND_API_KEY",           tone: env.RESEND_API_KEY ? "ok" : "warn",
      status: env.RESEND_API_KEY ? "Set" : "Missing — emails will not send" },
    { label: "EMAIL_FROM",               tone: env.EMAIL_FROM ? "ok" : "warn",
      status: env.EMAIL_FROM ? "Set" : "Missing — Resend will reject sends",
      detail: "e.g. \"PaperWalls <orders@paperwalls.co.za>\". Domain must be verified in Resend." },
    { label: "EMAIL_REPLY_TO",           tone: env.EMAIL_REPLY_TO ? "ok" : "warn",
      status: env.EMAIL_REPLY_TO ? "Set" : "Missing — replies bounce",
      detail: "e.g. \"hello@paperwalls.co.za\". Where customer replies arrive." },
    { label: "ADMIN_NOTIFICATION_EMAIL", tone: env.ADMIN_NOTIFICATION_EMAIL ? "ok" : "warn",
      status: env.ADMIN_NOTIFICATION_EMAIL ? "Set" : "Missing — you won't get new-order alerts",
      detail: "Where new-paid-order alerts go. Falls back to EMAIL_REPLY_TO if not set." },
  ];

  const cronChecks: Check[] = [
    { label: "CRON_SECRET",       tone: env.CRON_SECRET ? "ok" : "warn",
      status: env.CRON_SECRET ? "Set" : "Missing — cron routes refuse all requests" },
    { label: "Drainer running",   tone: drainerLast ? (drainerEvt.data && Date.now() - new Date(drainerEvt.data.created_at).getTime() < HOUR ? "ok" : "warn") : "warn",
      status: drainerLast ? `Last ran ${ago(drainerLast)}` : "Never ran",
      detail: "Should run every 5 minutes via external cron." },
    { label: "Reconciliation running", tone: reconcileLast ? (Date.now() - new Date(reconcileLast).getTime() < 36 * HOUR ? "ok" : "warn") : "warn",
      status: reconcileLast ? `Last ran ${ago(reconcileLast)}` : "Never ran",
      detail: "Should run daily." },
  ];

  const paymentChecks: Check[] = [
    { label: "PAYFAST_MERCHANT_ID",  tone: env.PAYFAST_MERCHANT_ID ? "ok" : "warn",
      status: env.PAYFAST_MERCHANT_ID ? "Set" : "Missing" },
    { label: "PAYFAST_MERCHANT_KEY", tone: env.PAYFAST_MERCHANT_KEY ? "ok" : "warn",
      status: env.PAYFAST_MERCHANT_KEY ? "Set" : "Missing" },
    { label: "PAYFAST_PASSPHRASE",   tone: env.PAYFAST_PASSPHRASE ? "ok" : "warn",
      status: env.PAYFAST_PASSPHRASE ? "Set" : "Missing — webhook signature verification will fail" },
    { label: "NEXT_PUBLIC_APP_URL",  tone: env.NEXT_PUBLIC_APP_URL ? "ok" : "warn",
      status: env.NEXT_PUBLIC_APP_URL ? "Set" : "Missing — PayFast doesn't know where to send the buyer back",
      detail: `Should match your live domain. Currently using: ${appUrl}` },
    { label: "ITN webhook fired",     tone: paymentLast ? "ok" : "neutral",
      status: paymentLast ? `Last fired ${ago(paymentLast)}` : "No PayFast ITN received yet — run a sandbox test below" },
  ];

  const optionalChecks: Check[] = [
    { label: "SLACK_ALERTS_URL", tone: env.SLACK_ALERTS_URL ? "ok" : "neutral",
      status: env.SLACK_ALERTS_URL ? "Set" : "Optional — without it, alerts log to Vercel runtime only" },
  ];

  const drainerUrl   = `${appUrl}/api/cron/drain-emails`;
  const reconcileUrl = `${appUrl}/api/cron/reconcile-payments`;
  const itnUrl       = `${appUrl}/api/payfast/notify`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Setup</h1>
        <p className="mt-1 text-sm text-stone-600 max-w-2xl">
          Live-checks every prerequisite for taking real orders. As you wire each piece,
          its dot turns green. When everything below is green, a customer paying right now will
          (a) get a confirmation email, (b) trigger an admin alert, (c) be reconcilable.
        </p>
      </header>

      {/* ── Email pipeline ──────────────────────────────────────────── */}
      <Section
        n={1}
        title="Email pipeline (Resend)"
        body="Free up to 3,000 emails/month. No upgrade needed."
        checks={emailChecks}
      >
        <Steps title="What to do">
          <Step n={1}>
            Sign up at{" "}
            <a className="font-medium text-stone-900 underline" href="https://resend.com" target="_blank" rel="noopener noreferrer">resend.com</a>.
          </Step>
          <Step n={2}>
            Add domain <code className="rounded bg-stone-100 px-1">paperwalls.co.za</code>. Resend will give you DNS records (MX, TXT for SPF, CNAME for DKIM, optionally TXT for DMARC). Add them at your DNS provider.
          </Step>
          <Step n={3}>
            Once verified, create an API key. Copy it.
          </Step>
          <Step n={4}>
            In <a className="font-medium text-stone-900 underline" href="https://vercel.com/elad-adsytemedias-projects/paperwalls/settings/environment-variables" target="_blank" rel="noopener noreferrer">Vercel project settings → Environment Variables</a>, set:
            <ul className="mt-2 ml-1 list-disc pl-4 text-stone-700">
              <li><code className="rounded bg-stone-100 px-1">RESEND_API_KEY</code> = the key</li>
              <li><code className="rounded bg-stone-100 px-1">EMAIL_FROM</code> = <code className="rounded bg-stone-100 px-1">PaperWalls &lt;orders@paperwalls.co.za&gt;</code></li>
              <li><code className="rounded bg-stone-100 px-1">EMAIL_REPLY_TO</code> = <code className="rounded bg-stone-100 px-1">hello@paperwalls.co.za</code></li>
              <li><code className="rounded bg-stone-100 px-1">ADMIN_NOTIFICATION_EMAIL</code> = your inbox</li>
            </ul>
          </Step>
          <Step n={5}>Redeploy (or wait for the next deploy). Reload this page to see the dots.</Step>
        </Steps>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-900">Once Resend is wired, prove it works</p>
          <p className="mt-1 text-xs text-stone-600">
            Sends to <code className="rounded bg-white px-1">ADMIN_NOTIFICATION_EMAIL</code>{" "}
            (or <code className="rounded bg-white px-1">EMAIL_REPLY_TO</code>) using your real Resend setup.
          </p>
          <div className="mt-3">
            <SendTestEmailButton />
          </div>
        </div>
      </Section>

      {/* ── External cron ───────────────────────────────────────────── */}
      <Section
        n={2}
        title="External cron jobs"
        body="Vercel Hobby doesn't include cron. Use cron-job.org (free) to hit the cron routes on a schedule."
        checks={cronChecks}
      >
        <Steps title="What to do">
          <Step n={1}>
            Set <code className="rounded bg-stone-100 px-1">CRON_SECRET</code> in Vercel env vars to a long random string. Anything will do — generate with <code className="rounded bg-stone-100 px-1">openssl rand -hex 32</code> in your terminal.
          </Step>
          <Step n={2}>
            Sign up at{" "}
            <a className="font-medium text-stone-900 underline" href="https://cron-job.org" target="_blank" rel="noopener noreferrer">cron-job.org</a>.
          </Step>
          <Step n={3}>
            Create job: <strong>Drain emails</strong> · every 5 min · GET this URL:
            <div className="mt-2"><CopyableCommand value={drainerUrl} /></div>
            Add a custom HTTP request header: <code className="rounded bg-stone-100 px-1">Authorization: Bearer YOUR_CRON_SECRET</code>
          </Step>
          <Step n={4}>
            Create job: <strong>Reconcile payments</strong> · daily at 03:00 SAST · GET:
            <div className="mt-2"><CopyableCommand value={reconcileUrl} /></div>
            Same Authorization header.
          </Step>
          <Step n={5}>
            Hit each URL once manually from cron-job.org's dashboard ("Run now"). Reload this page to see dots flip green.
          </Step>
        </Steps>
      </Section>

      {/* ── Payment ────────────────────────────────────────────────── */}
      <Section
        n={3}
        title="PayFast payment integration"
        body="Sandbox first. Once we've seen one webhook fire end-to-end, switch the env var to live."
        checks={paymentChecks}
      >
        <Steps title="What to do">
          <Step n={1}>
            In your{" "}
            <a className="font-medium text-stone-900 underline" href="https://sandbox.payfast.co.za/" target="_blank" rel="noopener noreferrer">PayFast sandbox dashboard</a>{" "}
            → Settings → Integration, set the <strong>ITN URL</strong> to:
            <div className="mt-2"><CopyableCommand value={itnUrl} /></div>
          </Step>
          <Step n={2}>
            In Vercel env vars set <code className="rounded bg-stone-100 px-1">PAYFAST_MERCHANT_ID</code>, <code className="rounded bg-stone-100 px-1">PAYFAST_MERCHANT_KEY</code>, <code className="rounded bg-stone-100 px-1">PAYFAST_PASSPHRASE</code> from sandbox (or live — leave PAYFAST_SANDBOX=true while testing).
          </Step>
          <Step n={3}>
            Set <code className="rounded bg-stone-100 px-1">NEXT_PUBLIC_APP_URL</code> = <code className="rounded bg-stone-100 px-1">{appUrl}</code> (or your custom domain once mapped).
          </Step>
          <Step n={4}>
            Run a sandbox order: open the site in incognito, configure a tiny wall (cheap), check out, pay with PayFast sandbox card{" "}
            (<code className="rounded bg-stone-100 px-1">5200 0000 0000 0015</code>, any name, any future expiry, any 3-digit CVV).
          </Step>
          <Step n={5}>
            Within ~10 seconds: order should flip from <code className="rounded bg-stone-100 px-1">pending</code> → <code className="rounded bg-stone-100 px-1">new</code>, a row should appear in <code className="rounded bg-stone-100 px-1">payments</code>, you should get an admin alert email, and the customer email should land within 5 minutes when the cron fires.
          </Step>
        </Steps>
      </Section>

      {/* ── Optional ───────────────────────────────────────────────── */}
      <Section
        n={4}
        title="Optional: ops alerts"
        body="Not required. Without this, alerts (drainer failures, reconciliation drift) only land in Vercel runtime logs."
        checks={optionalChecks}
      >
        <Steps title="What to do">
          <Step n={1}>
            Create a Slack incoming webhook at{" "}
            <a className="font-medium text-stone-900 underline" href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">api.slack.com/messaging/webhooks</a>.
          </Step>
          <Step n={2}>
            Set <code className="rounded bg-stone-100 px-1">SLACK_ALERTS_URL</code> in Vercel env vars to the webhook URL.
          </Step>
        </Steps>
      </Section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Building blocks
// ──────────────────────────────────────────────────────────────────────────

function Section({
  n, title, body, checks, children,
}: {
  n: number; title: string; body: string; checks: Check[]; children: React.ReactNode;
}) {
  const allOk = checks.every((c) => c.tone === "ok");
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <header className="flex items-baseline gap-3">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
          allOk ? "bg-green-600 text-white" : "bg-stone-200 text-stone-700"
        }`}>
          {allOk ? "✓" : n}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <p className="text-sm text-stone-600">{body}</p>
        </div>
      </header>

      {/* Checks list */}
      <ul className="mt-4 space-y-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            <Dot tone={c.tone} />
            <div className="flex-1">
              <span className="font-mono text-xs text-stone-700">{c.label}</span>
              <span className="ml-2 text-stone-600">{c.status}</span>
              {c.detail && <p className="mt-0.5 text-xs text-stone-500">{c.detail}</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {children}
      </div>
    </section>
  );
}

function Dot({ tone }: { tone: CheckTone }) {
  const cls = tone === "ok" ? "bg-green-500" : tone === "warn" ? "bg-amber-500" : "bg-stone-300";
  return <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

function Steps({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</p>
      <ol className="space-y-2">
        {children}
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm text-stone-700">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-[11px] font-semibold text-stone-700">
        {n}
      </span>
      <div className="flex-1 leading-relaxed">{children}</div>
    </li>
  );
}
