// Stable per-action event IDs for Meta Pixel/CAPI deduplication.
//
// Meta dedupes events sharing the same event_id when they arrive from
// both the browser pixel AND the server CAPI within a short window
// (~hours). Without dedup we'd double-count every conversion.
//
// Strategy: client generates a UUID at the moment of the user action,
// stashes it briefly in sessionStorage keyed by event type, and passes
// it through to the server (via the existing /api/checkout/create body
// or similar). Server reads the same UUID when posting to CAPI.

const KEY_PREFIX = "pw_meta_evt_";
const TTL_MS     = 30 * 60 * 1000; // 30 min — long enough to cover a checkout flow

type Stored = { id: string; ts: number };

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older runtimes — collision risk negligible at our scale.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Mint a fresh event_id for the given event type, storing it for the
 * server-side CAPI call to pick up. Use when the user is *initiating*
 * an action (e.g. clicking add-to-cart, submitting checkout).
 */
export function mintEventId(eventType: string): string {
  const id  = uuid();
  const ss  = safeStorage();
  if (ss) {
    try {
      ss.setItem(`${KEY_PREFIX}${eventType}`, JSON.stringify({ id, ts: Date.now() }));
    } catch {
      // Quota or private mode — fine, we can still fire the pixel without dedup.
    }
  }
  return id;
}

/**
 * Read an event_id minted earlier in this session, if it's still fresh.
 * Used by the server-side flow when it wants to match a server event back
 * to a recent client event — e.g. the checkout API reads InitiateCheckout
 * to dedup against the pixel that fired moments earlier.
 */
export function readEventId(eventType: string): string | null {
  const ss = safeStorage();
  if (!ss) return null;
  try {
    const raw = ss.getItem(`${KEY_PREFIX}${eventType}`);
    if (!raw) return null;
    const { id, ts } = JSON.parse(raw) as Stored;
    if (Date.now() - ts > TTL_MS) {
      ss.removeItem(`${KEY_PREFIX}${eventType}`);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}
