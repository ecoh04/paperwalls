// Tiny visual identifier for an order row. Customer's print file for
// wallpaper orders, brand sample-pack image for sample orders. Lazy-loaded
// so a long list doesn't hammer storage. Falls back to a finish swatch
// icon if the image fails (e.g. legacy order without a saved file).

type Props = {
  productType: string | null | undefined;
  /** Pre-signed URL of the customer's image, when available. */
  imageUrl?:   string;
  size?:       "sm" | "md";
};

export function OrderThumbnail({ productType, imageUrl, size = "sm" }: Props) {
  const dim = size === "sm" ? 40 : 64;
  const cls = size === "sm" ? "h-10 w-10" : "h-16 w-16";

  if (productType === "sample_pack") {
    // Static sample-pack thumbnail — same flat-lay we use on the success
    // page. No signed URL round-trip.
    return (
      <span className={`relative inline-block overflow-hidden rounded-md bg-sky-50 ${cls} shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/product/pdp-14-sample.jpg"
          alt="Sample pack"
          width={dim}
          height={dim}
          loading="lazy"
          className={`${cls} object-cover`}
        />
      </span>
    );
  }

  if (imageUrl) {
    return (
      <span className={`relative inline-block overflow-hidden rounded-md bg-stone-100 ring-1 ring-stone-200 ${cls} shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Order print preview"
          width={dim}
          height={dim}
          loading="lazy"
          className={`${cls} object-cover`}
        />
      </span>
    );
  }

  // Defensive fallback: wallpaper order with no image. Shouldn't happen
  // post-checkout but renders an unobtrusive placeholder if it does.
  return (
    <span className={`inline-flex items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-200 ${cls} text-amber-800 shrink-0`}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6M4 6l2-3h12l2 3" />
      </svg>
    </span>
  );
}
