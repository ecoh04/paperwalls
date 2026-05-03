"use client";

import { useEffect } from "react";
import Link from "next/link";

// Renders for any error thrown inside a route segment under app/.
// Next.js retries to render the segment when reset() is called, so the
// "Try again" path is genuinely useful — not just a polite gesture.
//
// Logs the error to the browser console so a customer who reports the
// page can paste the message back to us. The error message has the
// real cause; .digest is a server-side fingerprint Next.js generates.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[paperwalls] Page error:", error);
  }, [error]);

  return (
    <main className="bg-pw-bg min-h-screen flex items-center justify-center px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="pw-overline text-pw-muted">Something broke</p>
        <h1 className="pw-h2 mt-3 text-pw-ink sm:mt-4">
          Hit an error rendering this page.
        </h1>
        <p className="pw-body mt-4 text-pw-ink/70">
          Not your fault. We've logged it. Try again, or go back to the home
          page and we'll sort it out.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center rounded-pw bg-pw-ink px-6 pw-small font-semibold text-white hover:bg-pw-ink-soft transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-pw border border-pw-stone bg-pw-surface px-6 pw-small font-semibold text-pw-ink hover:bg-pw-bg transition-colors"
          >
            Back to home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 pw-overline text-pw-muted-light">
            Error ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
