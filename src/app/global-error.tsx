"use client";

import { useEffect } from "react";

// Last-line-of-defence error boundary. Renders only if the root layout
// itself crashes (e.g. provider error before <main>) — error.tsx handles
// every other case. Must be its own root because the layout is broken.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[paperwalls] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f7f4ed",
        color:      "#1a1814",
        minHeight:  "100vh",
        margin:     0,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:    "2rem",
      }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6, margin: 0 }}>
            Something broke
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 12, lineHeight: 1.15 }}>
            We can't load PaperWalls right now.
          </h1>
          <p style={{ marginTop: 16, opacity: 0.75, lineHeight: 1.5 }}>
            Try refreshing. If it keeps happening, email{" "}
            <a href="mailto:hello@paperwalls.co.za" style={{ color: "inherit", textDecoration: "underline" }}>
              hello@paperwalls.co.za
            </a>
            {" "}and we'll fix it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              height:    48,
              padding:   "0 28px",
              borderRadius: 8,
              border:    "none",
              background: "#1a1814",
              color:     "#fff",
              fontSize:  14,
              fontWeight: 600,
              cursor:    "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: 32, fontSize: 11, letterSpacing: "0.1em", opacity: 0.5 }}>
              Error ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
