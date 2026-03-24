import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { getVariant } from "@/lib/experiments";

export const metadata = {
  title: "Custom wallpaper | PaperWalls",
  description: "Design your custom wallpaper. Upload your image, enter dimensions, choose finish. Printed in South Africa.",
};

export default function CustomWallpaperPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const variant = getVariant(searchParams);
  const title = variant === "speed" ? "Turn your image into wallpaper fast" : "Custom wallpaper";

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          { label: "Custom wallpaper" },
        ]}
      />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square rounded-pw-card bg-pw-bg flex items-center justify-center border border-[rgba(26,23,20,0.1)]">
          <div className="w-[88%] rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-4">
            <div className="relative w-full rounded-pw bg-pw-stone/90" style={{ aspectRatio: "16 / 9" }}>
              <div className="absolute inset-[8%] rounded-pw border-[3px] border-pw-ink/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
            </div>
            <p className="mt-3 text-xs text-pw-muted">
              Upload your own image and see exactly how it fits your wall.
            </p>
          </div>
        </div>
        <div>
          <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">{title}</h1>
          <p className="mt-4 text-base sm:text-lg text-pw-ink/80 leading-relaxed">
            Turn any image into wall‑size wallpaper. Enter your wall size in centimetres, upload a photo, artwork,
            or pattern, and choose your finish. We print to order in South Africa and deliver nationwide.
          </p>
          <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-pw-ink/80">
            <li>Your image, your exact wall size (no standard rolls)</li>
            <li>Traditional or Peel & Stick wallpaper types</li>
            <li>Satin, Matte, or Linen material options</li>
            <li>DIY (optional kit) or Pro installer option</li>
            <li>Printed locally, priced in ZAR, delivered across South Africa</li>
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <p className="rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-bg px-3 py-2 text-sm text-pw-ink/80">72-hour production</p>
            <p className="rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-bg px-3 py-2 text-sm text-pw-ink/80">Free shipping nationwide</p>
            <p className="rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-bg px-3 py-2 text-sm text-pw-ink/80">Live quality checks</p>
          </div>
          <Link
            href="/config"
            className="mt-8 inline-flex rounded-pw bg-pw-ink px-8 py-4 text-base font-medium text-white hover:bg-pw-ink-soft transition-colors"
          >
            Start designing
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
