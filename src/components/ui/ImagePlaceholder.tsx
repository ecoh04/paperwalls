import Image from "next/image";

type ImagePlaceholderProps = {
  /** Generation prompt — alt text on the rendered image, label on the placeholder. */
  prompt:           string;
  /** CSS aspect-ratio value, e.g. "16/10" or "3/4". */
  aspectRatio:      string;
  /** Public path once the asset is ready, e.g. "/images/home/hero.jpg". */
  src?:             string;
  caption?:         string;
  /** Classes for the OUTER wrapper. */
  className?:       string;
  /** Classes for the INNER aspect element. Use `sm:!aspect-square` to override
   *  the base aspect at a breakpoint — `!` is required because aspect is inline. */
  aspectClassName?: string;
  dimensions?:      string;
  gradient?:        string;
  /** Mark above-the-fold images so Next preloads them and skips lazy-loading. */
  priority?:        boolean;
  /** Responsive `sizes` hint so the browser picks the right asset variant. */
  sizes?:           string;
};

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #B5917A 0%, #8C6F58 38%, #4F3D31 70%, #C4622D 100%)";

const DEFAULT_SIZES = "(min-width: 1024px) 50vw, 100vw";

export function ImagePlaceholder({
  prompt,
  aspectRatio,
  src,
  caption,
  className       = "",
  aspectClassName = "",
  dimensions,
  gradient        = DEFAULT_GRADIENT,
  priority        = false,
  sizes           = DEFAULT_SIZES,
}: ImagePlaceholderProps) {
  return (
    <div className={["relative w-full overflow-hidden rounded-pw-card", className].join(" ").trim()}>
      <div
        className={["relative w-full", aspectClassName].join(" ").trim()}
        style={{ aspectRatio }}
      >
        {src ? (
          <Image
            src={src}
            alt={prompt}
            fill
            className="object-cover"
            sizes={sizes}
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: gradient }}>
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
