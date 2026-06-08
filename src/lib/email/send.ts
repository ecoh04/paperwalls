// Thin Resend wrapper. Uses fetch + REST API so we don't add a dependency until
// the volume justifies it. Reads three env vars:
//
//   RESEND_API_KEY   — required to actually send. If missing, sendEmail returns
//                       { skipped: true } so the drainer can no-op cleanly in
//                       environments where the key isn't wired yet.
//   EMAIL_FROM       — "PaperWalls <orders@mail.paperwalls.co.za>"
//   EMAIL_REPLY_TO   — optional, defaults to hello@paperwalls.co.za

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendResult =
  | { ok: true;  id: string }
  | { ok: false; error: string }
  | { skipped: true; reason: string };

/**
 * Derive a readable plain-text body from our HTML templates so every send is
 * multipart/alternative. HTML-only mail scores materially worse on spam
 * filters (Gmail/Outlook), which matters most for a brand-new sending domain.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<\/(p|div|tr|h1|h2|h3|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&middot;/g, "·")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail(args: {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { skipped: true, reason: "RESEND_API_KEY not set" };
  }

  const from    = process.env.EMAIL_FROM?.trim()      || "PaperWalls <orders@paperwalls.co.za>";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim()  || "hello@paperwalls.co.za";

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to:        [args.to],
        subject:   args.subject,
        html:      args.html,
        text:      args.text ?? htmlToText(args.html),
        reply_to:  replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
