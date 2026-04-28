// Visual type indicator. Wallpaper orders need print + dispatch; sample-pack
// orders only need pick + pack + dispatch. Two very different operational
// flows so we colour-code aggressively in the orders list.

type Size = "sm" | "md";

type Props = {
  type: string | null | undefined;
  size?: Size;
};

export function OrderTypeBadge({ type, size = "sm" }: Props) {
  const isSample = type === "sample_pack";
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  if (isSample) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider ${padding} bg-sky-100 text-sky-800 ring-1 ring-sky-200`}
        title="Sample pack — no print files needed"
      >
        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm3 4a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm4-8a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
        Sample
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider ${padding} bg-amber-100 text-amber-900 ring-1 ring-amber-200`}
      title="Custom wallpaper — print files required"
    >
      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2.5 0v8h11V6h-11z" />
      </svg>
      Wallpaper
    </span>
  );
}
