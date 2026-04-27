import type { ReactNode } from "react";

type SectionProps = {
  children:   ReactNode;
  className?: string;
  /** Background colour. `bg` = warm off-white, `surface` = white, `ink` = dark, `stone` = muted neutral. */
  tone?:      "bg" | "surface" | "ink" | "stone";
  /** Tighter vertical padding for thin transitional sections. */
  density?:   "default" | "tight";
  id?:        string;
};

/**
 * Standard page section: full-bleed background, max-width inner container,
 * consistent vertical rhythm. Use this for every section on every page.
 */
export function Section({ children, className = "", tone = "bg", density = "default", id }: SectionProps) {
  const bg = {
    bg:      "bg-pw-bg",
    surface: "bg-pw-surface",
    ink:     "bg-pw-ink text-white",
    stone:   "bg-pw-stone",
  }[tone];

  const padding = density === "tight"
    ? "py-10 sm:py-14"
    : "py-20 sm:py-28 lg:py-32";

  return (
    <section id={id} className={[bg, padding, className].join(" ").trim()}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {children}
      </div>
    </section>
  );
}
