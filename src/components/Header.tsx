"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/materials",    label: "Materials" },
  { href: "/inspiration",  label: "Inspiration" },
  { href: "/samples",      label: "Samples" },
  { href: "/faq",          label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { items, openCart } = useCart();
  const cartCount = items.length;

  // Lock body scroll while the mobile menu is open. Capture the previous
  // value so we don't accidentally clear a lock the cart drawer had set.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-9 z-40 border-b border-pw-stone bg-pw-bg/95 backdrop-blur supports-[backdrop-filter]:bg-pw-bg/85">
        <div className="mx-auto h-14 max-w-7xl px-5 sm:h-16 sm:px-8 lg:px-12">
          {/* Mobile bar — hamburger left, logo centred, cart right */}
          <div className="grid h-full grid-cols-3 items-center md:hidden">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="-ml-2 flex h-11 w-11 items-center justify-center justify-self-start rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
            >
              <svg className="pointer-events-none h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>

            <Link
              href="/"
              className="justify-self-center text-[19px] font-bold tracking-tight text-pw-ink"
              onClick={() => setOpen(false)}
            >
              paper<span className="text-pw-accent">walls</span>
            </Link>

            <button
              type="button"
              onClick={() => { setOpen(false); openCart(); }}
              aria-label={`Cart (${cartCount} item${cartCount === 1 ? "" : "s"})`}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center justify-self-end rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
            >
              <svg className="pointer-events-none h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span
                  aria-hidden
                  className="pw-overline absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pw-accent px-1 text-white"
                >
                  {cartCount}
                </span>
              )}
            </button>
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
              <button
                type="button"
                onClick={openCart}
                aria-label={`Cart (${cartCount} item${cartCount === 1 ? "" : "s"})`}
                className="relative flex h-10 w-10 items-center justify-center rounded-pw text-pw-ink hover:bg-pw-stone/40 transition-colors"
              >
                <svg className="pointer-events-none h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span
                    aria-hidden
                    className="pw-overline absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pw-accent px-1 text-white"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu — rendered as a sibling of <header> so the sticky+backdrop
          parent's stacking context can never trap it. iOS Safari is known to
          mis-handle position:fixed children of sticky+backdrop-blur elements. */}
      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Site navigation"
          className="fixed inset-x-0 top-[5.75rem] bottom-0 z-[60] overflow-y-auto bg-pw-bg md:hidden"
        >
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
    </>
  );
}
