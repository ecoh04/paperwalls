import { ConfiguratorLazy } from "@/components/configurator/ConfiguratorLazy";

export const metadata = {
  title: "Design your wallpaper | PaperWalls",
  description: "Custom wallpaper. Drop in any image, set your wall size, choose your finish.",
};

export default function ConfigPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Custom wallpaper</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Your image. Your wall.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Made-to-order. Yours in five days. Free delivery across South Africa.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <ConfiguratorLazy />
      </div>
    </main>
  );
}
