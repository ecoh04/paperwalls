"use client";

import Link from "next/link";

export function FocusedHeader() {
  return (
    <header className="sticky top-9 z-40 border-b border-pw-border bg-pw-bg/90 backdrop-blur supports-[backdrop-filter]:bg-pw-bg/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:h-16 sm:px-8 lg:px-12">
        <Link href="/" className="text-[19px] font-bold tracking-tight text-pw-ink sm:text-xl">
          paper<span className="text-pw-accent">walls</span>
        </Link>
        <Link href="/" className="pw-small text-pw-muted hover:text-pw-ink transition-colors">
          ← Exit
        </Link>
      </div>
    </header>
  );
}
