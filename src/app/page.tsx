import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-100 px-4 py-16 sm:py-24 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center md:flex-row md:text-left">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              Turn any photo into wall‑size wallpaper.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-stone-600">
              Upload your image, enter your wall size in cm, and see exactly how it will crop on your wall.
              Printed in South Africa with finishes for homes, offices, and shops.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-stone-600">
              <li>• Exact fit for your wall, no guessing</li>
              <li>• Clear pricing in ZAR as you design</li>
              <li>• Delivery nationwide, installer option available</li>
            </ul>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
              <Link
                href="/config"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-7 py-3 text-sm sm:text-base font-medium text-white hover:bg-stone-800 transition-colors w-full sm:w-auto"
              >
                Start with your image
              </Link>
              <Link
                href="/shop/custom-wallpaper"
                className="text-sm font-medium text-stone-700 underline underline-offset-4 hover:no-underline"
              >
                Learn more about custom wallpaper
              </Link>
            </div>
          </div>
          <div className="hidden h-full w-full max-w-md flex-1 items-center justify-center rounded-2xl border border-stone-200 bg-white/70 p-4 shadow-sm md:flex">
            <div className="w-full rounded-xl border border-stone-200 bg-stone-100/80 p-4">
              <div className="relative w-full rounded-lg bg-stone-200/90" style={{ aspectRatio: "16 / 9" }}>
                <div className="absolute inset-[8%] rounded-md border-[3px] border-stone-800/80 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
              </div>
              <p className="mt-3 text-xs text-stone-600">
                Live preview shows exactly what will be printed on your wall.
              </p>
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
