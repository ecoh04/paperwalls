// Owner-editable config for the admin analytics command center.
//
// Fill these in to unlock the goal tracker and the unit-economics layer
// (contribution margin, ROAS, CAC, LTV:CAC). Anything left at 0 / null
// renders a clean "configure to unlock" state instead of a fake number.
//
// This lives in code (not the DB) so margins are not exposed to anyone with
// admin DB access by accident, and so the numbers are version-controlled.

import type { WallpaperMaterial } from "@/types/order";

/**
 * Monthly revenue target in CENTS. Drives the goal bar + run-rate pace.
 * Example: R250,000 => 25_000_000. Set to 0 to hide the goal tracker.
 */
export const MONTHLY_REVENUE_GOAL_CENTS = 0;

/**
 * Your cost basis per square metre, per finish, in CENTS (ink + substrate +
 * press time). null = not configured for that finish. When all three are set
 * the contribution-margin tile goes live.
 * Example: R120/m² satin => satin: 12_000.
 */
export const COST_PER_SQM_CENTS: Record<WallpaperMaterial, number | null> = {
  satin: null,
  matte: null,
  linen: null,
};

/** Per-order fulfilment cost you absorb (courier, handling) in CENTS. */
export const FULFILMENT_COST_CENTS = 0;

/** Per-order packaging cost (kraft, tube, ribbon, insert) in CENTS. */
export const PACKAGING_COST_CENTS = 0;

/** True only when every finish has a cost basis, so margin is real. */
export const COSTS_CONFIGURED =
  COST_PER_SQM_CENTS.satin != null &&
  COST_PER_SQM_CENTS.matte != null &&
  COST_PER_SQM_CENTS.linen != null;

/**
 * Estimated cost of goods for one finish's worth of orders.
 * COGS = m² printed * cost/m² + per-order overheads. Returns null when the
 * finish has no configured cost basis.
 */
export function cogsForFinishCents(
  finish: WallpaperMaterial,
  totalSqm: number,
  orderCount: number,
): number | null {
  const perSqm = COST_PER_SQM_CENTS[finish];
  if (perSqm == null) return null;
  return Math.round(
    totalSqm * perSqm + orderCount * (FULFILMENT_COST_CENTS + PACKAGING_COST_CENTS),
  );
}
