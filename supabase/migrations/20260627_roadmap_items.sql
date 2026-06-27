-- Founder roadmap / task board shown at /admin/roadmap.
-- Applied 2026-06-27 via the Supabase MCP; mirrored here for version control.
-- RLS on, no policy: all access goes through supabaseAdmin behind an admin auth
-- check (same pattern as daily_ad_spend).

create table if not exists public.roadmap_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  theme       text not null,
  status      text not null default 'next' check (status in ('done','now','next','later','parked')),
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  note        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.roadmap_items is 'Founder roadmap / task board shown at /admin/roadmap. RLS on, no policy: all access via supabaseAdmin behind an admin auth check.';
alter table public.roadmap_items enable row level security;

insert into public.roadmap_items (title, theme, status, priority, note, sort_order)
select * from (values
  ('Payments (PayFast), verified',                  'Foundation & reliability', 'done',  'medium', null::text, 1),
  ('Email engine + 10-min cron',                    'Foundation & reliability', 'done',  'medium', null, 2),
  ('Rate-limiting + security headers',              'Foundation & reliability', 'done',  'medium', null, 3),
  ('Vercel Pro',                                    'Foundation & reliability', 'done',  'medium', null, 4),
  ('Checkout timeout cap',                          'Foundation & reliability', 'now',   'high',   'multi-wall orders can time out and never create', 5),
  ('Error tracking + alerts on checkout and payment','Foundation & reliability','next',  'high',   null, 6),
  ('Content-Security-Policy',                       'Foundation & reliability', 'later', 'low',    null, 7),
  ('Pixel + CAPI dedup (EMQ ~8)',                   'Tracking & attribution',   'done',  'medium', null, 8),
  ('8-stage funnel + fbp/fbc captured',             'Tracking & attribution',   'done',  'medium', null, 9),
  ('Prove ad to order attribution',                 'Tracking & attribution',   'now',   'high',   'smoke-test one real ad click before spending budget', 10),
  ('Purchase content_ids as product codes',         'Tracking & attribution',   'next',  'medium', 'Meta cannot content-match purchases yet', 11),
  ('ViewContent on the actual ad landing page',     'Tracking & attribution',   'next',  'medium', null, 12),
  ('AddToCart mirrored to CAPI',                    'Tracking & attribution',   'later', 'low',    null, 13),
  ('Remove fake 5-star and price overlays',         'Conversion',               'now',   'high',   'trust plus ad-policy risk', 14),
  ('Drop false real-homes claims over AI imagery',  'Conversion',               'now',   'high',   null, 15),
  ('Real photos and reviews engine',                'Conversion',               'next',  'high',   'biggest conversion ceiling', 16),
  ('Sticky mobile add-to-cart',                     'Conversion',               'next',  'medium', null, 17),
  ('Soften configurator quality warning',           'Conversion',               'next',  'medium', null, 18),
  ('Lead capture (email my price / save design)',   'Conversion',               'next',  'high',   'most buyers will not convert on visit one', 19),
  ('Risk-reversal and offer clarity above the fold','Conversion',               'next',  'medium', null, 20),
  ('PDP speed and Core Web Vitals',                 'Conversion',               'later', 'low',    null, 21),
  ('A/B testing framework',                         'Conversion',               'later', 'low',    null, 22),
  ('Editorial transactional emails',               'Customer experience',      'done',  'medium', null, 23),
  ('Abandoned-cart shows their saved design',       'Customer experience',      'next',  'high',   'show the customer the wall they designed', 24),
  ('Smoother mobile checkout',                      'Customer experience',      'next',  'medium', null, 25),
  ('Order tracking / status page',                  'Customer experience',      'next',  'low',    null, 26),
  ('Configurator polish and real material shots',   'Customer experience',      'later', 'low',    null, 27),
  ('Marketing consent capture',                     'Retention & win-back',     'next',  'high',   'unlocks the entire retention program (POPIA)', 28),
  ('Welcome / nurture series',                      'Retention & win-back',     'next',  'high',   null, 29),
  ('Sample to full-order flow',                     'Retention & win-back',     'next',  'high',   'your highest-intent path', 30),
  ('Post-purchase review request',                  'Retention & win-back',     'next',  'medium', null, 31),
  ('Replenish / second-room cross-sell',            'Retention & win-back',     'later', 'low',    null, 32),
  ('Win-back lapsed customers',                     'Retention & win-back',     'later', 'low',    null, 33),
  ('Referral / loyalty',                            'Retention & win-back',     'later', 'low',    null, 34),
  ('Profit-first dashboard (redesigned)',           'Analytics',                'done',  'medium', null, 35),
  ('Ad-spend input + MER, verdict, intraday',       'Analytics',                'done',  'medium', null, 36),
  ('Enter spend and COGS',                          'Analytics',                'next',  'high',   'makes the profit numbers real, needs your input', 37),
  ('Per-channel ROAS table',                        'Analytics',                'next',  'medium', 'reconcile Meta vs first-party', 38),
  ('Cohort / LTV, heatmaps, best-sellers',          'Analytics',                'later', 'low',    null, 39),
  ('Terms, privacy, returns above the pay button',  'Trust & compliance',       'now',   'high',   'chargeback defence plus Meta review', 40),
  ('Fix sitewide canonical',                        'Trust & compliance',       'next',  'high',   'every page reads as a duplicate of the homepage, hurts SEO', 41),
  ('POPIA / consent posture (SA-only for now)',     'Trust & compliance',       'next',  'medium', null, 42),
  ('Per-route SEO metadata',                        'Trust & compliance',       'later', 'low',    null, 43),
  ('Retire stale docs',                             'Trust & compliance',       'later', 'low',    'roadmap and master-plan name the old payment provider and fonts', 44)
) as v(title, theme, status, priority, note, sort_order)
where not exists (select 1 from public.roadmap_items);
