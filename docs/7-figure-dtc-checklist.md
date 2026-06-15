# PaperWalls — 7-Figure DTC Infrastructure Checklist

> Pinned 2026-06-15 (updated after the checkout-speed + launch-hardening sprint). Phase: **activation, proof, compliance.**

> **✓ Shipped since pinned:** PayFast signature + onConflict bugs fixed (ITN verified live); checkout speed (redirect-default, removed onsite round-trip, self-hosted font, lazy configurator, `waitUntil` deferrals); inline per-field checkout error UX; VAT-copy fix; Meta cross-border privacy disclosure; security headers; dead-Stitch removal; Organization + Product JSON-LD; quality-verdict persisted on orders; new favicon; old Meta pixel purged (clean slate for the new account).

## Executive Summary

PaperWalls is materially further along than most stores at this stage: the hard, expensive infrastructure is already built — a hardened PayFast checkout (server-side price/geometry revalidation, a 5-check idempotent ITN verified on live orders, nightly reconcile), correctly-coded Meta Pixel + CAPI with event-ID dedup, a real print queue with preflight gating and per-wall reprint, first-party UTM/fbclid/gclid attribution on every order, and admin locked behind middleware + RLS. The legal base (Terms, POPIA-aware Privacy, CPA-correct Returns) is ahead of peers too. The problem isn't unbuilt systems — it's that several revenue-critical systems are **built but dark**, and a few live claims are legally wrong. Four biggest leverage points: (1) turn on the engines that exist (Resend, Meta, abandoned-cart) before spending a rand; (2) add the proof layer you can't show yet (real install photos + reviews — all imagery is AI-generated); (3) fix the "VAT included" + consent gaps; (4) close the mobile-conversion and WhatsApp gaps that decide whether SA cold traffic converts.

## Do next (P0) — still pending, sequenced

1. Activate Resend (API key + DNS-verified domain). · S · **blocked on DNS access**
2. Wire + verify new Meta Pixel + CAPI (test order, confirm Purchase dedup). · S · **new account pending**
3. Capture `_fbp`/`_fbc` cookies → CAPI (EMQ ~5 → 8+, after Meta is wired). · M
4. Tax-ready receipt in order-confirmed email (after Resend). · M
5. Add WhatsApp (wa.me click-to-chat) — needs your WA number. · S
6. Vercel Hobby → Pro (~R380/mo) — unblocks 5-min crons. · S
7. Wire abandoned-cart recovery end-to-end (needs Resend + Pro). · M
8. Sticky mobile add-to-cart + live-price bar — next conversion win. · M
9. Rate-limit public POST routes (Upstash free). · M
10. Error tracking (Sentry). · M
11. Real install photography + reviews system. · M–L

## By area (status-tagged)

**Acquisition** — Meta live+verified `[PARTIAL] P0`; `_fbp/_fbc` capture `[TODO] P0`; Google Ads via stored `gclid` `[PARTIAL] P1`; monthly UGC/creative engine (3–5 SA micro-creators @ R1.5k–R5k) `[TODO] P1`; value-based lookalikes from `customers` `[PARTIAL] P1`; Product/Org JSON-LD shipped, Search Console verify pending `[PARTIAL] P1`.

**Conversion & CRO** — checkout speed (redirect + waitUntil + lazy configurator) `[DONE] P0`; inline checkout error UX `[DONE] P1`; self-host Satoshi font `[DONE] P1`; sticky mobile bar `[TODO] P0`; per-m² price anchoring ("most walls R2,800–4,500") `[PARTIAL] P1`; SA payment-method logos `[PARTIAL] P1`; honest urgency cue `[TODO] P2`.

**Checkout & Payments** — checkout path: redirect default, onsite disabled `[DONE] P0`; confirm Instant EFT/Apple Pay on in PayFast `[PARTIAL] P0` (your dashboard); abandoned-cart wired `[TODO] P0` (needs Resend); VAT-ready invoice PDF `[TODO] P1`; fraud guard on checkout `[TODO] P1`; discount-code path (table dead today) `[TODO] P2`.

