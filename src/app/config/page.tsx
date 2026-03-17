import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { Configurator } from "@/components/configurator/Configurator";

export const metadata = {
  title: "Design your wallpaper | PaperWalls",
  description: "Configure your custom wallpaper. Upload your image, set dimensions, choose your material and finish.",
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

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900">Design your wallpaper</h1>
        <p className="mt-2 text-base text-stone-500">
          Upload any image, set your wall dimensions, choose your material — and get an instant price.
          Cut to your exact size, printed in Cape Town.
        </p>
      </div>

      <Configurator />
    </PageContainer>
  );
}
