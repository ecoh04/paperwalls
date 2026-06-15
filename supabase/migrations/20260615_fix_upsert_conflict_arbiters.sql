-- =============================================================================
-- PaperWalls — fix ON CONFLICT arbiters (2026-06-15)
--
-- PostgREST's upsert(onConflict) emits `ON CONFLICT (col)` with no predicate,
-- which cannot match a PARTIAL unique index (`WHERE col IS NOT NULL`) — Postgres
-- raises 42P10 "no unique or exclusion constraint matching the ON CONFLICT
-- specification". This broke the PayFast ITN payments upsert and the
-- scheduled_emails (order confirmation) upsert in production.
--
-- Fix: replace the partial unique indexes with full unique CONSTRAINTS. The
-- columns are nullable and Postgres treats NULLs as distinct, so multiple NULL
-- rows are still allowed; uniqueness of real (non-null) values is unchanged.
-- =============================================================================

DROP INDEX IF EXISTS public.payments_gateway_payment_id_uniq;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_gateway_payment_id_key UNIQUE (gateway_payment_id);

DROP INDEX IF EXISTS public.scheduled_emails_idempotency_uniq;
ALTER TABLE public.scheduled_emails
  ADD CONSTRAINT scheduled_emails_idempotency_key_key UNIQUE (idempotency_key);
