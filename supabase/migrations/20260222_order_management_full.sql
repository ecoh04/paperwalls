-- =============================================================================
-- PaperWalls: Full order management – cancel, refund, archive, last activity
-- Run after 20260221_factory_ops.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ORDERS – new status and columns
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_activity_preview text;

-- Allow 'cancelled' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'new', 'in_production', 'shipped', 'delivered', 'cancelled'));

CREATE INDEX IF NOT EXISTS orders_deleted_at ON orders(deleted_at);
CREATE INDEX IF NOT EXISTS orders_last_activity_at ON orders(last_activity_at DESC);

-- -----------------------------------------------------------------------------
-- 2. ORDER_ACTIVITY – new action types
-- -----------------------------------------------------------------------------
ALTER TABLE order_activity DROP CONSTRAINT IF EXISTS order_activity_action_check;
ALTER TABLE order_activity ADD CONSTRAINT order_activity_action_check
  CHECK (action IN (
    'status_change', 'assigned', 'note', 'created',
    'address_edit', 'customer_edit', 'spec_edit', 'print_file_replaced',
    'cancelled', 'archived', 'restored', 'refunded'
  ));

-- =============================================================================
-- Done. App will: set deleted_at for archive, refunded_at for refunds,
-- last_activity_at/last_activity_preview when inserting activity.
-- =============================================================================
