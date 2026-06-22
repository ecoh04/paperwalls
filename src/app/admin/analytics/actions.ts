"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

// Save the owner's ad spend for a given SAST day (ZAR cents). Admin-gated;
// writes through the service-role client (the table is RLS-locked to server-
// only). Powers MER / ROAS / CAC / net-profit on the analytics cockpit.
export async function setDailySpend(spendDate: string, amountCents: number): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spendDate)) return { ok: false, error: "Bad date" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Admin only" };

  if (!supabaseAdmin) return { ok: false, error: "Server not configured" };
  const cents = Math.max(0, Math.round(Number(amountCents) || 0));

  const { error } = await supabaseAdmin
    .from("daily_ad_spend")
    .upsert({ spend_date: spendDate, amount_cents: cents, channel: "blended", updated_at: new Date().toISOString() }, { onConflict: "spend_date" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/analytics");
  return { ok: true };
}
