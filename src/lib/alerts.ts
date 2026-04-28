// Operational alerts. Posts to a Slack incoming-webhook URL when one is
// configured (`SLACK_ALERTS_URL` env var). No-op + console.error fallback
// when not — so the app behaves identically in dev and in environments
// where Slack is not yet wired.
//
// Designed to never throw. Alerting must never break the calling code.

type Severity = "info" | "warn" | "fatal";

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

  // Always log so Vercel runtime logs capture it even without Slack.
  if (args.severity === "fatal" || args.severity === "warn") {
    console.error(`[alerts] ${args.title}`, args.fields ?? {}, args.detail ?? "");
  } else {
    console.log(`[alerts] ${args.title}`, args.fields ?? {});
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
