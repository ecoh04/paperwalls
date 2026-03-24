import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CartContent } from "@/components/CartContent";
import { SocialProofStrip } from "@/components/SocialProofStrip";

export const metadata = {
  title: "Cart | PaperWalls",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Cart" }]} />
      <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">Shopping cart</h1>
      <p className="mt-2 text-base text-pw-ink/80">Review your order details, then proceed to secure checkout.</p>
      <SocialProofStrip className="mt-6" />
      <CartContent />
    </PageContainer>
  );
}
