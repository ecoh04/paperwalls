import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CartContent } from "@/components/CartContent";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

export const metadata = {
  title: "Cart | PaperWalls",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Cart" }]} />
      <ConversionPageIntro
        eyebrow="Order"
        title="Shopping cart"
        description="Review your order details, then proceed to secure checkout."
      />
      <SocialProofStrip className="mt-6" />
      <CartContent />
    </PageContainer>
  );
}
