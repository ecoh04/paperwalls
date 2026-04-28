// Visual production-readiness checklist on the order detail page. WARN-only,
// never blocks. The operator has the final call — we just surface the
// stuff that's easy to miss when an order's about to print.

type Check = {
  ok:       boolean;
  label:    string;
  detail?:  string;
};

type Props = {
  imagesPresent:    boolean;
  imageCount:       number;
  wallCount:        number;
  totalSqm:         number | null;
  province:         string | null;
  postalCode:       string | null;
  addressLine1:     string | null;
  customerPhone:    string | null;
  wallpaperStyle:   string | null;
  applicationMethod: string | null;
};

export function PreflightChecks(p: Props) {
  const checks: Check[] = [
    {
      ok:    p.imagesPresent && p.imageCount === p.wallCount,
      label: `Print files: ${p.imageCount}/${p.wallCount}`,
      detail: !p.imagesPresent
        ? "No image attached. The print team has nothing to print."
        : p.imageCount < p.wallCount
          ? `Missing ${p.wallCount - p.imageCount} wall file(s). Use 'Replace print file' to upload the rest.`
          : undefined,
    },
    {
      ok:    !!(p.totalSqm && p.totalSqm > 0),
      label: "Wall dimensions captured",
      detail: !p.totalSqm ? "Total m² is missing. Edit the order to set wall sizes." : undefined,
    },
    {
      ok:    !!p.wallpaperStyle,
      label: "Finish chosen",
      detail: !p.wallpaperStyle ? "No finish (satin/matte/linen). Edit the order before printing." : undefined,
    },
    {
      ok:    !!p.applicationMethod,
      label: "Application method set",
      detail: !p.applicationMethod ? "DIY vs Pro install not chosen. Affects packing." : undefined,
    },
    {
      ok:    !!(p.addressLine1 && p.postalCode && p.province),
      label: "Shipping address complete",
      detail: !(p.addressLine1 && p.postalCode && p.province)
        ? "Missing line 1, postal code or province. Cannot dispatch."
        : undefined,
    },
    {
      ok:    !!p.customerPhone,
      label: "Phone number on file",
      detail: !p.customerPhone ? "Couriers need a phone. Add one before shipping." : undefined,
    },
    {
      ok:    p.addressLine1 ? !/p\.?o\.?\s*box/i.test(p.addressLine1) : true,
      label: "Not a P.O. Box",
      detail: p.addressLine1 && /p\.?o\.?\s*box/i.test(p.addressLine1)
        ? "Address looks like a P.O. Box. Most couriers can't deliver there."
        : undefined,
    },
  ];

  const failing = checks.filter((c) => !c.ok);
  const allGreen = failing.length === 0;

  return (
    <section
      className={`rounded-xl border-2 p-5 ${
        allGreen ? "border-green-200 bg-green-50/40" : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-base ${allGreen ? "text-green-700" : "text-amber-700"}`}>
          {allGreen ? "✓" : "⚠"}
        </span>
        <h2 className="text-base font-semibold text-stone-900">
          {allGreen
            ? "Pre-flight clean — ready for production."
            : `${failing.length} pre-flight issue${failing.length === 1 ? "" : "s"} — review before printing.`}
        </h2>
      </div>

      <ul className="mt-3 space-y-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 ${c.ok ? "text-green-700" : "text-amber-700"}`}>
              {c.ok ? "✓" : "⚠"}
            </span>
            <div>
              <span className={c.ok ? "text-stone-700" : "text-stone-900 font-medium"}>{c.label}</span>
              {c.detail && (
                <p className="mt-0.5 text-xs text-stone-600">{c.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
