"use client";

// Restrained 4-step progress indicator for the configurator. Sticky at the
// top of the viewport on mobile (below the focused header) so the buyer
// always knows where they are; inline at the top of the configurator on
// desktop where the persistent right-rail summary already provides
// orientation. Each step is clickable — smooth-scrolls to its section.
//
// Visual: numbered dot per step, thin connector line between dots, label
// + small value/status underneath. Done steps fill in with the brand
// accent. Pending steps are outlined. No bright bars, no cheery
// gradients — premium-quiet aligns with BRAND.md.

export type ProgressStep = {
  /** Matches the FlowSection id used for in-page scroll. */
  id:    string;
  label: string;
  done:  boolean;
  /** Tiny status / current-value caption shown beneath the label. */
  value: string;
};

export function ConfiguratorProgress({ steps }: { steps: ProgressStep[] }) {
  return (
    <nav
      aria-label="Configuration progress"
      className="
        sticky top-[5.75rem] sm:top-[6.25rem] z-30
        -mx-5 sm:-mx-8 lg:-mx-12
        border-b border-pw-stone bg-pw-bg/90 backdrop-blur
        supports-[backdrop-filter]:bg-pw-bg/80
        lg:relative lg:top-auto lg:mx-0 lg:border-none lg:bg-transparent lg:backdrop-blur-none
      "
    >
      <ol
        className="
          mx-auto flex max-w-3xl items-stretch gap-1 overflow-x-auto px-5 py-3
          sm:gap-2 sm:px-8 sm:py-4
          lg:mx-0 lg:max-w-none lg:gap-0 lg:px-0 lg:py-0
          lg:rounded-pw-card lg:border lg:border-pw-stone lg:bg-pw-surface lg:p-4
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
      >
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3"
            >
              <a
                href={`#${step.id}`}
                className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-pw px-1 py-1 -mx-1 transition-colors hover:bg-pw-stone/30"
                aria-current={step.done ? undefined : "step"}
              >
                <span
                  aria-hidden
                  className={[
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                    step.done
                      ? "bg-pw-accent text-white"
                      : "border border-pw-ink/25 bg-pw-surface text-pw-ink/70 group-hover:border-pw-ink/50",
                  ].join(" ")}
                >
                  {step.done ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="flex min-w-0 flex-col leading-tight">
                  <span
                    className={[
                      "pw-overline truncate transition-colors",
                      step.done ? "text-pw-ink" : "text-pw-muted",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                  <span
                    className={[
                      "truncate text-[11px] sm:text-xs transition-colors",
                      step.done ? "text-pw-ink/70" : "text-pw-muted-light",
                    ].join(" ")}
                  >
                    {step.value}
                  </span>
                </span>
              </a>

              {!isLast && (
                <span
                  aria-hidden
                  className={[
                    "hidden h-px flex-1 sm:block",
                    step.done ? "bg-pw-accent/40" : "bg-pw-stone",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
