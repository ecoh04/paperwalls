import { CartContent } from "@/components/CartContent";

export const metadata = {
  title: "Cart | PaperWalls",
  description: "Review your order, then continue to secure checkout.",
};

export default function CartPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Order</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">Your cart.</h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Review your order. Free delivery, no payment until you approve the price.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <CartContent />
      </div>
    </main>
  );
}
