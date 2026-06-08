import { timingSafeEqual } from "crypto";

/**
 * Validate a cron request's bearer token against CRON_SECRET.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when
 * CRON_SECRET is configured. We require it so the route isn't callable from the
 * open internet.
 *
 * Fails CLOSED: if CRON_SECRET is unset, or the header is missing/wrong, this
 * returns false. The comparison is constant-time to avoid a timing side-channel
 * on the secret.
 */
export function cronAuthorized(req: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!got) return false;

  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  // timingSafeEqual throws if lengths differ — guard first (length itself is
  // not secret), then compare constant-time.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
