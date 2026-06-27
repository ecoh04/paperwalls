import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMetaConversion } from "@/lib/meta/capi";

// First-party analytics ingest. Receives a batch of events from the browser
// (sent via fetch keepalive / sendBeacon) and writes them straight into
// public.events. Also lazily upserts the sessions row on first event so
// every event has a session to attribute to and the UTM/referrer is
// captured even for visitors who never touch the cart.
//
// No auth — events are anonymous by design and the table is service-role
// write-only at the RLS level. Bots will spam this; we accept the noise
// because filtering it server-side is more expensive than the storage.
//
// Schema of each event (payload shape):
// {
//   type:    "page.viewed" | "pdp.viewed" | "config.image_uploaded" | ...
//   ts:      number (client epoch ms; server records its own created_at too)
//   path?:   string
//   payload?: object  (any extra props specific to the event type)
// }
//
// Body shape:
// { session_id: string, events: Event[], session?: SessionInit }

type EventIn = {
  type:    string;
  ts?:     number;
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

// Vercel exposes the visitor's coarse geo for free in request headers.
// We grab country / city / region and persist them on the session row.
function readGeo(req: Request): { country: string | null; city: string | null; region: string | null } {
  const country = req.headers.get("x-vercel-ip-country");
  const cityRaw = req.headers.get("x-vercel-ip-city");
  const region  = req.headers.get("x-vercel-ip-country-region");
  // Vercel encodes city names (e.g. "Cape%20Town") — decode for storage.
  let city: string | null = null;
  if (cityRaw) {
    try { city = decodeURIComponent(cityRaw); } catch { city = cityRaw; }
  }
  return { country: country || null, city, region: region || null };
}

const MAX_EVENTS_PER_BATCH = 50;
const VALID_TYPE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── Meta CAPI: AddToCart ──────────────────────────────────────────────────
// Mirror the browser-pixel AddToCart server-side, dedup'd by sharing the same
// event_id the pixel used. Fired exactly once per real add from CartContext
// (NOT on quantity edits or the debounced cart re-sync). A clamp on number
// keeps a crafted body from inflating the reported value. Never throws.
type CapiAddToCartBody = {
  event_id?:    string;
  value?:       number;   // ZAR (already divided from cents client-side)
  currency?:    string;
  content_type?: string;
  content_ids?: string[];
  contents?:    Array<{ id: string; quantity: number; item_price?: number }>;
  num_items?:   number;
  fbp?:         string | null;
  fbc?:         string | null;
};

async function handleCapiAddToCart(req: Request, b: CapiAddToCartBody): Promise<NextResponse> {
  // event_id is mandatory for dedup. Without it, skip rather than double-count.
  if (!b.event_id || typeof b.event_id !== "string") {
    return new NextResponse(null, { status: 204 });
  }
  const fbp = typeof b.fbp === "string" && b.fbp.trim() ? b.fbp.trim() : null;
  const fbc = typeof b.fbc === "string" && b.fbc.trim() ? b.fbc.trim() : null;
  // No first-party cookies → match quality is too low to be useful; the pixel
  // already fired, so skip the CAPI send gracefully.
  if (!fbp && !fbc) {
    return new NextResponse(null, { status: 204 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const num = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;

  // sendMetaConversion never throws; awaiting it here is safe because the audit
  // insert must finish before this serverless function freezes.
  await sendMetaConversion({
    event_name: "AddToCart",
    event_id:   b.event_id,
    event_source_url: process.env.NEXT_PUBLIC_APP_URL || undefined,
    user_data: {
      fbp,
      fbc,
      client_ip: clientIp,
      client_ua: req.headers.get("user-agent") ?? null,
    },
    custom_data: {
      currency:     typeof b.currency === "string" ? b.currency : "ZAR",
      value:        num(b.value),
      content_type: typeof b.content_type === "string" ? b.content_type : undefined,
      content_ids:  Array.isArray(b.content_ids) ? b.content_ids.slice(0, 20).map(String) : undefined,
      contents:     Array.isArray(b.contents) ? b.contents.slice(0, 20) : undefined,
      num_items:    num(b.num_items),
    },
  });

  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  // Fast 204 — never stall the client.
  try {
    if (!supabaseAdmin) return new NextResponse(null, { status: 204 });

    const body = (await req.json().catch(() => null)) as null | {
      action?:     unknown;
      session_id?: unknown;
      events?:     unknown;
      session?:    unknown;
    };

    // Dedicated CAPI AddToCart action — fired 1:1 with the browser pixel.
    if (body && body.action === "capi_add_to_cart") {
      try {
        return await handleCapiAddToCart(req, body as CapiAddToCartBody);
      } catch {
        // A CAPI failure must never break add-to-cart (pixel already fired).
        return new NextResponse(null, { status: 204 });
      }
    }

    if (!body || !isUuid(body.session_id) || !Array.isArray(body.events)) {
      return new NextResponse(null, { status: 204 });
    }

    const sessionId = body.session_id;
    const eventsRaw = body.events.slice(0, MAX_EVENTS_PER_BATCH) as EventIn[];

    const geo = readGeo(req);

    // Lazy session upsert. Only on the first batch from a session — client
    // signals this by including a session block. Subsequent batches omit it.
    if (body.session && typeof body.session === "object") {
      const s = body.session as SessionInit;
      try {
        await supabaseAdmin.from("sessions").upsert(
          {
            id:            sessionId,
            utm_source:    s.utm_source   ?? null,
            utm_medium:    s.utm_medium   ?? null,
            utm_campaign:  s.utm_campaign ?? null,
            utm_content:   s.utm_content  ?? null,
            utm_term:      s.utm_term     ?? null,
            fbclid:        s.fbclid       ?? null,
            gclid:         s.gclid        ?? null,
            landing_page:  s.landing_page ?? null,
            referrer:      s.referrer     ?? null,
            user_agent:    s.user_agent   ?? null,
            country:       geo.country,
            city:          geo.city,
            region:        geo.region,
            last_seen_at:  new Date().toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: false },
        );
      } catch {
        // Non-fatal: events table accepts null session_id.
      }
    } else {
      // Touch last_seen_at on every batch so we know if a session is "live".
      void supabaseAdmin
        .from("sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    // Filter to well-formed events. Drop anything malformed silently.
    const rows = eventsRaw
      .filter((e) => e && typeof e.type === "string" && VALID_TYPE.test(e.type))
      .map((e) => ({
        type:       e.type,
        session_id: sessionId,
        payload: {
          path:    e.path  ?? null,
          ts:      e.ts    ?? null,
          ...(e.payload ?? {}),
        },
      }));

    if (rows.length > 0) {
      await supabaseAdmin.from("events").insert(rows);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
