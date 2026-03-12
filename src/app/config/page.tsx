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
      <h1 className="text-3xl font-normal text-[#1A1714]">Design your wallpaper</h1>
      <p className="mt-2 pw-section-sub">
        Upload your image, enter your wall size in centimetres, and adjust the crop. Your price updates as you go.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(26,23,20,0.10)] bg-white px-4 py-3 text-[11px] sm:text-xs text-[#8A8175]">
        <span className="font-medium text-[#1A1714] mr-1 uppercase tracking-[0.14em]">Flow</span>
        <span>1. Upload image</span>
        <span className="h-1 w-1 rounded-full bg-[#C4622D]/60 inline-block" />
        <span>2. Wall size (cm)</span>
        <span className="h-1 w-1 rounded-full bg-[#C4622D]/60 inline-block" />
        <span>3. Crop on wall</span>
        <span className="h-1 w-1 rounded-full bg-[#C4622D]/60 inline-block" />
        <span>4. Finish &amp; installation</span>
        <span className="h-1 w-1 rounded-full bg-[#C4622D]/60 inline-block" />
        <span>5. Price &amp; add to cart</span>
      </div>
      <div className="mt-8">
        <Configurator />
      </div>
    </PageContainer>
  );
}
