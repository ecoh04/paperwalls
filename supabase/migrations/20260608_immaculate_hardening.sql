-- =============================================================================
-- PaperWalls — Supabase hardening migration (2026-06-08)
--
-- Brings the live DB to an "immaculate" state ahead of launch. Every statement
-- is idempotent and safe to re-run. No data is modified; structure only.
--
-- Source: findings from the systems-verification pass.
-- =============================================================================

-- 1. order_activity: allow the 'print_file_replaced' audit action --------------
--    replaceOrderPrintFile() writes this value; the old CHECK rejected it, so
--    the audit row for "who swapped the print art, on which wall" was silently
--    dropped (the insert error was swallowed). Add it to the allowed set.
ALTER TABLE public.order_activity DROP CONSTRAINT IF EXISTS order_activity_action_check;
ALTER TABLE public.order_activity ADD CONSTRAINT order_activity_action_check
  CHECK (action = ANY (ARRAY[
    'created','status_change','note','address_edit','customer_edit','spec_edit',
    'shipped','cancelled','refunded','archived','restored','print_file_replaced'
  ]));

-- 2. updated_at: attach the existing set_updated_at() trigger -------------------
--    The function existed but was attached to ZERO tables, so updated_at was
--    only as fresh as explicit code writes — and orders/payments never wrote it,
--    leaving updated_at permanently equal to created_at. Attach it everywhere a
--    updated_at column exists so the value is authoritative regardless of code path.
DROP TRIGGER IF EXISTS set_updated_at ON public.orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.customers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.carts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.cart_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Analytics views: enforce the caller's RLS (advisor ERROR x3) --------------
--    SECURITY DEFINER views read with the creator's privileges and bypass RLS.
--    These are admin/analytics-only; switching to invoker rights closes the hole
--    while still working for the admin (who passes is_admin() on the base tables).
ALTER VIEW public.v_daily_revenue      SET (security_invoker = true);
ALTER VIEW public.v_event_volume_30d   SET (security_invoker = true);
ALTER VIEW public.view_abandoned_carts SET (security_invoker = true);

-- 4. sa_today(): pin search_path (advisor WARN) -------------------------------
ALTER FUNCTION public.sa_today() SET search_path = public, pg_temp;

-- =============================================================================
-- Intentionally NOT included (handle separately):
--   • REVOKE EXECUTE ON is_admin() FROM authenticated — is_admin() is referenced
--     inside RLS policy expressions; revoking caller EXECUTE can break admin RLS.
--     Low value for a single-admin app; test on a branch before applying.
--   • Leaked-password protection — enable in Supabase Dashboard → Auth settings.
--   • Pre-launch test-data cleanup (orphan orders, stale queued email) — data,
--     not schema; run as a separate, reviewed statement if desired.
-- =============================================================================
