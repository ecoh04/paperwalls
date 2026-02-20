import Link from "next/link";

export type BreadcrumbItem = { href?: string; label: string };

type BreadcrumbsProps = { items: BreadcrumbItem[] };

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-x-2">
            {i > 0 && <span className="text-stone-400">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-stone-900">
                {item.label}
              </Link>
            ) : (
              <span className="text-stone-700 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
