import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type SectionHeaderProps = {
  eyebrow?:    string;
  title:       ReactNode;
  body?:       ReactNode;
  align?:      "left" | "centre";
  /** Render as the page H1. Same visual size as H2 — hierarchy is semantic only. */
  asH1?:       boolean;
  className?:  string;
  invert?:     boolean;
};

/**
 * Section header: eyebrow + heading + optional body. One typographic voice for
 * every page section. Use `asH1` only on the page's primary heading; the size
 * is the same as H2 so visual hierarchy stays calm — only the hero uses
 * `.pw-display`.
 */
export function SectionHeader({
  eyebrow,
  title,
  body,
  align    = "left",
  asH1     = false,
  className = "",
  invert   = false,
}: SectionHeaderProps) {
  const alignment  = align === "centre" ? "text-center mx-auto" : "text-left";
  const titleColor = invert ? "text-white" : "text-pw-ink";
  const bodyColor  = invert ? "text-white/65" : "text-pw-ink/70";

  const HeadingTag = asH1 ? "h1" : "h2";

  return (
    <div className={["max-w-3xl", alignment, className].join(" ").trim()}>
      {eyebrow && (
        <Eyebrow variant={invert ? "muted" : "accent"} className={invert ? "text-pw-accent-mid" : ""}>
          {eyebrow}
        </Eyebrow>
      )}
      <HeadingTag
        className={[
          "pw-h2",
          titleColor,
          eyebrow ? "mt-4" : "",
        ].join(" ").trim()}
      >
        {title}
      </HeadingTag>
      {body && (
        <p className={["pw-body-lg mt-4", bodyColor].join(" ").trim()}>
          {body}
        </p>
      )}
    </div>
  );
}
