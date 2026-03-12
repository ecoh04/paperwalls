import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Custom wallpaper | PaperWalls",
  description: "Design your custom wallpaper. Upload your image, enter dimensions, choose finish. Printed in South Africa.",
};

export default function CustomWallpaperPage() {
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          { label: "Custom wallpaper" },
        ]}
      />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square rounded-lg bg-stone-100 flex items-center justify-center border border-stone-200">
          <div className="w-[88%] rounded-xl border border-stone-200 bg-stone-100/80 p-4">
            <div className="relative w-full rounded-lg bg-stone-200/90" style={{ aspectRatio: "16 / 9" }}>
              <div className="absolute inset-[8%] rounded-md border-[3px] border-stone-800/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
            </div>
            <p className="mt-3 text-xs text-stone-600">
              Upload your own image and see exactly how it fits your wall.
            </p>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Custom wallpaper</h1>
          <p className="mt-4 text-stone-600">
            Turn any image into wall‑size wallpaper. Enter your wall size in centimetres, upload a photo, artwork,
            or pattern, and choose your finish. We print to order in South Africa and deliver nationwide.
          </p>
          <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-stone-600">
            <li>Your image, your exact wall size (no standard rolls)</li>
            <li>Matte, satin, textured, or premium fabric finish</li>
            <li>DIY, DIY kit, or professional installer option</li>
            <li>Printed locally, priced in ZAR, delivered across South Africa</li>
          </ul>
          <Link
            href="/config"
            className="mt-8 inline-flex rounded-full bg-stone-900 px-8 py-4 text-base font-medium text-white hover:bg-stone-800 transition-colors"
          >
            Start designing
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
