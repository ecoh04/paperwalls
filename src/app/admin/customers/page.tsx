import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatZarCents } from "@/lib/admin-labels";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string };

type Row = {
  id:                 string;
  email:              string;
  name:               string | null;
  phone:              string | null;
  total_orders:       number;
  total_spent_cents:  number;
  marketing_source:   string | null;
  last_seen_at:       string | null;
  created_at:         string;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id, email, name, phone, total_orders, total_spent_cents, marketing_source, last_seen_at, created_at");

  if (q) {
    const term = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    query = query.or(`email.ilike.${term},name.ilike.${term},phone.ilike.${term}`);
  }
  query = query.order("total_spent_cents", { ascending: false }).limit(200);

  const { data, error } = await query;
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Couldn't load customers</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }
  const list = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Customers</h1>
          <p className="mt-1 text-sm text-stone-600">
            Sorted by lifetime spend. {list.length} of up to 200 shown.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email, name, phone"
            className="w-64 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button type="submit" className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
            Search
          </button>
        </form>
      </header>

      {list.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500">
          {q ? "No customers match." : "No customers yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Contact</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">Lifetime spend</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="text-sm font-medium text-stone-900 hover:text-amber-700">
                      {c.name ?? c.email.split("@")[0]}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-600">
                    <div>{c.email}</div>
                    {c.phone && <div className="text-xs text-stone-500">{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-stone-900">{c.total_orders}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-stone-900">{formatZarCents(c.total_spent_cents)}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{c.marketing_source ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString("en-ZA") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
