import Link from "next/link";
import type { OrderStatus } from "@/types/order";

// Shopify-style status tab bar. Each tab is a real <Link> with the
// appropriate ?status= URL so back/forward + share-as-link work natively.
// The selected tab is rendered with a dark bottom-border accent and bold
// label; others are muted.

type Props = {
  current:    OrderStatus | null;
  counts:     Record<string, number>;
  buildHref:  (overrides: { status?: string }) => string;
};

const TABS: { value: OrderStatus | null; label: string }[] = [
  { value: null,            label: "All" },
  { value: "pending",       label: "Awaiting payment" },
  { value: "new",           label: "New" },
  { value: "in_production", label: "In production" },
  { value: "shipped",       label: "Shipped" },
  { value: "delivered",     label: "Delivered" },
  { value: "cancelled",     label: "Cancelled" },
];

export function OrdersStatusTabs({ current, counts, buildHref }: Props) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="border-b border-stone-200">
      <nav
        className="-mb-px flex gap-6 overflow-x-auto"
        aria-label="Order status"
      >
        {TABS.map((tab) => {
          const active = tab.value === current;
          const count  = tab.value === null ? total : (counts[tab.value] ?? 0);
          return (
            <Link
              key={tab.label}
              href={buildHref({ status: tab.value ?? undefined })}
              scroll={false}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm transition-colors",
                active
                  ? "border-stone-900 font-semibold text-stone-900"
                  : "border-transparent font-medium text-stone-500 hover:border-stone-300 hover:text-stone-800",
              ].join(" ")}
            >
              <span>{tab.label}</span>
              <span
                className={[
                  "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
                  active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600",
                ].join(" ")}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
