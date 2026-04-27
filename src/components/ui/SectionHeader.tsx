import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type SectionHeaderProps = {
  eyebrow?:    string;
  title:       ReactNode;
  body?:       ReactNode;
  align?:      "left" | "centre";
  /** Visually treat as the page H1 (only one per page). Default false renders an h2. */
  asH1?:       boolean;
  className?:  string;
  invert?:     boolean;
};

/**
 * Editorial section header: eyebrow + heading + optional body.
 * The heading is the only place we use display-serif type at large sizes.
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
  const alignment = align === "centre" ? "text-center mx-auto" : "text-left";
  const titleColor = invert ? "text-white" : "text-pw-ink";
  const bodyColor  = invert ? "text-white/65" : "text-pw-ink/70";

  const HeadingTag = asH1 ? "h1" : "h2";

  return (
    <div className={["max-w-3xl", alignment, className].join(" ").trim()}>
      {eyebrow && <Eyebrow variant={invert ? "muted" : "accent"} className={invert ? "text-pw-accent-mid" : ""}>{eyebrow}</Eyebrow>}
      <HeadingTag
        className={[
          "font-serif tracking-tight",
          asH1 ? "pw-display" : "pw-h2",
          titleColor,
          eyebrow ? "mt-4" : "",
        ].join(" ").trim()}
      >
        {title}
      </HeadingTag>
      {body && (
        <p className={["mt-5 pw-body-lg font-light leading-relaxed", bodyColor].join(" ").trim()}>
          {body}
        </p>
      )}
    </div>
  );
}
