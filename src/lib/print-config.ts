// Owner-editable config for the factory print workflow.
//
// This lives in code (not the DB) so it is version-controlled and changing it
// is a deliberate act. Adjust it to match your actual press / media, then the
// factory print sheet recomputes every panel plan automatically.

/**
 * Width of a single printed panel, in CENTIMETRES.
 *
 * Set to the printer roll / media width. The print sheet slices each wall into
 * vertical panels of this width (the last panel takes the remainder), so the
 * operator knows exactly how many panels to print and how wide each one is.
 *
 * Default 60 cm. Change this one number if you move to a wider or narrower roll.
 */
export const PRINT_PANEL_WIDTH_CM = 60;

/**
 * Plan how one wall is sliced into vertical panels for printing.
 *
 * Panels are full wall-height; widths are PRINT_PANEL_WIDTH_CM each, with the
 * final panel taking whatever remains. Returns rounded whole-cm values so the
 * sheet stays unambiguous for the operator.
 */
export function panelPlan(
  wallWidthCm: number,
  wallHeightCm: number,
  panelWidthCm: number = PRINT_PANEL_WIDTH_CM,
): {
  count: number;
  fullWidthCm: number;
  lastWidthCm: number;
  heightCm: number;
  widths: number[];
} {
  const w = Math.max(0, Math.round(wallWidthCm));
  const h = Math.max(0, Math.round(wallHeightCm));
  const pw = Math.max(1, Math.round(panelWidthCm));

  const count = w > 0 ? Math.ceil(w / pw) : 0;
  const remainder = w - (count - 1) * pw;
  // remainder lands in 1..pw for any positive width; guard the empty case.
  const lastWidthCm = count > 0 ? remainder : 0;

  const widths: number[] = [];
  for (let i = 0; i < count; i++) {
    widths.push(i < count - 1 ? pw : lastWidthCm);
  }

  return {
    count,
    fullWidthCm: pw,
    lastWidthCm,
    heightCm: h,
    widths,
  };
}
