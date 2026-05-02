/**
 * PayFast source-IP allowlist.
 *
 * The PayFast ITN spec requires four security checks, the fourth of which
 * is verifying the request really came from PayFast's network. PayFast
 * publishes a list of hostnames they send ITN traffic from and explicitly
 * advises resolving those hostnames at runtime rather than hardcoding IPs:
 *
 *   "The A records within these records may change from time to time as
 *    Payfast's network grows and becomes more distributed, so we advise
 *    you to keep sync with these records for the future."
 *   — https://support.payfast.help/portal/en/kb/articles/what-ip-addresses-does-payfast-use-20-9-2022
 *
 * After the AWS migration in July 2025, PayFast also published an explicit
 * IP range for AWS-origin ITN traffic:
 *
 *   3.163.232.237 … 3.163.252.237 (21 IPs — third octet 232..252, last octet always .237)
 *   — https://support.payfast.help/portal/en/kb/articles/whitelisting-ip-addresses-2-7-2025
 *
 * We combine both: resolve hostnames at request time (cached 30 min) AND
 * accept any IP in the AWS range as a fallback for when DNS is slow or
 * resolves to a stale set.
 */

import { promises as dns } from "node:dns";

const HOSTNAMES = [
  // Legacy PayFast hostnames (still in use)
  "www.payfast.co.za",
  "api.payfast.co.za",
  "ips.payfast.co.za",
  "w1w.payfast.co.za",
  "w2w.payfast.co.za",
  // Post-AWS-migration domains (July 2025)
  "payment.payfast.io",
  "adm.payfast.io",
  "api.payfast.io",
  // Sandbox
  "sandbox.payfast.co.za",
];

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

let cache: { ips: Set<string>; expiresAt: number } | null = null;

/**
 * Resolve all known PayFast hostnames to IPv4 addresses. Failures on any
 * one hostname are logged and swallowed so a single DNS hiccup can't break
 * ITN entirely — the AWS-range fallback (see isInPayfastAwsRange) covers us.
 */
async function refreshAllowlist(): Promise<Set<string>> {
  const ips = new Set<string>();

  await Promise.all(
    HOSTNAMES.map(async (host) => {
      try {
        const addrs = await dns.resolve4(host);
        for (const a of addrs) ips.add(a);
      } catch (err) {
        // Non-fatal — other hostnames + AWS range still cover us.
        console.warn(`[payfast-ip] DNS resolve4(${host}) failed:`, (err as Error).message);
      }
    })
  );

  return ips;
}

/**
 * Hardcoded fallback for the post-AWS-migration IP range. Any IP of the
 * form 3.163.{232..252}.237 is a published PayFast ITN source.
 */
function isInPayfastAwsRange(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  const [a, b, c, d] = parts.map((p) => Number(p));
  if (Number.isNaN(a + b + c + d)) return false;
  return a === 3 && b === 163 && c >= 232 && c <= 252 && d === 237;
}

/**
 * Returns true if `clientIp` is plausibly a PayFast ITN sender. Resolves
 * the hostname allowlist at request time (cached) and also accepts any IP
 * in the documented AWS range.
 *
 * NEVER throws — alerting on a false negative is the caller's
 * responsibility. We log internally so DNS issues are visible.
 */
export async function isPayfastIp(clientIp: string): Promise<boolean> {
  if (!clientIp) return false;

  // Fast path: AWS range — no DNS lookup needed.
  if (isInPayfastAwsRange(clientIp)) return true;

  if (!cache || cache.expiresAt < Date.now()) {
    try {
      const ips = await refreshAllowlist();
      cache = { ips, expiresAt: Date.now() + CACHE_TTL_MS };
    } catch (err) {
      // Don't update cache on total failure; keep stale entry if we have one.
      console.error("[payfast-ip] Allowlist refresh failed:", err);
      if (!cache) cache = { ips: new Set(), expiresAt: Date.now() + 60_000 };
    }
  }

  return cache.ips.has(clientIp);
}

/**
 * Extract the original client IP from request headers. On Vercel (and most
 * CDN+proxy stacks) the original client is the first comma-separated entry
 * in x-forwarded-for. Falls back to x-real-ip.
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? "";
}

/**
 * For /admin/setup or debugging — returns the current resolved allowlist
 * without doing a forced refresh. Useful for confirming "the cache really
 * does include the IPs we expect" without exposing real customer IPs.
 */
export function debugAllowlistSnapshot(): { ips: string[]; expiresAt: number | null } {
  return {
    ips:        cache ? Array.from(cache.ips).sort() : [],
    expiresAt:  cache?.expiresAt ?? null,
  };
}
