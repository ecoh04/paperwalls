import type { Metadata } from "next";
import "./globals.css";

const SITE_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.paperwalls.co.za").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  "PaperWalls | Custom Wallpaper South Africa",
    template: "%s | PaperWalls",
  },
  description:
    "Design your custom wallpaper. Upload your image, enter dimensions, choose your style. Printed in South Africa.",
  applicationName: "PaperWalls",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type:        "website",
    locale:      "en_ZA",
    siteName:    "PaperWalls",
    url:         SITE_URL,
    title:       "PaperWalls | Custom Wallpaper South Africa",
    description: "Design your custom wallpaper. Upload your image, enter dimensions, choose your style. Printed in South Africa.",
    images: [
      {
        url:    "/images/product/pdp-01-hero.jpg",
        width:  1200,
        height: 630,
        alt:    "PaperWalls custom wallpaper",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "PaperWalls | Custom Wallpaper South Africa",
    description: "Design your custom wallpaper. Upload your image, enter dimensions, choose your style. Printed in South Africa.",
    images:      ["/images/product/pdp-01-hero.jpg"],
  },
  robots: {
    index:    true,
    follow:   true,
    nocache:  false,
    googleBot: {
      index:           true,
      follow:          true,
      "max-image-preview": "large",
      "max-snippet":      -1,
      "max-video-preview": -1,
    },
  },
};

import { RootLayoutClient } from "@/components/RootLayoutClient";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        {/* Preconnect to PayFast so the redirect-to-checkout navigation feels
            instant (DNS/TLS already warmed). Preload the two hot font weights
            (400 body, 900 headings) — same-origin woff2, hoisted to <head>. */}
        <link rel="preconnect" href="https://www.payfast.co.za" />
        <link rel="preload" href="/fonts/satoshi-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/satoshi-900.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Organization structured data for Google (rich results / knowledge panel). */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PaperWalls",
              url: SITE_URL,
              logo: `${SITE_URL}/logo.png`,
              description: "Custom printed wallpaper, made to order in Cape Town, South Africa.",
              email: "hello@paperwalls.co.za",
              areaServed: "ZA",
            }),
          }}
        />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
