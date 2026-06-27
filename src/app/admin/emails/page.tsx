import { createClient } from "@/lib/supabase/server";
import { EmailTester } from "@/components/admin/EmailTester";

// Founder QA tool. Fire any transactional template to your inbox to check how
// it renders in a real client (Gmail, Outlook, Apple Mail). Each send uses
// realistic sample data and a [TEST] subject prefix. Admin-gated; the actual
// send happens in a server action that re-checks the admin role.

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Please log in to view this page.
      </div>
    );
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Admin only.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Emails</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-600">
          Send any template to yourself to check how it renders in a real inbox. Each one uses
          sample data and a <code className="rounded bg-stone-100 px-1">[TEST]</code> subject
          prefix, so it is never confused with a real order. Sends go straight through Resend,
          so a missing key or unverified domain shows up here as a clear error.
        </p>
      </header>

      <EmailTester defaultEmail={user.email ?? ""} />
    </div>
  );
}
