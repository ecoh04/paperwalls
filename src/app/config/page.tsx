import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { Configurator } from "@/components/configurator/Configurator";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { ConversionCtaCard } from "@/components/ConversionCtaCard";
import { getVariant } from "@/lib/experiments";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

export const metadata = {
  title: "Design your wallpaper | PaperWalls",
  description: "Configure your custom wallpaper. Upload your image, set dimensions, choose your material and finish.",
};

export default function ConfigPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const variant = getVariant(searchParams);
  const heroTitle =
    variant === "speed" ? "Get your wallpaper price in under a minute" : "Design your wallpaper";
  const heroBody =
    variant === "speed"
      ? "Upload your image, enter dimensions, and compare materials with live pricing and quality checks."
      : "Upload any image, set your wall dimensions, choose your material — and get an instant price. Cut to your exact size, printed in Cape Town.";

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
        <ConversionPageIntro eyebrow="Configurator" title={heroTitle} description={heroBody} />
      </div>

      <SocialProofStrip className="mb-6" />

      <Configurator />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-6">
          <h2 className="font-sans text-lg font-semibold text-pw-ink">Before checkout, make sure you have:</h2>
          <ul className="mt-3 space-y-2 text-sm text-pw-ink/80">
            <li>• Exact wall width and height</li>
            <li>• Highest resolution version of your image</li>
            <li>• Preferred material and installation choice</li>
          </ul>
        </section>
        <ConversionCtaCard
          title="Need help choosing materials?"
          body="Compare Satin, Matte, and Linen with practical guidance before placing your order."
          ctaLabel="View materials guide"
          ctaHref="/materials"
        />
      </div>
    </PageContainer>
  );
}
