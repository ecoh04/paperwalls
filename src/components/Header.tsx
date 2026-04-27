"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/materials",    label: "Materials" },
  { href: "/inspiration",  label: "Inspiration" },
  { href: "/samples",      label: "Samples" },
  { href: "/faq",          label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when the mobile menu is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-pw-stone bg-pw-bg/95 backdrop-blur supports-[backdrop-filter]:bg-pw-bg/85">
      {/*
        Mobile (md-): 3-column grid — hamburger left, logo CENTRED, cart right.
        Desktop (md+): flex layout — logo left, nav centre, cart cluster right.
      */}
      <div className="mx-auto h-14 max-w-7xl px-5 sm:h-16 sm:px-8 lg:px-12">
        {/* Mobile bar */}
        <div className="grid h-full grid-cols-3 items-center md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="-ml-2 flex h-10 w-10 items-center justify-center justify-self-start rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          <Link
            href="/"
            className="justify-self-center text-[19px] font-bold tracking-tight text-pw-ink"
            onClick={() => setOpen(false)}
          >
            paper<span className="text-pw-accent">walls</span>
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="-mr-2 flex h-10 w-10 items-center justify-center justify-self-end rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
        </div>

        {/* Desktop bar */}
        <div className="hidden h-full items-center justify-between gap-6 md:flex">
          <Link href="/" className="text-xl font-bold tracking-tight text-pw-ink">
            paper<span className="text-pw-accent">walls</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="pw-small rounded-pw px-3 py-2 font-medium text-pw-ink/70 hover:bg-pw-stone/50 hover:text-pw-ink transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/config"
              className="pw-small inline-flex h-10 items-center rounded-pw bg-pw-ink px-4 font-semibold text-white hover:bg-pw-ink-soft transition-colors"
            >
              Design yours
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="flex h-10 w-10 items-center justify-center rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto bg-pw-bg md:hidden">
          <nav className="flex flex-col px-5 py-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="pw-h3 border-b border-pw-stone py-5 text-pw-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/config"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-pw bg-pw-ink text-base font-semibold text-white hover:bg-pw-ink-soft transition-colors"
            >
              Design your wallpaper
            </Link>
            <Link
              href="/samples"
              onClick={() => setOpen(false)}
              className="pw-small mt-4 text-center font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink"
            >
              Order a sample pack first
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
