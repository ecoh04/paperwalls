import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminLogout } from "@/components/admin/AdminLogout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()
        .then((r) => r.data)
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="text-lg font-semibold text-stone-900 hover:text-stone-700"
            >
              PaperWalls Factory
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Orders
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-sm text-stone-500">
                {profile.full_name || user?.email}
                {profile?.role === "admin" && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                    Admin
                  </span>
                )}
              </span>
            )}
            <AdminLogout />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
