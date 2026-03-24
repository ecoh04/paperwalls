type SearchParams = { [key: string]: string | string[] | undefined };

/**
 * Lightweight query-param experiment helper.
 * Example: /config?v=speed
 */
export function getVariant(
  searchParams: SearchParams | undefined,
  key = "v"
): string | null {
  const raw = searchParams?.[key];
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}
