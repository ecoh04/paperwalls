-- =============================================================================
-- PaperWalls: Rename stripe_payment_id → stitch_payment_id (run once)
-- =============================================================================
-- You ran old SQL that used stripe_payment_id. We now use Stitch only.
-- Run this in Supabase → SQL Editor if your orders table already has
-- stripe_payment_id. Safe to run even if the column was already renamed.
-- =============================================================================

-- Rename column (no data loss). If column doesn't exist, this will error;
-- in that case run full-setup.sql for a fresh schema, or add the new column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stripe_payment_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN stripe_payment_id TO stitch_payment_id;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stitch_payment_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stripe_payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stitch_payment_id text;
  END IF;
END $$;
