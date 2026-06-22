-- Analytics v3 cockpit: in-dashboard ad spend + hourly revenue.
-- Applied 2026-06-22 via the Supabase MCP; mirrored here for version control.

create table if not exists public.daily_ad_spend (
  spend_date   date primary key,
  amount_cents integer not null default 0,
  channel      text    not null default 'blended',
  updated_at   timestamptz not null default now()
);
comment on table public.daily_ad_spend is 'Owner-entered daily ad spend (ZAR cents) for MER/ROAS/CAC/net-profit. Server-only access.';
alter table public.daily_ad_spend enable row level security;
-- No policy: reads/writes go through the service-role client (supabaseAdmin)
-- behind an admin auth check in the setDailySpend server action.

create or replace view public.v_hourly_revenue as
 select date_trunc('hour', created_at at time zone 'Africa/Johannesburg'::text) as hour,
    count(*) filter (where (status <> all (array['pending'::text, 'cancelled'::text])) and refunded_at is null) as paid_orders,
    coalesce(sum(total_cents) filter (where (status <> all (array['pending'::text, 'cancelled'::text])) and refunded_at is null), 0::numeric) as paid_revenue_cents
   from orders
  where deleted_at is null and is_test = false
  group by date_trunc('hour', created_at at time zone 'Africa/Johannesburg'::text)
  order by date_trunc('hour', created_at at time zone 'Africa/Johannesburg'::text) desc;
