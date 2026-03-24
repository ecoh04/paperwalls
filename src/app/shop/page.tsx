import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

const products = [
  {
    slug: "custom-wallpaper",
    name: "Custom wallpaper",
    description: "Upload your image, set your wall dimensions, choose finish and application. We print in South Africa.",
    href: "/shop/custom-wallpaper",
    cta: "Design yours",
    imagePlaceholder: true,
  },
  // Add more products here later, e.g. pre-designed collections, samples, etc.
];

export const metadata = {
  title: "Shop | PaperWalls",
  description: "Browse custom wallpaper and more. Design your own or explore options.",
};

export default function ShopPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shop" }]} />
      <h1 className="text-3xl sm:text-4xl font-semibold text-pw-ink">Shop</h1>
      <p className="mt-3 text-pw-muted">
        Custom wallpaper made to your dimensions and design. More products can be added here later.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={product.href}
            className="group overflow-hidden rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface transition hover:border-pw-stone-dark hover:shadow-pw-sm"
          >
            <div className="aspect-[4/3] bg-pw-stone flex items-center justify-center">
              {product.imagePlaceholder ? (
                <span className="text-sm text-pw-muted">Product image</span>
              ) : null}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-pw-ink group-hover:underline">{product.name}</h2>
              <p className="mt-1 text-sm text-pw-muted line-clamp-2">{product.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-pw-ink group-hover:underline">
                {product.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
