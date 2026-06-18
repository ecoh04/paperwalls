-- Analytics: exclude owner/QA test orders, and fix customer LTV to paid-only.
-- Applied 2026-06-18. Mirrors the change made live via the Supabase MCP so the
-- schema change is version-controlled.

-- 1. Test-order flag.
alter table public.orders add column if not exists is_test boolean not null default false;
comment on column public.orders.is_test is 'Owner/QA test orders; excluded from analytics revenue, funnels and customer LTV.';

-- (Data backfill of pre-launch test orders was done as a one-off DML, not here.)

-- 2. Revenue view excludes test orders (all other semantics unchanged).
create or replace view public.v_daily_revenue as
 select (created_at at time zone 'Africa/Johannesburg'::text)::date as day,
    count(*) filter (where (status <> all (array['pending'::text, 'cancelled'::text])) and refunded_at is null) as paid_orders,
    coalesce(sum(total_cents) filter (where (status <> all (array['pending'::text, 'cancelled'::text])) and refunded_at is null), 0::numeric) as paid_revenue_cents,
    count(*) filter (where status = 'pending'::text) as pending_orders,
    count(*) filter (where refunded_at is not null) as refunded_orders
   from orders
  where deleted_at is null and is_test = false
  group by ((created_at at time zone 'Africa/Johannesburg'::text)::date)
  order by ((created_at at time zone 'Africa/Johannesburg'::text)::date) desc;

-- 3. Customer LTV counts only truly-paid, non-test orders (was: status != 'pending',
--    which wrongly included cancelled + refunded). Re-run for all customers after.
create or replace function public.update_customer_stats(p_customer_id uuid)
 returns void language plpgsql set search_path to 'public', 'pg_temp' as $function$
begin
  update customers set
    total_orders = (select count(*) from orders
       where customer_id = p_customer_id
         and status not in ('pending','cancelled')
         and refunded_at is null and deleted_at is null and is_test = false),
    total_spent_cents = (select coalesce(sum(total_cents),0) from orders
       where customer_id = p_customer_id
         and status not in ('pending','cancelled')
         and refunded_at is null and deleted_at is null and is_test = false),
    updated_at = now()
  where id = p_customer_id;
end;
$function$;
