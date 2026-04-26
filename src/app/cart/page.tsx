import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CartContent } from "@/components/CartContent";
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
        title="Your cart"
        description="Review your order details, then continue to secure checkout."
      />
      <CartContent />
    </PageContainer>
  );
}
