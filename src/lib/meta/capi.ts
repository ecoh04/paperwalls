// Meta Conversions API server wrapper.
//
// Sends one event to Meta's Graph endpoint, hashing PII per their spec
// (lowercase + trim + sha256), records every attempt to public.capi_events
// so we have an audit trail, and never throws — CAPI failure must not
// take the calling code down with it.
//
// Required env:
//   META_PIXEL_ID                  — both client and server use this
//   META_CAPI_ACCESS_TOKEN         — System User token with ads_management
//   META_CAPI_TEST_EVENT_CODE?     — when set, marks events as test-only
//                                   (visible in Events Manager → Test Events)

import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Graph API versions expire ~2 years after release. v19.0 expired 2026-05-21,
// so we default to v22.0 (the safe floor Meta still accepts) and allow an env
// override so the next forced bump is config, not a code change. Re-bump ~3
// months before the chosen version's expiry.
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION?.trim() || "v22.0";

// Must stay in lockstep with the capi_events_event_type_check DB constraint
// (Purchase, InitiateCheckout, AddToCart, ViewContent, Lead). 'PageView' is
// intentionally absent — the constraint rejects it, so allowing it in the type
// would let a caller queue an event whose audit insert silently fails.
export type MetaEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead";

type UserData = {
  email?:        string | null;
  phone?:        string | null;
  first_name?:   string | null;
  last_name?:    string | null;
  city?:         string | null;
  state?:        string | null;        // province
  zip?:          string | null;
  country_code?: string | null;        // ISO-3166-1 alpha-2 e.g. "ZA"
  external_id?:  string | null;        // typically customer.id
  client_ip?:    string | null;
  client_ua?:    string | null;
  fbclid?:       string | null;
  fbp?:          string | null;        // real _fbp browser cookie (NOT hashed)
  fbc?:          string | null;        // real _fbc click cookie (NOT hashed); beats fbclid synthesis
};

type CustomData = {
  currency?:      string;
  value?:         number;
  content_ids?:   string[];
  content_name?:  string;
  content_type?:  string;
  contents?:      Array<{ id: string; quantity: number; item_price?: number }>;
  num_items?:     number;
  order_id?:      string;
};

type SendArgs = {
  event_name:    MetaEventName;
  event_id:      string;                 // for client/server dedup
  event_time?:   number;                  // unix seconds; defaults to now
  event_source_url?: string;
  user_data:     UserData;
  custom_data?:  CustomData;
  /** Reference to our internal records — stored in capi_events for audit. */
  meta?:         { order_id?: string; customer_id?: string };
};

function hash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (!normalised) return undefined;
  return createHash("sha256").update(normalised).digest("hex");
}

function normalisePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  // Meta wants digits only, no spaces/punctuation, country code included.
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return undefined;
  // SA local numbers like "0821234567" → "27821234567".
  if (digits.startsWith("0") && digits.length === 10) return `27${digits.slice(1)}`;
  return digits;
}

function buildFbc(fbclid: string | null | undefined, eventTime: number): string | undefined {
  // Meta's _fbc cookie format: "fb.{subdomain index}.{timestamp ms}.{fbclid}"
  // subdomain index = 1 (origin domain). Used when we don't have the actual
  // _fbc cookie (server-side from a webhook context where the cookie isn't
  // available to us).
  if (!fbclid) return undefined;
  return `fb.1.${eventTime * 1000}.${fbclid}`;
}

export async function sendMetaConversion(args: SendArgs): Promise<{ ok: boolean; reason?: string; response?: unknown }> {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const token   = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();

  if (!pixelId || !token) {
    return { ok: false, reason: "META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set" };
  }

  const eventTime = args.event_time ?? Math.floor(Date.now() / 1000);

  const ud      = args.user_data;
  const userData: Record<string, string | string[]> = {};
  const em = hash(ud.email);                                     if (em) userData.em = [em];
  const ph = hash(normalisePhone(ud.phone));                     if (ph) userData.ph = [ph];
  const fn = hash(ud.first_name);                                if (fn) userData.fn = [fn];
  const ln = hash(ud.last_name);                                 if (ln) userData.ln = [ln];
  const ct = hash(ud.city);                                      if (ct) userData.ct = [ct];
  const st = hash(ud.state);                                     if (st) userData.st = [st];
  const zp = hash(ud.zip);                                       if (zp) userData.zp = [zp];
  const cc = hash(ud.country_code);                              if (cc) userData.country = [cc];
  const ex = hash(ud.external_id);                               if (ex) userData.external_id = [ex];
  if (ud.client_ip)  userData.client_ip_address  = ud.client_ip;
  if (ud.client_ua)  userData.client_user_agent  = ud.client_ua;
  // fbp/fbc are first-party cookies, sent verbatim (NEVER hashed). The real
  // _fbc cookie beats the fbclid-synthesized fallback for match quality.
  const fbc = ud.fbc?.trim() || buildFbc(ud.fbclid, eventTime);  if (fbc) userData.fbc = fbc;
  if (ud.fbp?.trim())                                            userData.fbp = ud.fbp.trim();

  const event: Record<string, unknown> = {
    event_name:        args.event_name,
    event_time:        eventTime,
    event_id:          args.event_id,
    action_source:     "website",
    user_data:         userData,
  };
  if (args.event_source_url) event.event_source_url = args.event_source_url;
  if (args.custom_data) {
    const cd: Record<string, unknown> = {};
    if (args.custom_data.currency)     cd.currency     = args.custom_data.currency;
    if (args.custom_data.value != null) cd.value       = args.custom_data.value;
    if (args.custom_data.content_ids)  cd.content_ids  = args.custom_data.content_ids;
    if (args.custom_data.content_name) cd.content_name = args.custom_data.content_name;
    if (args.custom_data.content_type) cd.content_type = args.custom_data.content_type;
    if (args.custom_data.contents)     cd.contents     = args.custom_data.contents;
    if (args.custom_data.num_items != null) cd.num_items = args.custom_data.num_items;
    if (args.custom_data.order_id)     cd.order_id     = args.custom_data.order_id;
    event.custom_data = cd;
  }

  const body: Record<string, unknown> = {
    data: [event],
  };
  if (testCode) body.test_event_code = testCode;

  let okResult = false;
  let errorReason: string | undefined;
  let responseBody: unknown;

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    responseBody = await res.json().catch(() => ({}));
    if (res.ok) {
      okResult = true;
    } else {
      errorReason = `HTTP ${res.status}`;
    }
  } catch (err) {
    errorReason = err instanceof Error ? err.message : "Unknown CAPI error";
  }

  // Audit row — never blocks the response.
  if (supabaseAdmin) {
    void supabaseAdmin.from("capi_events").insert({
      event_type:    args.event_name,
      order_id:      args.meta?.order_id    ?? null,
      customer_id:   args.meta?.customer_id ?? null,
      fbclid:        ud.fbclid              ?? null,
      event_id:      args.event_id,
      value_cents:   args.custom_data?.value != null
        ? Math.round(args.custom_data.value * 100)
        : null,
      currency:      args.custom_data?.currency ?? "ZAR",
      payload:       { user_data: userData, custom_data: event.custom_data ?? null },
      sent_at:       new Date().toISOString(),
      response:      typeof responseBody === "object" ? (responseBody as Record<string, unknown>) : null,
      status:        okResult ? "sent" : "failed",
    });
  }

  return { ok: okResult, reason: errorReason, response: responseBody };
}
