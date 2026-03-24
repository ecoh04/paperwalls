"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FocusedHeader } from "@/components/FocusedHeader";
import { CartProvider } from "@/contexts/CartContext";
import { TrustStrip } from "@/components/TrustStrip";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isFocused = pathname === "/config";
  const isCheckoutFlow = pathname?.startsWith("/cart") || pathname?.startsWith("/checkout");

  if (isAdmin) {
    return <>{children}</>;
  }

  if (isFocused) {
    return (
      <CartProvider>
        <FocusedHeader />
        <TrustStrip />
        <main className="flex-1">{children}</main>
      </CartProvider>
    );
  }

  if (isCheckoutFlow) {
    return (
      <CartProvider>
        <FocusedHeader />
        <TrustStrip />
        <main className="flex-1">{children}</main>
        <Footer />
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <Header />
      <TrustStrip />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
