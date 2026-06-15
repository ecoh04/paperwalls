"use client";

import dynamic from "next/dynamic";

// The Configurator is a large, fully-interactive client bundle (~the heaviest
// on the site). Load it client-side after the static page header paints, with
// a skeleton placeholder, so first paint + TTI on mobile aren't blocked by it.
const Configurator = dynamic(
  () => import("@/components/configurator/Configurator").then((m) => m.Configurator),
  {
    ssr: false,
    loading: () => (
      <div
        aria-label="Loading the designer"
        className="min-h-[60vh] w-full animate-pulse rounded-pw-card border border-pw-stone bg-pw-surface"
      />
    ),
  },
);

export function ConfiguratorLazy() {
  return <Configurator />;
}
