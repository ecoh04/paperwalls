"use client";

import Link from "next/link";

export function FocusedHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-pw-border bg-pw-bg/90 backdrop-blur supports-[backdrop-filter]:bg-pw-bg/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-xl tracking-tight text-pw-ink">
          paper<span className="text-pw-accent">walls</span>
        </Link>
        <Link href="/" className="text-sm text-pw-muted hover:text-pw-ink">
          ← Save & exit
        </Link>
      </div>
    </header>
  );
}
