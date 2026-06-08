import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | PaperWalls",
  description: "Complete your order. Secure card and EFT payment in ZAR with PayFast.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
