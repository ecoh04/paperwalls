"use client";

import { useState } from "react";

// Tiny copy-to-clipboard button. Used for shipping addresses and tracking
// numbers — saves the dispatcher from selecting and copying by hand when
// pasting into a courier waybill app.

type Props = {
  value:    string;
  label?:   string;     // default "Copy"
  small?:   boolean;
  className?: string;
};

export function CopyButton({ value, label = "Copy", small = false, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const sizeCls = small
    ? "px-2 py-0.5 text-xs"
    : "px-2.5 py-1 text-xs";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white font-medium text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 ${sizeCls} ${className}`}
    >
      {copied ? (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h4a2 2 0 002-2M8 5a2 2 0 012-2h4a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
