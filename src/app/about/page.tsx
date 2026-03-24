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
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-accent">Our story</p>
        <h1 className="mt-3 font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">About PaperWalls</h1>
        <p className="mt-4 text-base sm:text-lg text-pw-ink/80 leading-relaxed">
          We make custom wallpaper simple: your image, your dimensions, printed locally and delivered nationwide.
        </p>
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-pw-ink/80 leading-relaxed">
        <p>
          PaperWalls is a South African custom wallpaper company. We use commercial-grade print equipment
          to turn your photos, art, and patterns into wallpaper cut to your exact wall size.
        </p>
        <p>
          You upload your design, enter your dimensions, choose your wallpaper type and material,
          then decide between DIY or a pro installer. We print to order in Cape Town and ship across
          South Africa.
        </p>
        <p>
          Our goal is premium print quality with a clear, low-friction ordering experience:
          upfront pricing, helpful quality guidance, and reliable support from upload to install.
        </p>
      </div>
    </PageContainer>
  );
}
