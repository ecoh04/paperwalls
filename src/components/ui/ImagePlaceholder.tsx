type ImagePlaceholderProps = {
  /** Generation prompt — used both as alt text for the rendered image and as the
   *  visible label on the placeholder while the asset is still being generated. */
  prompt:        string;
  /** CSS aspect-ratio value, e.g. "16/10" or "3/4". */
  aspectRatio:   string;
  /** Once the asset is ready, set this to its public path (e.g. "/images/home/hero.jpg")
   *  and the component renders the image instead of the placeholder. */
  src?:          string;
  /** Optional caption shown below the image. */
  caption?:      string;
  className?:    string;
  /** Recommended generated dimensions, e.g. "1600×2000". */
  dimensions?:   string;
  /** Override the placeholder gradient with a custom one. */
  gradient?:     string;
};

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #B5917A 0%, #8C6F58 38%, #4F3D31 70%, #C4622D 100%)";

/**
 * Photography placeholder that becomes a real image once `src` is set.
 *
 * Until the asset is generated and dropped into /public, the placeholder shows
 * the prompt + recommended dimensions so it's obvious what still needs work.
 * The moment a file path is wired up, the component switches to rendering
 * the actual image with the prompt as the alt text.
 */
export function ImagePlaceholder({
  prompt,
  aspectRatio,
  src,
  caption,
  className     = "",
  dimensions,
  gradient      = DEFAULT_GRADIENT,
}: ImagePlaceholderProps) {
  return (
    <div className={["relative w-full overflow-hidden rounded-pw-card", className].join(" ").trim()}>
      <div className="relative w-full" style={{ aspectRatio }}>
        {src ? (
          // Real image. eslint-disable-next-line @next/next/no-img-element — keeping plain
          // <img> for now to avoid Next.js Image config; can swap to next/image later.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={prompt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: gradient }}
          >
            <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 text-white/85">
              <span className="pw-overline text-white/55">
                Pending photography{dimensions ? ` · ${dimensions}` : ""}
              </span>
              <p className="pw-small max-w-md text-white/80">{prompt}</p>
            </div>
          </div>
        )}
      </div>
      {caption && <p className="pw-small mt-2 text-pw-muted">{caption}</p>}
    </div>
  );
}