**Fulfillment & Ops** — persist quality verdict `[DONE] P0`; courier API (Bob Go rate-shops Courier Guy/Aramex/Pudo, R0 platform fee) `[TODO] P1`; production-SLA breach alerts `[PARTIAL] P1`; structured defect/reprint workflow w/ photo intake `[PARTIAL] P2`; customer packing slip `[TODO] P2`; tube-batching by finish for margin `[TODO] P2`.

**Post-Purchase & Retention** — `review_request` flow (enum stub) `[TODO] P1`; `win_back` flow `[TODO] P1`; write `marketing_opt_in` at checkout `[TODO] P1`; WhatsApp shipped/delivered via SA BSP (~R0.15–0.40/msg) `[TODO] P1`; customer tracking page `[TODO] P2`.

**CX & Support** — WhatsApp primary channel `[TODO] P0`; Resend support email live `[PARTIAL] P0`; in-configurator "send us your file, we'll check it free" `[PARTIAL] P1`; self-service reprint form `[PARTIAL] P2`; SLA + single-operator triage `[TODO] P2`.

**Brand & Creative** — replace AI imagery with real installs (½-day Cape Town shoot ~R3,500–6,000) `[TODO] P0`; verified reviews on PDP `[TODO] P0`; make unboxing real + photographed `[PARTIAL] P1`; IG/TikTok @paperwalls.za + UGC loop (tag-us → R150 credit) `[TODO] P1`; founder story w/ real face `[PARTIAL] P2`; branded OG card `[PARTIAL] P2`; content/SEO engine `[TODO] P2`.

**Data & Analytics** — Meta dedup verified `[PARTIAL] P0`; contribution-margin engine (dashboard has a "needs cost data" placeholder) `[TODO] P0`; CAC/ROAS/LTV:CAC layer + manual `ad_spend` table `[TODO] P0`; server-side ViewContent/AddToCart CAPI `[PARTIAL] P1`; join events→customers + cohort/repeat view `[PARTIAL] P1`; CAPI-failure alerting `[PARTIAL] P1`; POPIA-safe analytics retention `[PARTIAL] P2`.

**Infrastructure & Reliability** — security headers (HSTS etc.) `[DONE] P1` (CSP still a report-only follow-up); remove dead Stitch webhook + stale SQL/docs `[DONE] P2`; Vercel Pro `[TODO] P0`; Sentry `[TODO] P0`; rate limiting `[TODO] P0`; uptime/synthetic monitor + `/api/health` `[TODO] P1`; Supabase PITR + restore drill `[PARTIAL] P1`; incident runbook + secret rotation `[TODO] P2`.

**Legal / Finance (SA)** — fix "VAT included" `[DONE] P0`; disclose Meta data sharing `[DONE] P0`; tax receipt `[TODO] P0` (after Resend); marketing opt-in at checkout `[TODO] P1` (consent UI line was reverted by choice); legal entity + ECTA s43 footer disclosure `[TODO] P1`; register Information Officer (free) `[PARTIAL] P1`; business banking + bookkeeping + R850k VAT tripwire alert `[TODO] P1`; product-liability + cyber insurance `[TODO] P2`.

## Why this beats Shopify
- You own every byte of first-party data (attribution, event history, LTV, CAPI audit trail — all in Supabase).
- A bespoke live-priced configurator with server-side anti-tamper — the moat.
- No per-transaction platform fee (PayFast processing only).
- Full control of checkout, emails, fulfillment queue, data model.

Three things Shopify gives free that we must consciously replicate: (1) app ecosystem for reviews/email/loyalty; (2) theme polish + Core Web Vitals; (3) maintained payments/trust layer (onsite modal + method logos).

**Net: the engine is built. Next phase is activation, proof, and compliance.**
