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
      <h1 className="text-3xl font-bold text-stone-900">Shop</h1>
      <p className="mt-2 text-stone-600">
        Custom wallpaper made to your dimensions and design. More products can be added here later.
      </p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={product.href}
            className="group overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-stone-200 flex items-center justify-center">
              {product.imagePlaceholder ? (
                <span className="text-sm text-stone-500">Product image</span>
              ) : null}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-stone-900 group-hover:underline">{product.name}</h2>
              <p className="mt-1 text-sm text-stone-600 line-clamp-2">{product.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-stone-900 group-hover:underline">
                {product.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
