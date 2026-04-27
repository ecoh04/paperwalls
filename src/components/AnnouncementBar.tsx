"use client";

import { useEffect, useState } from "react";

// Highest-converting offers, ordered by hook strength. Kept short so they
// fit on a 375px screen without truncation. Auto-rotate every 4.5s; users
// with prefers-reduced-motion stay on the first (strongest) message.
const MESSAGES = [
  "Free SA delivery on every order",
  "Yours in 5 days. Free reprints, no questions.",
  "★★★★★ 4.9 from 847 reviews",
  "R150 off when you start with a sample pack",
];

const ROTATE_MS = 4500;

export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const id = window.setInterval(() => {
      setI((prev) => (prev + 1) % MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="bg-pw-accent text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="relative flex h-9 items-center justify-center overflow-hidden">
          {MESSAGES.map((m, idx) => (
            <p
              key={idx}
              aria-hidden={idx !== i}
              className={[
                "pw-small absolute font-medium tracking-tight whitespace-nowrap transition-all duration-500",
                idx === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none",
              ].join(" ")}
            >
              {m}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
