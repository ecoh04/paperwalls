import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — use ONLY in API routes and server actions, never in the browser.
 * Never import this in client components or anything with "use client".
 */
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;
