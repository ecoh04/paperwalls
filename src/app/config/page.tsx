import { Configurator } from "@/components/configurator/Configurator";

export const metadata = {
  title: "Design your wallpaper | PaperWalls",
  description: "Configure your custom wallpaper. Upload your image, set your wall size, choose your finish.",
};

export default function ConfigPage() {
  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">Design</p>
          <h1 className="pw-display mt-3 text-pw-ink sm:mt-4">
            Design your wallpaper.
          </h1>
          <p className="pw-body-lg mt-4 text-pw-ink/70 sm:mt-5">
            Tell us your wall size, drop in any image, choose your finish — we&rsquo;ll
            print it to fit and ship free across South Africa.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Configurator />
      </div>
    </main>
  );
}
