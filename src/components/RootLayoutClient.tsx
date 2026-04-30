"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FocusedHeader } from "@/components/FocusedHeader";
import { CartProvider } from "@/contexts/CartContext";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CartDrawer } from "@/components/CartDrawer";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { MetaPixel } from "@/components/MetaPixel";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin    = pathname?.startsWith("/admin") ?? false;
  const isFocused  = pathname === "/config" || pathname?.startsWith("/config/") === true;
  const isCart     = pathname?.startsWith("/cart") ?? false;
  const isCheckout = pathname?.startsWith("/checkout") ?? false;

  // Mount analytics + Meta Pixel on every customer-facing route. /admin is
  // excluded so the operator's own clicks don't pollute funnel data or Pixel
  // events. MetaPixel is a no-op when NEXT_PUBLIC_META_PIXEL_ID isn't set,
  // so dev/preview environments stay silent.
  const customerObservability = isAdmin ? null : (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <MetaPixel />
    </>
  );

  if (isAdmin) {
    return <>{children}</>;
  }

  if (isFocused) {
    return (
      <CartProvider>
        {customerObservability}
        <AnnouncementBar />
        <FocusedHeader />
        <main className="flex-1">{children}</main>
        <CartDrawer />
      </CartProvider>
    );
  }

  // /checkout + /checkout/success: zero-friction tunnel. No footer, no email
  // capture, no nav. Trust + reassurance come from in-page conversion blocks.
  if (isCheckout) {
    return (
      <CartProvider>
        {customerObservability}
        <AnnouncementBar />
        <FocusedHeader />
        <main className="flex-1">{children}</main>
        <CartDrawer />
      </CartProvider>
    );
  }

  // /cart: keep the footer (buyer can still browse before committing).
  if (isCart) {
    return (
      <CartProvider>
        {customerObservability}
        <AnnouncementBar />
        <FocusedHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </CartProvider>
    );
  }

  // Default marketing layout. AnnouncementBar sits above the sticky header so
  // it scrolls away on long pages but is the first thing every cold visitor sees.
  return (
    <CartProvider>
      {customerObservability}
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
