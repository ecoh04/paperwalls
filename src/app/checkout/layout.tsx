import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | PaperWalls",
  description: "Complete your order. Secure payment in ZAR with Stitch Express.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
