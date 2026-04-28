import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

const MAX_EVENTS_PER_BATCH = 50;
const VALID_TYPE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

function isUuid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(req: Request) {
  // Fast 204 — never stall the client.
  try {
    if (!supabaseAdmin) return new NextResponse(null, { status: 204 });

    const body = (await req.json().catch(() => null)) as null | {
      session_id?: unknown;
      events?:     unknown;
      session?:    unknown;
    };

    if (!body || !isUuid(body.session_id) || !Array.isArray(body.events)) {
      return new NextResponse(null, { status: 204 });
    }

    const sessionId = body.session_id;
    const eventsRaw = body.events.slice(0, MAX_EVENTS_PER_BATCH) as EventIn[];

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
