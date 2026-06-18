// Operational alerts. Posts to a Slack incoming-webhook URL when one is
// configured (`SLACK_ALERTS_URL` env var). No-op + console.error fallback
// when not — so the app behaves identically in dev and in environments
// where Slack is not yet wired.
//
// Designed to never throw. Alerting must never break the calling code.

import { sendEmail } from "@/lib/email/send";

type Severity = "info" | "warn" | "fatal";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ICON: Record<Severity, string> = {
  info:  ":information_source:",
  warn:  ":warning:",
  fatal: ":rotating_light:",
};

export async function notifyOps(args: {
  severity:   Severity;
  title:      string;
  /** Optional structured fields rendered as a Slack attachment. */
  fields?:    Record<string, string | number | boolean | null | undefined>;
  /** Free-form context — first 800 chars are included. */
  detail?:    string;
}): Promise<void> {
  const url = process.env.SLACK_ALERTS_URL?.trim();
  const line = `${ICON[args.severity]} *${args.title}*`;

  // Always log so Vercel runtime logs capture it even without a channel wired.
  if (args.severity === "fatal" || args.severity === "warn") {
    console.error(`[alerts] ${args.title}`, args.fields ?? {}, args.detail ?? "");
  } else {
    console.log(`[alerts] ${args.title}`, args.fields ?? {});
  }

  // Email channel — fires for warn/fatal when an ops email is configured, so you
  // get alerted with no Slack. Awaited so the serverless function doesn't freeze
  // before the send completes. ADMIN_NOTIFICATION_EMAIL is reused so there's
  // nothing new to wire; OPS_ALERT_EMAIL overrides it if you want a separate box.
  const opsEmail = process.env.OPS_ALERT_EMAIL?.trim() || process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (opsEmail && (args.severity === "fatal" || args.severity === "warn")) {
    const fieldsText = args.fields
      ? Object.entries(args.fields).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}: ${String(v)}`).join("\n")
      : "";
    const html =
      `<p><strong>[${args.severity.toUpperCase()}] ${escapeHtml(args.title)}</strong></p>` +
      (fieldsText ? `<pre>${escapeHtml(fieldsText)}</pre>` : "") +
      (args.detail ? `<pre>${escapeHtml(args.detail.slice(0, 800))}</pre>` : "");
    try {
      await sendEmail({ to: opsEmail, subject: `[PaperWalls ${args.severity}] ${args.title}`, html });
    } catch {
      // Alerting must never throw into the caller.
    }
  }

  if (!url) return;

  const blocks: Array<Record<string, unknown>> = [
    { type: "section", text: { type: "mrkdwn", text: line } },
  ];
  if (args.fields) {
    const fieldEntries = Object.entries(args.fields).filter(([, v]) => v != null && v !== "");
    if (fieldEntries.length > 0) {
      blocks.push({
        type: "section",
        fields: fieldEntries.map(([k, v]) => ({
          type: "mrkdwn",
          text: `*${k}*\n${String(v)}`,
        })),
      });
    }
  }
  if (args.detail) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "```" + args.detail.slice(0, 800) + "```" },
    });
  }

  try {
    await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ blocks }),
    });
  } catch (err) {
    console.error("[alerts] Failed to post Slack alert:", err);
  }
}
