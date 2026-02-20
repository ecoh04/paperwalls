import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "About us | PaperWalls",
  description: "PaperWalls prints custom wallpaper in South Africa. Your image, your dimensions.",
};

export default function AboutPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About us" }]} />
      <h1 className="text-3xl font-bold text-stone-900">About PaperWalls</h1>
      <div className="mt-8 max-w-2xl space-y-6 text-stone-600">
        <p>
          PaperWalls is a South African custom wallpaper company. We own a printing factory and 
          use industrial printers to turn your images into wallpaper—at your exact wall dimensions.
        </p>
        <p>
          You upload your design, tell us the size of your wall, choose a finish and how you want 
          it applied (DIY, DIY kit, or professional installer). We print, then ship or install 
          across South Africa. All prices are in ZAR.
        </p>
        <p>
          Our goal is to make custom wallpaper simple: no minimum order, clear pricing, and 
          support from design to delivery.
        </p>
      </div>
    </PageContainer>
  );
}
