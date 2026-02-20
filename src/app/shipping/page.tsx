import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Shipping & delivery | PaperWalls",
  description: "How we ship your custom wallpaper across South Africa.",
};

export default function ShippingPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shipping & delivery" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Shipping & delivery</h1>
      <div className="mt-8 max-w-2xl space-y-6 text-stone-600">
        <p>
          We deliver across South Africa. Shipping is a flat rate by zone: Gauteng (R150), 
          Western Cape and KwaZulu-Natal (R200), other provinces (R250). The exact amount is 
          shown at checkout based on your address.
        </p>
        <p>
          Orders are printed to order, so please allow time for production before dispatch. 
          We’ll confirm once your order has shipped. If you’ve chosen our installer service, 
          we’ll contact you to schedule the installation.
        </p>
      </div>
    </PageContainer>
  );
}
