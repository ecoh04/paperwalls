import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { Configurator } from "@/components/configurator/Configurator";

export const metadata = {
  title: "Design your wallpaper | PaperWalls",
  description: "Configure your custom wallpaper. Enter dimensions, upload your image, choose finish and application.",
};

export default function ConfigPage() {
  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop/custom-wallpaper", label: "Custom wallpaper" },
          { label: "Design" },
        ]}
      />
      <h1 className="text-3xl font-bold text-stone-900">Design your wallpaper</h1>
      <p className="mt-2 text-stone-600">
        Upload your image, set your wall size in cm, and adjust the crop. Your price updates automatically.
      </p>
      <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-xs sm:text-sm text-stone-700 flex flex-wrap items-center gap-3">
        <span className="font-semibold text-stone-900 mr-1">Steps:</span>
        <span>1. Upload image</span>
        <span className="h-1 w-1 rounded-full bg-stone-400 inline-block" />
        <span>2. Wall size (cm)</span>
        <span className="h-1 w-1 rounded-full bg-stone-400 inline-block" />
        <span>3. Crop on wall</span>
        <span className="h-1 w-1 rounded-full bg-stone-400 inline-block" />
        <span>4. Finish & installation</span>
        <span className="h-1 w-1 rounded-full bg-stone-400 inline-block" />
        <span>5. Price & add to cart</span>
      </div>
      <div className="mt-8">
        <Configurator />
      </div>
    </PageContainer>
  );
}
