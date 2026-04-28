import Link from "next/link";

// Active filter chips. Each chip names the filter + value and has an X
// link that clears just that one filter. Hidden when nothing is active.
// Stays a server component — every chip is just a Link to a different
// URL, no client state needed.

type Filter = {
  key:    "q" | "type" | "install" | "from" | "to" | "show_archived" | "refunded";
  label:  string;
};

type Props = {
  searchQ:       string;
  type:          string | null;
  install:       string | null;
  fromDate:      string | undefined;
  toDate:        string | undefined;
  showArchived:  boolean;
  refundedOnly:  boolean;
  buildHref:     (overrides: Record<string, string | undefined>) => string;
};

const TYPE_LABEL:    Record<string, string> = { wallpaper: "Wallpaper", sample_pack: "Sample pack" };
const INSTALL_LABEL: Record<string, string> = { diy: "DIY", pro_installer: "Pro install" };

export function OrdersActiveFilters({
  searchQ, type, install, fromDate, toDate, showArchived, refundedOnly, buildHref,
}: Props) {
  const active: { key: Filter["key"]; label: string }[] = [];
  if (searchQ)            active.push({ key: "q",       label: `Search: "${searchQ}"` });
  if (type)               active.push({ key: "type",    label: `Type: ${TYPE_LABEL[type] ?? type}` });
  if (install)            active.push({ key: "install", label: `Install: ${INSTALL_LABEL[install] ?? install}` });
  if (fromDate)           active.push({ key: "from",    label: `From: ${fromDate}` });
  if (toDate)             active.push({ key: "to",      label: `To: ${toDate}` });
  if (showArchived)       active.push({ key: "show_archived", label: "Including archived" });
  if (refundedOnly)       active.push({ key: "refunded",      label: "Refunded only" });

  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
        Filters
      </span>
      {active.map((f) => (
        <Link
          key={f.key}
          href={buildHref({ [f.key]: undefined })}
          className="group inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white hover:bg-stone-800"
        >
          {f.label}
          <span aria-hidden className="text-stone-400 group-hover:text-white">×</span>
        </Link>
      ))}
      <Link
        href={buildHref({
          q: undefined, type: undefined, install: undefined,
          from: undefined, to: undefined,
          show_archived: undefined, refunded: undefined,
        })}
        className="text-xs font-medium text-stone-500 underline underline-offset-[3px] hover:text-stone-900"
      >
        Clear all
      </Link>
    </div>
  );
}
