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
