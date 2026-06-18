# PaperWalls — 7-Figure DTC Infrastructure Checklist

> Pinned 2026-06-15 · updated 2026-06-18 (tracking + Meta + analytics sprint). Phase: **activation, proof, compliance.**

> **✓ Shipped since pinned:** PayFast signature + onConflict bugs fixed (ITN verified live); checkout speed (redirect-default, removed onsite round-trip, self-hosted font, lazy configurator, `waitUntil` deferrals); inline per-field checkout error UX; VAT-copy fix; Meta cross-border privacy disclosure; security headers; dead-Stitch removal; Organization + Product JSON-LD; quality-verdict persisted on orders; new favicon; old Meta pixel purged (clean slate for the new account).
>
> **✓ Shipped 2026-06-18 (tracking + Meta + analytics sprint):** rebuilt the first-party funnel (pdp.viewed; checkout.started on /checkout mount; add-to-cart moved to the cart chokepoint = `cart.wallpaper_added` + `cart.sample_added`; config image/size events) → admin funnel is now **8 sequential stages**; analytics **command center** rebuild (month-to-date goal + run-rate, auto "what to do" insights, sequential by-source funnel, channel economics, unit-economics scaffold, sample-pack panel) with owner config at `src/lib/analytics-config.ts`; **Meta Pixel + CAPI WIRED & DEPLOYED** on the new account (pixel `1555913832788701`) — real `_fbp`/`_fbc` + buyer IP on both server events, `CustomizeProduct` event, Graph API v19→v22 (v19 had expired 2026-05-21), InitiateCheckout `content_ids`, System-User token + env vars live. Verified by research + adversarial payment-path review. Final step: one test order to confirm dedup + EMQ.

## Executive Summary

PaperWalls is materially further along than most stores at this stage: the hard, expensive infrastructure is already built — a hardened PayFast checkout (server-side price/geometry revalidation, a 5-check idempotent ITN verified on live orders, nightly reconcile), correctly-coded Meta Pixel + CAPI with event-ID dedup, a real print queue with preflight gating and per-wall reprint, first-party UTM/fbclid/gclid attribution on every order, and admin locked behind middleware + RLS. The legal base (Terms, POPIA-aware Privacy, CPA-correct Returns) is ahead of peers too. The problem isn't unbuilt systems — it's that several revenue-critical systems are **built but dark**, and a few live claims are legally wrong. Four biggest leverage points: (1) turn on the engines that exist (Resend, Meta, abandoned-cart) before spending a rand; (2) add the proof layer you can't show yet (real install photos + reviews — all imagery is AI-generated); (3) fix the "VAT included" + consent gaps; (4) close the mobile-conversion and WhatsApp gaps that decide whether SA cold traffic converts.

## Do next (P0) — still pending, sequenced

