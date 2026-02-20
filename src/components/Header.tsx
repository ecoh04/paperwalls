"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="text-xl font-semibold tracking-tight text-stone-900">
          PaperWalls
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            Home
          </Link>
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-0.5 rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Shop
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="invisible absolute left-0 top-full pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100">
              <div className="rounded-md border border-stone-200 bg-white py-1 shadow-lg">
                <Link
                  href="/shop"
                  className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  All products
                </Link>
                <Link
                  href="/shop/custom-wallpaper"
                  className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Custom wallpaper
                </Link>
              </div>
            </div>
          </div>
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            About
          </Link>
          <Link
            href="/faq"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            Contact
          </Link>
        </nav>

        {/* Right: CTA + Cart */}
        <div className="flex items-center gap-2">
          <Link
            href="/config"
            className="hidden rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 sm:inline-block"
          >
            Design your wallpaper
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded-md p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-sm font-medium">Cart</span>
          </Link>
          {/* Mobile menu button */}
          <button
            type="button"
            className="rounded-md p-2 text-stone-600 hover:bg-stone-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/shop/custom-wallpaper"
              className="block rounded-md px-3 py-2 pl-6 text-base text-stone-600 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Custom wallpaper
            </Link>
            <Link
              href="/about"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/faq"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-stone-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/config"
              className="mt-4 block rounded-full bg-stone-900 px-4 py-3 text-center text-base font-medium text-white hover:bg-stone-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Design your wallpaper
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
