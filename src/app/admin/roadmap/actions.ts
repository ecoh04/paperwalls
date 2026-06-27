"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

// The 5 statuses the founder can move an item between. Mirrors the DB CHECK.
// NOT exported: a "use server" file may only export async functions, so this
// value stays module-local. The type is erased at build, so it's safe to export.
const ROADMAP_STATUSES = ["done", "now", "next", "later", "parked"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

// Set a roadmap item's status. Admin-gated; writes through the service-role
// client because roadmap_items is RLS-locked with no policy (server-only).
// One tap on the board lands here and re-renders the list.
export async function setRoadmapStatus(
  id: string,
  status: RoadmapStatus,
): Promise<{ ok: boolean; error?: string }> {
  if (!(ROADMAP_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Bad status" };
  }
  if (!id) return { ok: false, error: "Bad id" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Admin only" };

  if (!supabaseAdmin) return { ok: false, error: "Server not configured" };

  const { error } = await supabaseAdmin
    .from("roadmap_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/roadmap");
  return { ok: true };
}
