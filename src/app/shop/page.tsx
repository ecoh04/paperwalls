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
      <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">Shop</h1>
      <p className="mt-3 max-w-3xl text-base sm:text-lg text-pw-ink/80 leading-relaxed">
        Start with custom wallpaper or order a sample pack first. Everything is printed to order in South Africa.
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
      <div className="mt-8 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="font-sans text-lg font-semibold text-pw-ink">Need help choosing?</p>
        <p className="mt-1 text-sm text-pw-ink/75">Use the configurator to compare materials, installation options, and live pricing before checkout.</p>
        <Link href="/config" className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft">
          Open configurator
        </Link>
      </div>
    </PageContainer>
  );
}
