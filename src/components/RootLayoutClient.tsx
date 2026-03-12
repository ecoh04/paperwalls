"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isLanding = pathname === "/";

  if (isAdmin) {
    return <>{children}</>;
  }

  if (isLanding) {
    return (
      <CartProvider>
        {children}
      </CartProvider>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <CartProvider>{children}</CartProvider>
      </main>
      <Footer />
    </>
  );
}
