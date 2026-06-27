import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { RoadmapBoard } from "@/components/admin/RoadmapBoard";
import type { RoadmapItem } from "@/components/admin/RoadmapRow";
import type { RoadmapStatus } from "@/app/admin/roadmap/actions";

export const dynamic = "force-dynamic";

// Order the summary count row reads in: urgent first, parked last.
const SUMMARY_ORDER: { status: RoadmapStatus; label: string }[] = [
  { status: "done",   label: "done" },
  { status: "now",    label: "now" },
  { status: "next",   label: "next" },
  { status: "later",  label: "later" },
  { status: "parked", label: "parked" },
];

export default async function RoadmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Please log in to view the roadmap.</p>
      </div>
    );
  }

  if (!supabaseAdmin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-medium">Server not configured.</p>
      </div>
    );
  }

  const { data, error } = await supabaseAdmin
    .from("roadmap_items")
    .select("id, title, theme, status, priority, note, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Could not load the roadmap.</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const items: RoadmapItem[] = (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    theme: r.theme as string,
    status: r.status as RoadmapStatus,
    priority: (r.priority as RoadmapItem["priority"]) ?? null,
    note: (r.note as string | null) ?? null,
  }));

  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.status] = (acc[it.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Roadmap</h1>
        <p className="mt-1 text-sm text-stone-500">
          The living build list. Tap a status to move an item. Now means do it before scaling ad spend.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
          {SUMMARY_ORDER.map((s, i) => (
            <span key={s.status} className="inline-flex items-center">
              {i > 0 && <span aria-hidden className="mr-2 text-stone-300">·</span>}
              <span className="font-semibold tabular-nums text-stone-900">{counts[s.status] ?? 0}</span>
              <span className="ml-1">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      <RoadmapBoard items={items} />
    </div>
  );
}
