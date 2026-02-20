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
          { href: "/shop", label: "Shop" },
          { href: "/shop/custom-wallpaper", label: "Custom wallpaper" },
          { label: "Design" },
        ]}
      />
      <h1 className="text-3xl font-bold text-stone-900">Design your wallpaper</h1>
      <p className="mt-2 text-stone-600">
        Follow the steps below. Your price updates as you go. Add to cart when you’re ready.
      </p>
      <div className="mt-10">
        <Configurator />
      </div>
    </PageContainer>
  );
}
