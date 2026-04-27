import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  /** Use the muted color instead of the accent. */
  variant?: "accent" | "muted";
};

/**
 * Small-caps label used above section headings. Uses the `.pw-overline`
 * design-system token — never override the size or letter-spacing here.
 */
export function Eyebrow({ children, className = "", variant = "accent" }: EyebrowProps) {
  const color = variant === "muted" ? "text-pw-muted" : "text-pw-accent";
  return (
    <p className={["pw-overline inline-block", color, className].join(" ").trim()}>
      {children}
    </p>
  );
}
