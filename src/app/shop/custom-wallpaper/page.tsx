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
        <div className="aspect-square rounded-lg bg-stone-200 flex items-center justify-center">
          <span className="text-stone-500">Your design preview</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Custom wallpaper</h1>
          <p className="mt-4 text-stone-600">
            Turn any image into wallpaper. Enter your wall dimensions, upload your file (photo, art, pattern), 
            and choose from matte, satin, textured, or premium fabric. We print to order in South Africa 
            and ship nationwide—or send an installer.
          </p>
          <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-stone-600">
            <li>Your image, your exact wall size</li>
            <li>Matte, satin, textured, or premium finish</li>
            <li>DIY, DIY kit, or professional installation</li>
            <li>Delivery across South Africa (ZAR)</li>
          </ul>
          <Link
            href="/config"
            className="mt-8 inline-flex rounded-full bg-stone-900 px-8 py-4 text-base font-medium text-white hover:bg-stone-800 transition-colors"
          >
            Design your wallpaper
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
