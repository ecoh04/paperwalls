import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";

// Send-a-test-email button on /admin/setup. Admin-gated. Hits Resend
// directly (not via the queue + drainer) so a misconfigured RESEND_API_KEY
// surfaces as a clear error here rather than as silent skips in the cron.

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const to =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.EMAIL_REPLY_TO?.trim() ||
    profile.email;

  if (!to) {
    return NextResponse.json(
      { error: "No destination address. Set ADMIN_NOTIFICATION_EMAIL, EMAIL_REPLY_TO, or a profile email." },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: `PaperWalls test email · ${new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
    html: `<!DOCTYPE html><html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 32px; background: #F8F4EF;">
      <h1 style="color: #1A1714;">It works.</h1>
      <p style="color: #1A1714; line-height: 1.6;">If you're reading this, your Resend setup is correctly wired:</p>
      <ul style="color: #5a5a5a; line-height: 1.8;">
        <li>RESEND_API_KEY is valid</li>
        <li>EMAIL_FROM is allowed (domain verified at Resend)</li>
        <li>SMTP delivery works for ${to}</li>
      </ul>
      <p style="color: #5a5a5a; margin-top: 24px;">Triggered manually from <code>/admin/setup</code>.</p>
    </body></html>`,
  });

  if ("skipped" in result) {
    return NextResponse.json(
      { error: result.reason, hint: "Set RESEND_API_KEY in Vercel env vars." },
      { status: 503 }
    );
  }
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, hint: "Check that EMAIL_FROM uses a domain verified in Resend." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, to, resend_id: result.id });
}
