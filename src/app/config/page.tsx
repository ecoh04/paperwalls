import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { Configurator } from "@/components/configurator/Configurator";
import { ConversionCtaCard } from "@/components/ConversionCtaCard";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

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
        <ConversionPageIntro
          eyebrow="Design"
          title="Design your wallpaper"
          description="Tell us your wall size, drop in any image, choose your finish — we'll print it to fit and ship free across South Africa."
        />
      </div>

      <Configurator />

      <div className="mt-10">
        <ConversionCtaCard
          title="Not sure which material?"
          body="Compare Satin, Matte, and Linen with practical guidance, or order an A5 sample pack of all three."
          ctaLabel="See materials guide"
          ctaHref="/materials"
        />
      </div>
    </PageContainer>
  );
}
