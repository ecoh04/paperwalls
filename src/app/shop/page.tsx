import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import Link from "next/link";

export const metadata = {
  title: "Shop | PaperWalls",
  description: "Custom wallpaper or sample pack. Made-to-order in Cape Town, free delivery across South Africa.",
};

const PRODUCTS = [
  {
    eyebrow: "Custom wallpaper",
    title:   "Your image. Your wall.",
    body:    "Upload anything. We print it onto a commercial-grade substrate, cut to your wall's exact dimensions, and ship it free across SA. Made to order in Cape Town.",
    href:    "/shop/custom-wallpaper",
    cta:     "Design yours",
    image:   "/images/product/pdp-01-hero.jpg",
    alt:     "Custom-printed wallpaper as a feature wall in a sunlit living room",
    price:   "From R410/m²",
  },
  {
    eyebrow: "Sample pack",
    title:   "Hold it before you commit.",
    body:    "An A5 swatch of every finish on the same commercial press that prints your wallpaper. Touch it, hold it to the wall, see how the light hits.",
    href:    "/samples",
    cta:     "Order samples",
    image:   "/images/product/pdp-14-sample.jpg",
    alt:     "PaperWalls sample pack flat-lay with three finish swatches and kraft envelope",
    price:   "R150 (credited to your order)",
  },
];

export default function ShopPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Shop</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Two ways in.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Start with a sample pack or go straight to custom wallpaper. Both
            ship free across South Africa.
          </p>
        </div>
      </header>

      <Section tone="bg" id="products">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col overflow-hidden rounded-pw-card border border-pw-stone bg-pw-surface transition-colors hover:border-pw-ink/40"
            >
              <ImagePlaceholder
                src={p.image}
                aspectRatio="4/3"
                sizes="(min-width: 768px) 50vw, 100vw"
                prompt={p.alt}
                className="rounded-none"
              />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <Eyebrow>{p.eyebrow}</Eyebrow>
                <h2 className="pw-h2 mt-3 text-pw-ink">{p.title}</h2>
                <p className="pw-body mt-3 text-pw-ink/70">{p.body}</p>
                <div className="mt-auto pt-5 flex items-baseline justify-between gap-4">
                  <span className="pw-small font-medium text-pw-ink">{p.price}</span>
                  <span className="pw-small font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 group-hover:decoration-pw-ink/60 transition-colors">
                    {p.cta} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="ink" id="closing" density="default">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Already know what you want?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Skip the browse.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Drop in your image, set your wall size, get a live price in under sixty seconds.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/config" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Design your wallpaper
            </Button>
            <span className="pw-small text-center text-white/45 lg:text-right">
              No payment until you approve the price.
            </span>
          </div>
        </div>
      </Section>
    </main>
  );
}
