import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyOps } from "@/lib/alerts";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Footer email capture. Insert-only — duplicates are ignored silently
 * so the buyer always sees a success state and can't probe the list.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const rawEmail = typeof data.email === "string" ? data.email.trim() : "";
  const source   = typeof data.source === "string" ? data.source.slice(0, 100) : "footer";

  if (!rawEmail) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (rawEmail.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json({ error: "That email address is too long." }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(rawEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!supabaseAdmin) {
    console.error("[subscribe] supabase admin client unavailable — env vars missing");
    return NextResponse.json({ error: "Subscriptions are temporarily unavailable." }, { status: 503 });
  }

  const utm_source   = typeof data.utm_source   === "string" ? data.utm_source.slice(0, 100)   : null;
  const utm_medium   = typeof data.utm_medium   === "string" ? data.utm_medium.slice(0, 100)   : null;
  const utm_campaign = typeof data.utm_campaign === "string" ? data.utm_campaign.slice(0, 100) : null;

  // Upsert behaviour: ignore conflicts so the user gets a friendly success
  // even if they've already signed up. We never reveal whether an email is
  // already on the list.
  const { error } = await supabaseAdmin
    .from("email_subscribers")
    .insert({
      email: rawEmail.toLowerCase(),
      source,
      utm_source,
      utm_medium,
      utm_campaign,
    });

  // 23505 = unique_violation. Treat as success.
  if (error && error.code !== "23505") {
    console.error("[subscribe] insert failed:", error);
    await notifyOps({ severity: "warn", title: "Subscribe insert failed", fields: { code: error.code ?? "", message: error.message ?? "" } });
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
