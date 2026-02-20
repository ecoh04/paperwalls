"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

type Params = {
  status?: string;
  factory?: string;
  from?: string;
  to?: string;
  q?: string;
  sort?: string;
  show_archived?: string;
  refunded?: string;
};

function buildHref(current: Params, overrides: Partial<Params>): string {
  const p = { ...current, ...overrides };
  const q = new URLSearchParams();
  if (p.status) q.set("status", p.status);
  if (p.factory) q.set("factory", p.factory);
  if (p.from) q.set("from", p.from);
  if (p.to) q.set("to", p.to);
  if (p.q) q.set("q", p.q);
  if (p.sort && p.sort !== "created_desc") q.set("sort", p.sort);
  if (p.show_archived === "1") q.set("show_archived", "1");
  if (p.refunded === "1") q.set("refunded", "1");
  const s = q.toString();
  return s ? `/admin/orders?${s}` : "/admin/orders";
}

type Props = {
  validStatus: OrderStatus | null;
  statusFilter: string | undefined;
  factoryFilter: string | undefined;
  factories: { id: string; name: string }[];
  fromDate: string | undefined;
  toDate: string | undefined;
  searchQ: string;
  sortBy: string;
  showArchived: boolean;
  refundedOnly: boolean;
  isAdmin: boolean;
  exportHref: string;
};

export function OrdersFiltersCollapse({
  validStatus,
  statusFilter,
  factoryFilter,
  factories,
  fromDate,
  toDate,
  searchQ,
  sortBy,
  showArchived,
  refundedOnly,
  isAdmin,
  exportHref,
}: Props) {
  const [open, setOpen] = useState(false);

  const currentParams: Params = useMemo(
    () => ({
      status: statusFilter ?? undefined,
      factory: factoryFilter ?? undefined,
      from: fromDate ?? undefined,
      to: toDate ?? undefined,
      q: searchQ || undefined,
      sort: sortBy !== "created_desc" ? sortBy : undefined,
      show_archived: showArchived ? "1" : undefined,
      refunded: refundedOnly ? "1" : undefined,
    }),
    [statusFilter, factoryFilter, fromDate, toDate, searchQ, sortBy, showArchived, refundedOnly]
  );

  const href = (overrides: Partial<Params>) => buildHref(currentParams, overrides);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        <span>Filters & search</span>
        <span className="text-stone-400" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="border-t border-stone-200 p-4">
          <form method="get" className="space-y-4">
            <input type="hidden" name="status" value={statusFilter ?? ""} />
            <input type="hidden" name="factory" value={factoryFilter ?? ""} />
            <input type="hidden" name="show_archived" value={showArchived ? "1" : ""} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="q" className="block text-xs font-medium text-stone-500">
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={searchQ}
                  placeholder="Order # or customer"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="from" className="block text-xs font-medium text-stone-500">
                  From
                </label>
                <input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={fromDate ?? ""}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="to" className="block text-xs font-medium text-stone-500">
                  To
                </label>
                <input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={toDate ?? ""}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="sort" className="block text-xs font-medium text-stone-500">
                  Sort
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sortBy}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                >
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                  <option value="updated_desc">Recently updated</option>
                  <option value="updated_asc">Least recently updated</option>
                  <option value="total_desc">Total high → low</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-stone-500">Status</span>
              <Link
                href={href({ status: undefined })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  !validStatus ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                All
              </Link>
              {(["new", "in_production", "shipped", "delivered", "pending", "cancelled"] as const).map((s) => (
                <Link
                  key={s}
                  href={href({ status: s })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    validStatus === s ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {ORDER_STATUS_LABELS[s]}
                </Link>
              ))}
            </div>
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-3">
                <Link
                  href={href({ show_archived: showArchived ? undefined : "1" })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    showArchived ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Show archived
                </Link>
                {factories.length > 0 && (
                  <>
                    <span className="text-xs text-stone-400">Factory:</span>
                    <Link
                      href={href({ factory: undefined })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        !factoryFilter ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      All
                    </Link>
                    <Link
                      href={href({ factory: "unassigned" })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        factoryFilter === "unassigned" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Unassigned
                    </Link>
                    {factories.map((f) => (
                      <Link
                        key={f.id}
                        href={href({ factory: f.id })}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          factoryFilter === f.id ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {f.name}
                      </Link>
                    ))}
                  </>
                )}
                <a
                  href={exportHref}
                  className="ml-auto rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Export CSV
                </a>
              </div>
            )}
            <button
              type="submit"
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              Apply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
