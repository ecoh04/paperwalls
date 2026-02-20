import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaperWalls | Custom Wallpaper South Africa",
  description: "Design your custom wallpaper. Upload your image, enter dimensions, choose your style. Printed in South Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-stone-900 antialiased">
        <Header />
        <main className="flex-1">
          <CartProvider>{children}</CartProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
