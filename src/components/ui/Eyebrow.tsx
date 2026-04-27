import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  /** Use the muted color instead of the accent. */
  variant?: "accent" | "muted";
};

/**
 * Small-caps label used above section headings.
 * Pure typography token — no padding, no background.
 */
export function Eyebrow({ children, className = "", variant = "accent" }: EyebrowProps) {
  const color = variant === "muted" ? "text-pw-muted" : "text-pw-accent";
  return (
    <p
      className={[
        "inline-block text-[11px] font-medium uppercase tracking-[0.16em]",
        color,
        className,
      ].join(" ").trim()}
    >
      {children}
    </p>
  );
}
