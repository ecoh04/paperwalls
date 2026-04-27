"use client";

import { useState } from "react";

export function EmailCaptureFooter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }
      setState("success");
      setEmail("");
    } catch {
      setState("error");
      setErrorMessage("Network error. Try again in a moment.");
    }
  };

  return (
    <div className="rounded-pw-card border border-pw-stone bg-pw-surface p-6 sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-7">
          <p className="pw-overline text-pw-accent">Notes from our press</p>
          <h2 className="pw-h3 mt-3 text-pw-ink">
            Quiet emails, real value.
          </h2>
          <p className="pw-body mt-3 max-w-xl text-pw-ink/70">
            New finishes, install tricks, the occasional discount. No noise, no
            sharing, unsubscribe anytime.
          </p>
        </div>

        <div className="lg:col-span-5">
          {state === "success" ? (
            <div className="flex items-start gap-3 rounded-pw border border-pw-accent/25 bg-pw-accent-soft p-4">
              <svg
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 text-pw-accent"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="pw-small font-semibold text-pw-ink">You&rsquo;re on the list.</p>
                <p className="pw-small mt-0.5 text-pw-ink/70">
                  First note lands when we add a new finish or release a small batch.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <input
                  id="footer-email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full rounded-pw border border-pw-stone bg-pw-bg px-4 py-3.5 pw-body text-pw-ink placeholder:text-pw-muted-light transition-colors focus:border-pw-ink focus:bg-pw-surface focus:outline-none focus:ring-2 focus:ring-pw-ink/10"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-pw bg-pw-ink px-6 pw-body font-semibold text-white transition-colors hover:bg-pw-ink-soft disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:py-3.5"
                >
                  {state === "loading" ? "Adding…" : "Subscribe"}
                </button>
              </div>
              {state === "error" && errorMessage && (
                <p className="pw-small text-red-600">{errorMessage}</p>
              )}
              <p className="pw-small text-pw-muted-light">
                We don&rsquo;t share your email. Unsubscribe in one click.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
