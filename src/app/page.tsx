import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-[#F8F4EF] text-[#1A1714]">
      {/* Hero */}
      <section className="mx-auto grid min-h-[520px] max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:py-16">
        <div className="flex flex-col justify-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-md bg-[#F2E8E1] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#C4622D]">
            Custom wallpaper printing
          </div>
          <h1 className="text-4xl sm:text-5xl leading-tight">
            Your image.
            <br />
            <span className="italic text-[#C4622D]">Your walls.</span>
            <br />
            Flawlessly printed.
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-[#8A8175]">
            Upload any photo, pattern, or texture — we print it on premium substrates using commercial‑grade presses.
            Delivered cut‑to‑size, ready to hang.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/config" className="pw-btn-primary">
              Upload your design ↗
            </Link>
            <button
              type="button"
              className="text-sm text-[#8A8175] underline underline-offset-4 hover:text-[#1A1714]"
            >
              See how it works →
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-7 border-t border-[rgba(26,23,20,0.10)] pt-5 text-xs">
            <div>
              <p className="text-lg">72hr</p>
              <p className="uppercase tracking-[0.12em] text-[#8A8175]">Production time</p>
            </div>
            <div>
              <p className="text-lg">4</p>
              <p className="uppercase tracking-[0.12em] text-[#8A8175]">Substrate grades</p>
            </div>
            <div>
              <p className="text-lg">Any size</p>
              <p className="uppercase tracking-[0.12em] text-[#8A8175]">Cut to dimension</p>
            </div>
          </div>
        </div>

        {/* Configurator preview card */}
        <div className="flex items-center md:justify-end">
          <div className="pw-card w-full max-w-md p-6">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8175]">
              Live configurator preview
            </p>
            <div className="rounded-2xl border border-[rgba(26,23,20,0.10)] bg-[#E6DFD8] p-3">
              <div
                className="relative w-full rounded-lg bg-[#D4C9BE]"
                style={{ aspectRatio: "16 / 9" }}
              >
                <div className="absolute inset-[9%] rounded-md border-[3px] border-[#1A1714] shadow-[0_0_0_1px_rgba(26,23,20,0.25)] bg-[#F8F4EF]/80" />
              </div>
              <p className="mt-3 text-[11px] text-[#8A8175]">
                See exactly what lands on your wall before you add to cart.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (kept, but visually matches warm system) */}
      <section
        id="how-it-works"
        className="border-t border-[rgba(26,23,20,0.10)] bg-white px-4 py-16 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-normal text-[#1A1714] sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-[15px] text-[#8A8175]">
            No design experience needed. Just your image and your wall size.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E6DFD8] text-sm font-medium text-[#1A1714]">
                1
              </span>
              <h3 className="mt-4 text-sm font-medium text-[#1A1714]">Upload & size</h3>
              <p className="mt-2 text-sm text-[#8A8175]">
                Drop your image, enter your wall dimensions in cm, and see a live preview.
              </p>
            </div>
            <div className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E6DFD8] text-sm font-medium text-[#1A1714]">
                2
              </span>
              <h3 className="mt-4 text-sm font-medium text-[#1A1714]">Choose material</h3>
              <p className="mt-2 text-sm text-[#8A8175]">
                Pick from four substrates. Your price updates instantly as you go.
              </p>
            </div>
            <div className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E6DFD8] text-sm font-medium text-[#1A1714]">
                3
              </span>
              <h3 className="mt-4 text-sm font-medium text-[#1A1714]">We print & deliver</h3>
              <p className="mt-2 text-sm text-[#8A8175]">
                We print in South Africa and ship rolled, labelled by panel, ready to hang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="border-t border-[rgba(26,23,20,0.10)] bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-normal text-[#1A1714]">
            Ready to turn your wall into a feature?
          </h2>
          <p className="mt-3 text-[15px] text-[#8A8175]">
            No minimum order. Clear pricing in ZAR. Printed locally and delivered across South Africa.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/config" className="pw-btn-primary">
              Start designing
            </Link>
            <Link
              href="/shop/custom-wallpaper"
              className="pw-btn-outline"
            >
              Learn about materials
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
