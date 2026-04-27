type ImagePlaceholderProps = {
  /** Generation prompt, shown in dev so the team knows what's needed here. */
  prompt:        string;
  /** CSS aspect-ratio value, e.g. "16/10" or "3/4". */
  aspectRatio:   string;
  /** Optional caption shown below the placeholder area. */
  caption?:      string;
  className?:    string;
  /** Recommended generated dimensions, e.g. "2400×1500". */
  dimensions?:   string;
  /** Override the placeholder gradient with a custom one. */
  gradient?:     string;
};

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #B5917A 0%, #8C6F58 38%, #4F3D31 70%, #C4622D 100%)";

/**
 * Photography placeholder. Shows a soft warm gradient with the generation
 * prompt + recommended dimensions so the team can see at a glance what
 * imagery still needs to be created. Replace with `<Image>` once the asset
 * is ready.
 */
export function ImagePlaceholder({
  prompt,
  aspectRatio,
  caption,
  className     = "",
  dimensions,
  gradient      = DEFAULT_GRADIENT,
}: ImagePlaceholderProps) {
  return (
    <div className={["relative w-full overflow-hidden rounded-pw-card", className].join(" ").trim()}>
      <div
        className="relative w-full"
        style={{ aspectRatio, background: gradient }}
      >
        <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 text-white/85">
          <span className="pw-overline text-white/55">
            Pending photography{dimensions ? ` · ${dimensions}` : ""}
          </span>
          <p className="pw-small max-w-md text-white/80">
            {prompt}
          </p>
        </div>
      </div>
      {caption && <p className="mt-2 text-xs text-pw-muted">{caption}</p>}
    </div>
  );
}