1. **Verify Meta end-to-end:** one test order → confirm Purchase shows Browser+Server "deduplicated" + EMQ 7+ in Events Manager (server side is checkable in the `capi_events` table). Meta is now WIRED + deployed. · S
2. **Decide Business-Manager isolation** — Option A (separate BM for PaperWalls) vs B (stay in the shared BM that holds flagged financial pixels). A BM-wide restriction would freeze PaperWalls's pixel too; "separate ad account, same BM" is NOT isolation. · owner call
3. **Email reliability:** send shipped/delivered **inline** (today they're queue-only, drained by the once-daily Hobby cron) + fix the re-notify idempotency key + correct the "sends within 5 min" UI copy. · M
4. **Quality-warning softening:** lower BORDERLINE 0.55→0.45 in `lib/quality.ts` + reframe copy from alarm to a quiet note (math is correct; it only over-fires on low-res test images + zoom). · S
5. **SEO:** home / PDP / `/samples` / `/faq` are client components so they share one generic root title — add per-folder server `layout.tsx` metadata + FAQPage JSON-LD + a real footer link sitemap. · M
6. Tax-ready receipt in order-confirmed email. · M
7. Sticky mobile add-to-cart + above-the-fold PDP price (the conversion batch). · M
8. Vercel Hobby → Pro (~R380/mo) — unblocks 5-min crons + abandoned-cart cadence. · S
9. Wire abandoned-cart recovery end-to-end (needs Pro). · M
10. Rate-limit public POST routes (Upstash free) — also the prerequisite for any AddToCart CAPI mirror. · M
11. Error tracking (Sentry). · M
12. Real install photography + reviews system. · M–L
13. WhatsApp (wa.me click-to-chat) — needs your WA number. · S

**Deferred (recommended, not blockers):** AddToCart/ViewContent CAPI mirror (after rate-limiting); configurator "Add to cart" jumps straight to /checkout (rename or open the drawer first); Purchase `content_ids` → real catalog SKU (once a Meta catalog is connected); success-page Purchase pixel paid-status gate.

## By area (status-tagged)

**Acquisition** — Meta Pixel+CAPI wired+deployed on the new account (final test-order verify pending) `[PARTIAL] P0`; `_fbp/_fbc` + buyer-IP capture into CAPI `[DONE] P0`; `CustomizeProduct` configurator event `[DONE]`; Graph API pinned to v22 (v19 expired) `[DONE]`; Google Ads via stored `gclid` `[PARTIAL] P1`; monthly UGC/creative engine (3–5 SA micro-creators @ R1.5k–R5k) `[TODO] P1`; value-based lookalikes from `customers` `[PARTIAL] P1`; Product/Org JSON-LD shipped, Search Console verify pending `[PARTIAL] P1`.

**Conversion & CRO** — checkout speed (redirect + waitUntil + lazy configurator) `[DONE] P0`; inline checkout error UX `[DONE] P1`; self-host Satoshi font `[DONE] P1`; sticky mobile bar `[TODO] P0`; per-m² price anchoring ("most walls R2,800–4,500") `[PARTIAL] P1`; SA payment-method logos `[PARTIAL] P1`; honest urgency cue `[TODO] P2`.

**Checkout & Payments** — checkout path: redirect default, onsite disabled `[DONE] P0`; confirm Instant EFT/Apple Pay on in PayFast `[PARTIAL] P0` (your dashboard); abandoned-cart wired `[TODO] P0` (needs Resend); VAT-ready invoice PDF `[TODO] P1`; fraud guard on checkout `[TODO] P1`; discount-code path (table dead today) `[TODO] P2`.

**Fulfillment & Ops** — persist quality verdict `[DONE] P0`; courier API (Bob Go rate-shops Courier Guy/Aramex/Pudo, R0 platform fee) `[TODO] P1`; production-SLA breach alerts `[PARTIAL] P1`; structured defect/reprint workflow w/ photo intake `[PARTIAL] P2`; customer packing slip `[TODO] P2`; tube-batching by finish for margin `[TODO] P2`.

**Post-Purchase & Retention** — `review_request` flow (enum stub) `[TODO] P1`; `win_back` flow `[TODO] P1`; write `marketing_opt_in` at checkout `[TODO] P1`; WhatsApp shipped/delivered via SA BSP (~R0.15–0.40/msg) `[TODO] P1`; customer tracking page `[TODO] P2`.

**CX & Support** — Resend transactional + support email live `[DONE] P0`; WhatsApp primary channel `[TODO] P0`; in-configurator "send us your file, we'll check it free" `[PARTIAL] P1`; self-service reprint form `[PARTIAL] P2`; SLA + single-operator triage `[TODO] P2`.

**Brand & Creative** — replace AI imagery with real installs (½-day Cape Town shoot ~R3,500–6,000) `[TODO] P0`; verified reviews on PDP `[TODO] P0`; make unboxing real + photographed `[PARTIAL] P1`; IG/TikTok @paperwalls.za + UGC loop (tag-us → R150 credit) `[TODO] P1`; founder story w/ real face `[PARTIAL] P2`; branded OG card `[PARTIAL] P2`; content/SEO engine `[TODO] P2`.

**Data & Analytics** — full-journey first-party funnel + **8-stage sequential** admin funnel `[DONE] P0`; analytics **command center** (MTD goal/run-rate, auto "what to do" insights, by-source funnel, channel table, sample-pack panel) `[DONE] P0`; Meta dedup confirm pending a test order `[PARTIAL] P0`; contribution-margin engine **scaffolded** (set unit costs in `analytics-config.ts` to light it up) `[PARTIAL] P0`; CAC/ROAS/LTV:CAC layer + manual `ad_spend` table `[TODO] P0`; server-side ViewContent/AddToCart CAPI mirror `[TODO] P1` (after rate-limiting); join events→customers + cohort/repeat view `[PARTIAL] P1`; CAPI audit trail in `capi_events` `[DONE]`; POPIA-safe analytics retention `[PARTIAL] P2`.

**Infrastructure & Reliability** — security headers (HSTS etc.) `[DONE] P1` (CSP still a report-only follow-up); remove dead Stitch webhook + stale SQL/docs `[DONE] P2`; Vercel Pro `[TODO] P0`; Sentry `[TODO] P0`; rate limiting `[TODO] P0`; uptime/synthetic monitor + `/api/health` `[TODO] P1`; Supabase PITR + restore drill `[PARTIAL] P1`; incident runbook + secret rotation `[TODO] P2`.

**Legal / Finance (SA)** — fix "VAT included" `[DONE] P0`; disclose Meta data sharing `[DONE] P0`; tax receipt `[TODO] P0` (after Resend); marketing opt-in at checkout `[TODO] P1` (consent UI line was reverted by choice); legal entity + ECTA s43 footer disclosure `[TODO] P1`; register Information Officer (free) `[PARTIAL] P1`; business banking + bookkeeping + R850k VAT tripwire alert `[TODO] P1`; product-liability + cyber insurance `[TODO] P2`.

## Why this beats Shopify
- You own every byte of first-party data (attribution, event history, LTV, CAPI audit trail — all in Supabase).
- A bespoke live-priced configurator with server-side anti-tamper — the moat.
- No per-transaction platform fee (PayFast processing only).
- Full control of checkout, emails, fulfillment queue, data model.

Three things Shopify gives free that we must consciously replicate: (1) app ecosystem for reviews/email/loyalty; (2) theme polish + Core Web Vitals; (3) maintained payments/trust layer (onsite modal + method logos).

**Net: the engine is built. Next phase is activation, proof, and compliance.**
