"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

// Advanced filters live behind a 'More filters' disclosure since they
// are used less often than the toolbar selects. Date range + admin-only
// toggles for archived and refunded-only.

type Props = {
  fromDate:      string | undefined;
  toDate:        string | undefined;
  showArchived:  boolean;
  refundedOnly:  boolean;
  isAdmin:       boolean;
};

export function OrdersAdvancedFilters({
  fromDate, toDate, showArchived, refundedOnly, isAdmin,
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(
    !!(fromDate || toDate || showArchived || refundedOnly)
  );

  const activeCount =
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0) +
    (showArchived ? 1 : 0) +
    (refundedOnly ? 1 : 0);

  function update(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else                         params.set(k, v);
    }
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {open ? "Hide" : "More"} filters
        {activeCount > 0 && (
          <span className="rounded-full bg-stone-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From">
            <input
              type="date"
              value={fromDate ?? ""}
              onChange={(e) => update({ from: e.target.value || null })}
              className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={toDate ?? ""}
              onChange={(e) => update({ to: e.target.value || null })}
              className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </Field>
          {isAdmin && (
            <>
              <Field label="Archived">
                <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => update({ show_archived: e.target.checked ? "1" : null })}
                    className="rounded border-stone-300"
                  />
                  Show archived orders
                </label>
              </Field>
              <Field label="Refunds">
                <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={refundedOnly}
                    onChange={(e) => update({ refunded: e.target.checked ? "1" : null })}
                    className="rounded border-stone-300"
                  />
                  Refunded only
                </label>
              </Field>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-stone-500">{label}</p>
      {children}
    </div>
  );
}
