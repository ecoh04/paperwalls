"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

// Compact horizontal toolbar: search box + Type / Install / Sort selects +
// Export. Each control writes to the URL via router.push so the page is
// fully URL-driven (back/forward, sharing, server-side filtering all work).

type Props = {
  searchQ:       string;
  type:          string | null;
  install:       string | null;
  sort:          string;
  isWallpaperContext: boolean;
  exportHref:    string;
  isAdmin:       boolean;
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created_desc",  label: "Newest first" },
  { value: "created_asc",   label: "Oldest first" },
  { value: "updated_desc",  label: "Recently updated" },
  { value: "updated_asc",   label: "Least recently updated" },
  { value: "total_desc",    label: "Highest value" },
  { value: "status",        label: "By status" },
];

export function OrdersToolbar({
  searchQ,
  type,
  install,
  sort,
  isWallpaperContext,
  exportHref,
  isAdmin,
}: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [draftSearch, setDraftSearch] = useState(searchQ);

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

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: draftSearch.trim() || null });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <form onSubmit={onSearchSubmit} className="relative min-w-[180px] flex-1 sm:flex-initial sm:basis-72">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
          </svg>
        </span>
        <input
          type="search"
          value={draftSearch}
          onChange={(e) => setDraftSearch(e.target.value)}
          placeholder="Search order, customer, email"
          className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
        />
      </form>

      {/* Type */}
      <Select
        label="Type"
        value={type ?? ""}
        onChange={(v) => update({ type: v || null, install: v === "sample_pack" ? null : install ?? null })}
        options={[
          { value: "",            label: "All types" },
          { value: "wallpaper",   label: "Wallpaper" },
          { value: "sample_pack", label: "Sample pack" },
        ]}
      />

      {/* Install — only relevant when not viewing samples */}
      {isWallpaperContext && (
        <Select
          label="Install"
          value={install ?? ""}
          onChange={(v) => update({ install: v || null })}
          options={[
            { value: "",              label: "All installs" },
            { value: "diy",           label: "DIY" },
            { value: "pro_installer", label: "Pro install" },
          ]}
        />
      )}

      {/* Sort */}
      <Select
        label="Sort"
        value={sort}
        onChange={(v) => update({ sort: v === "created_desc" ? null : v })}
        options={SORT_OPTIONS}
      />

      <div className="ml-auto flex items-center gap-2">
        {isAdmin && (
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </a>
        )}
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label:   string;
  value:   string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm transition-colors focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 hover:bg-stone-50">
      <span className="pointer-events-none text-xs font-medium uppercase tracking-wider text-stone-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent pr-1 text-sm font-medium text-stone-900 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
