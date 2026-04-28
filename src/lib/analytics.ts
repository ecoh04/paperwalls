// First-party browser tracker. Singleton. Batches events and ships them to
// /api/track on a short timer or on page-unload via sendBeacon. Reuses the
// same localStorage session id key as CartContext so server-side joins
// against `sessions`, `carts`, and `orders` line up.
//
// Design constraints:
//  * No third-party JS, no consent banner needed for first-party analytics.
//  * Survive tab-close: queue flushed via navigator.sendBeacon on hide/unload.
//  * Cheap: we only POST when there's something to say.
//  * Safe in SSR: every entry point checks `typeof window`.

"use client";

const SESSION_KEY = "paperwalls-session";   // matches CartContext SESSION_KEY
const FLUSH_INTERVAL_MS = 4_000;
const MAX_QUEUE = 25;

type Event = {
  type:    string;
  ts:      number;
  path?:   string;
  payload?: Record<string, unknown>;
};

type SessionInit = {
  utm_source?:   string | null;
  utm_medium?:   string | null;
  utm_campaign?: string | null;
  utm_content?:  string | null;
  utm_term?:     string | null;
  fbclid?:       string | null;
  gclid?:        string | null;
  landing_page?: string | null;
  referrer?:     string | null;
  user_agent?:   string | null;
};

let sessionId: string | null = null;
let sessionInitSent = false;
let queue: Event[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// ──────────────────────────────────────────────────────────────────────────
// Session id
// ──────────────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  if (sessionId) return sessionId;
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      sessionId = existing;
      return existing;
    }
    const fresh = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, fresh);
    sessionId = fresh;
    return fresh;
  } catch {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return sessionId;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Attribution snapshot — only sent with the first event of a session.
// ──────────────────────────────────────────────────────────────────────────

function captureSessionInit(): SessionInit {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const peek = (k: string): string | undefined =>
      params.get(k) || sessionStorage.getItem(`pw_${k}`) || undefined;

    // Persist click-ids across same-session navigations.
    for (const k of ["fbclid", "gclid"]) {
      const v = params.get(k);
      if (v) sessionStorage.setItem(`pw_${k}`, v);
    }

    return {
      utm_source:   peek("utm_source")   ?? null,
      utm_medium:   peek("utm_medium")   ?? null,
      utm_campaign: peek("utm_campaign") ?? null,
      utm_content:  peek("utm_content")  ?? null,
      utm_term:     peek("utm_term")     ?? null,
      fbclid:       peek("fbclid")       ?? null,
      gclid:        peek("gclid")        ?? null,
      landing_page: window.location.pathname + window.location.search,
      referrer:     document.referrer || null,
      user_agent:   navigator.userAgent || null,
    };
  } catch {
    return {};
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Flush
// ──────────────────────────────────────────────────────────────────────────

function flush(useBeacon = false): void {
  if (typeof window === "undefined") return;
  if (queue.length === 0) return;
  const sid = getOrCreateSessionId();
  if (!sid) return;

  const events = queue;
  queue = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const body: Record<string, unknown> = {
    session_id: sid,
    events,
  };
  if (!sessionInitSent) {
    body.session = captureSessionInit();
    sessionInitSent = true;
  }

  const json = JSON.stringify(body);

  // sendBeacon is fire-and-forget and survives tab-close. Use it on
  // page-hide. Falls back to fetch keepalive when the payload is too
  // big or the API isn't available.
  if (useBeacon && navigator.sendBeacon) {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/track", blob);
      if (ok) return;
    } catch {
      // fall through to fetch
    }
  }

  try {
    fetch("/api/track", {
      method:    "POST",
      headers:   { "Content-Type": "application/json" },
      body:      json,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Drop silently — analytics must never break the page.
  }
}

function scheduleFlush(): void {
  if (typeof window === "undefined") return;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush(false);
  }, FLUSH_INTERVAL_MS);
}

// ──────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────

/**
 * Record an event. `type` must be `domain.action` (e.g. `pdp.viewed`,
 * `config.added_to_cart`). Payload is JSON-serialisable extras.
 */
export function track(type: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!type) return;
  // Make sure session is touched even if we never send (e.g. before first flush).
  getOrCreateSessionId();

  queue.push({
    type,
    ts:   Date.now(),
    path: window.location.pathname,
    payload,
  });

  if (queue.length >= MAX_QUEUE) {
    flush(false);
  } else {
    scheduleFlush();
  }
}

/** Force-flush, e.g. before navigating away from a critical funnel step. */
export function flushNow(): void {
  flush(false);
}

let unloadInstalled = false;

/** Wire page-hide/unload listeners exactly once per page load. */
export function installAnalyticsHandlers(): void {
  if (typeof window === "undefined") return;
  if (unloadInstalled) return;
  unloadInstalled = true;

  // Modern browsers reliably fire visibilitychange when a tab goes away.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush(true);
    }
  });

  // Fallback for older Safari.
  window.addEventListener("pagehide",   () => flush(true));
  window.addEventListener("beforeunload", () => flush(true));
}
