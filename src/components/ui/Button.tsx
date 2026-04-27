import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "ink-on-light" | "light-on-ink";
type ButtonSize    = "md" | "lg";

type CommonProps = {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  children:  ReactNode;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
  type?: never;
  onClick?: never;
  disabled?: never;
};

type ActionButtonProps = CommonProps & {
  href?: never;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

type ButtonProps = LinkButtonProps | ActionButtonProps;

const BASE_CLASSES = [
  "inline-flex items-center justify-center gap-2",
  "font-semibold tracking-tight",
  "rounded-pw transition-colors transition-shadow",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-pw-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-pw-bg",
  "disabled:opacity-40 disabled:cursor-not-allowed",
].join(" ");

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:        "bg-pw-ink text-white hover:bg-pw-ink-soft",
  secondary:      "border border-pw-ink/15 text-pw-ink hover:border-pw-ink/40 hover:bg-pw-ink/[0.03]",
  ghost:          "text-pw-muted hover:text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60",
  "ink-on-light": "bg-pw-ink text-white hover:bg-pw-ink-soft",
  "light-on-ink": "bg-white text-pw-ink hover:bg-pw-bg",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  // 44 px tap target — iOS minimum
  md: "text-sm h-11 px-5",
  // 56 px primary CTA. h-13 was a typo (Tailwind doesn't ship h-13) which is
  // why mobile buttons had been collapsing to text-height — actual bug.
  lg: "text-base h-14 px-8",
};

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", children, className = "" } = props;
  const cls = [BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className].join(" ").trim();

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props as ActionButtonProps;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
