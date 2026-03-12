import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-[#F8F4EF]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="max-w-xl">
            <div className="pw-eyebrow mb-6">Custom wallpaper printing</div>
            <h1 className="text-4xl sm:text-5xl font-normal leading-tight text-[#1A1714]">
              Your image.<br />
              <span className="italic text-[#C4622D]">Your walls.</span><br />
              Flawlessly printed.
            </h1>
            <p className="mt-4 text-[15px] text-[#8A8175] leading-relaxed max-w-md">
              Upload any photo, pattern, or artwork. We print it on premium substrates, cut to your exact wall size,
              and deliver across South Africa.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/config" className="pw-btn-primary">
                Upload your design ↗
              </Link>
              <button
                type="button"
                className="text-sm text-[#8A8175] underline underline-offset-4 hover:text-[#1A1714]"
              >
                See how it works
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-8 border-t border-[rgba(26,23,20,0.10)] pt-6 text-xs">
              <div>
                <p className="text-lg text-[#1A1714]">72hr</p>
                <p className="uppercase tracking-[0.12em] text-[#8A8175]">Production time</p>
              </div>
              <div>
                <p className="text-lg text-[#1A1714]">4</p>
                <p className="uppercase tracking-[0.12em] text-[#8A8175]">Substrate options</p>
              </div>
              <div>
                <p className="text-lg text-[#1A1714]">Any size</p>
                <p className="uppercase tracking-[0.12em] text-[#8A8175]">Cut to dimension</p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-md flex-1">
            <div className="pw-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8A8175] mb-3">
                Live configurator preview
              </p>
              <div className="relative w-full rounded-xl border border-[rgba(26,23,20,0.15)] bg-[#E6DFD8] p-3">
                <div
                  className="relative w-full rounded-lg bg-[#D4C9BE]"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <div className="absolute inset-[9%] rounded-md border-[3px] border-[#1A1714] shadow-[0_0_0_1px_rgba(26,23,20,0.25)] bg-[#F8F4EF]/70" />
                </div>
                <p className="mt-3 text-[11px] text-[#8A8175]">
                  See exactly what lands on your wall before you add to cart.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-stone-200 bg-white px-4 py-16 sm:py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-lg font-semibold text-stone-700">
                1
              </span>
              <h3 className="mt-4 font-medium text-stone-900">Design</h3>
              <p className="mt-2 text-sm text-stone-600">
                Upload your image, enter your wall dimensions, and pick a finish. See the price live.
              </p>
            </div>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-lg font-semibold text-stone-700">
                2
              </span>
              <h3 className="mt-4 font-medium text-stone-900">We print</h3>
              <p className="mt-2 text-sm text-stone-600">
                We print your wallpaper at our factory in South Africa to your exact specs.
              </p>
            </div>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-lg font-semibold text-stone-700">
                3
              </span>
              <h3 className="mt-4 font-medium text-stone-900">Deliver & install</h3>
              <p className="mt-2 text-sm text-stone-600">
                We ship to you, or send a professional installer—your choice.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/config"
              className="text-stone-900 font-medium underline underline-offset-4 hover:no-underline"
            >
              Start designing →
            </Link>
          </div>
        </div>
      </section>

      {/* Shop / Featured */}
      <section className="border-t border-stone-200 bg-stone-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold text-stone-900">Shop</h2>
          <p className="mt-2 text-stone-600">
            Custom wallpaper made to your design and dimensions. More products can be added later.
          </p>
          <div className="mt-10">
            <Link
              href="/shop/custom-wallpaper"
              className="group block overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-stone-300 hover:shadow-md sm:flex"
            >
              <div className="aspect-[4/3] w-full flex-shrink-0 bg-stone-200 sm:aspect-square sm:w-80 flex items-center justify-center">
                <span className="text-sm text-stone-500">Custom wallpaper</span>
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <h3 className="text-xl font-semibold text-stone-900 group-hover:underline">
                  Custom wallpaper
                </h3>
                <p className="mt-2 text-stone-600">
                  Your image, your wall size. Choose finish and application. We print in South Africa and deliver nationwide.
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-stone-900 group-hover:underline">
                  Design yours →
                </span>
              </div>
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/shop" className="text-sm font-medium text-stone-600 hover:text-stone-900">
              View all products
            </Link>
          </div>
        </div>
      </section>

      {/* Why us / Trust */}
      <section className="border-t border-stone-200 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-stone-900">
            Why PaperWalls
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                <svg className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-stone-900">Printed in South Africa</h3>
              <p className="mt-2 text-sm text-stone-600">
                Our factory uses industrial printers. Your order is produced locally and shipped locally.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                <svg className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-stone-900">Clear pricing</h3>
              <p className="mt-2 text-sm text-stone-600">
                See the total cost as you design. Base price, finish, application, and shipping—all in ZAR.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                <svg className="h-6 w-6 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-stone-900">Nationwide delivery</h3>
              <p className="mt-2 text-sm text-stone-600">
                We ship to all provinces. Or choose our installer service and we send a professional to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-stone-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-stone-900">
            Ready to design your wall?
          </h2>
          <p className="mt-3 text-stone-600">
            No minimum order. Clear pricing in ZAR. Printed locally and delivered across South Africa.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/config"
              className="inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
            >
              Design your wallpaper
            </Link>
            <Link
              href="/shop"
              className="inline-flex rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Browse shop
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
