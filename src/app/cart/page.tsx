import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { CartContent } from "@/components/CartContent";

export const metadata = {
  title: "Cart | PaperWalls",
  description: "Review your cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Cart" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Shopping cart</h1>
      <CartContent />
    </PageContainer>
  );
}
