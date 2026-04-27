import type { ReactNode } from "react";

type Variant = "warning" | "error";

type ConfigAlertProps = {
  variant?:  Variant;
  title?:    string;
  children:  ReactNode;
  className?: string;
};

const VARIANTS: Record<Variant, { bg: string; border: string; iconColor: string; titleColor: string; bodyColor: string }> = {
  warning: {
    bg:         "bg-pw-accent-soft",
    border:     "border-pw-accent/25",
    iconColor:  "text-pw-accent",
    titleColor: "text-pw-ink",
    bodyColor:  "text-pw-ink/75",
  },
  error: {
    bg:         "bg-red-50",
    border:     "border-red-200",
    iconColor:  "text-red-500",
    titleColor: "text-red-800",
    bodyColor:  "text-red-700",
  },
};

export function ConfigAlert({ variant = "warning", title, children, className = "" }: ConfigAlertProps) {
  const v = VARIANTS[variant];
  return (
    <div className={["flex gap-3 rounded-pw border p-4", v.bg, v.border, className].join(" ").trim()}>
      <svg
        aria-hidden
        className={["mt-0.5 h-5 w-5 shrink-0", v.iconColor].join(" ")}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path
          strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className={["pw-small font-semibold", v.titleColor].join(" ")}>{title}</p>}
        <div className={["pw-small", v.bodyColor, title ? "mt-0.5" : ""].join(" ").trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}
