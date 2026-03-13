"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-pw-border bg-pw-bg/90 backdrop-blur supports-[backdrop-filter]:bg-pw-bg/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="font-serif text-xl tracking-tight text-pw-ink">
          paper<span className="text-pw-accent">walls</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/shop/custom-wallpaper"
            className="rounded-pw px-3 py-2 text-sm font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
          >
            How it works
          </Link>
          <Link
            href="/faq"
            className="rounded-pw px-3 py-2 text-sm font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="rounded-pw px-3 py-2 text-sm font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
          >
            Contact
          </Link>
        </nav>

        {/* Right: CTA + Cart */}
        <div className="flex items-center gap-2">
          <Link
            href="/config"
            className="hidden rounded-pw bg-pw-ink px-4 py-2 text-sm font-medium text-white hover:bg-pw-ink-soft sm:inline-flex"
          >
            Design your wallpaper
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded-pw p-2 text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
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
            className="rounded-pw p-2 text-pw-muted hover:bg-pw-accent-soft md:hidden"
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
        <div className="border-t border-pw-stone bg-pw-surface md:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/shop/custom-wallpaper"
              className="block rounded-pw px-3 py-2 text-base font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="block rounded-pw px-3 py-2 text-base font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/faq"
              className="block rounded-pw px-3 py-2 text-base font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block rounded-pw px-3 py-2 text-base font-medium text-pw-muted hover:bg-pw-accent-soft hover:text-pw-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/config"
              className="mt-4 block rounded-pw bg-pw-ink px-4 py-3 text-center text-base font-medium text-white hover:bg-pw-ink-soft"
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
