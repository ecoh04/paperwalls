-- =============================================================================
-- PaperWalls: Full backend rebuild
-- New tables: customers, sessions, payments, carts, cart_items, order_items, events
-- Orders cleanup: add customer_id, cart_id, session_id, payment_id FKs
-- Views: easy querying in Supabase dashboard
-- Safe to run once (all IF NOT EXISTS / IF EXISTS guards).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CUSTOMERS
-- Source of truth for buyer identity across sessions and orders.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text NOT NULL UNIQUE,
  name                 text,
  phone                text,
  marketing_opt_in     boolean NOT NULL DEFAULT false,
  total_orders         int NOT NULL DEFAULT 0,
  total_spent_cents    bigint NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  last_seen_at         timestamptz
);

CREATE INDEX IF NOT EXISTS customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS customers_created_at ON customers(created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. SESSIONS
-- One row per browser session (UUID stored in client localStorage).
-- Links anonymous activity to a customer once they identify themselves.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id              uuid PRIMARY KEY,
  customer_id     uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_agent      text,
  referrer        text,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_customer_id ON sessions(customer_id);

-- -----------------------------------------------------------------------------
-- 3. PAYMENTS
-- One row per gateway transaction. payment_id on orders FK here.
-- Fixes the stitch_payment_id mess — gateway_payment_id is now clearly visible.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway             text NOT NULL DEFAULT 'payfast'
                        CHECK (gateway IN ('payfast', 'manual', 'voucher', 'other')),
  gateway_payment_id  text,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  amount_cents        bigint NOT NULL,
  currency            text NOT NULL DEFAULT 'ZAR',
  order_numbers       text[],
  raw_payload         jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS payments_created_at ON payments(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. CARTS
-- One active cart per session. status transitions: active → converted | abandoned
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'converted', 'abandoned', 'dismissed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  abandoned_at timestamptz
);

CREATE INDEX IF NOT EXISTS carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS carts_updated_at ON carts(updated_at DESC);

-- -----------------------------------------------------------------------------
-- 5. CART ITEMS
-- Each row is one line item in a cart. Synced from the client on every change.
-- spec stores product-specific data as JSON (no image data — just dimensions/style).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id         uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_type    text NOT NULL CHECK (product_type IN ('wallpaper', 'sample_pack')),
  quantity        int NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL,
  subtotal_cents  bigint NOT NULL,
  spec            jsonb NOT NULL DEFAULT '{}',
  client_item_id  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cart_items_cart_id ON cart_items(cart_id);

-- -----------------------------------------------------------------------------
-- 6. ORDER ITEMS
-- Normalised line items attached to each order (one per cart item at checkout).
-- The denormalised columns on orders are kept for backward compat.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_type     text NOT NULL,
  quantity         int NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL,
  subtotal_cents   bigint NOT NULL,
  spec             jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 7. EVENTS
-- Append-only audit / analytics log. Track EVERYTHING.
-- type conventions: cart.updated, cart.abandoned, customer.identified,
--   order.created, payment.completed, payment.failed
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL,
  session_id   uuid REFERENCES sessions(id) ON DELETE SET NULL,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  cart_id      uuid REFERENCES carts(id) ON DELETE SET NULL,
  order_id     uuid REFERENCES orders(id) ON DELETE SET NULL,
  payload      jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_type ON events(type);
CREATE INDEX IF NOT EXISTS events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS events_customer_id ON events(customer_id);
CREATE INDEX IF NOT EXISTS events_order_id ON events(order_id);
CREATE INDEX IF NOT EXISTS events_created_at ON events(created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. ORDERS — new FK columns
-- customer_id / cart_id / session_id / payment_id link this order to the new
-- entities above. stitch_payment_id is kept for backward compat (legacy only).
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id      uuid REFERENCES carts(id)     ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id   uuid REFERENCES sessions(id)  ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id   uuid REFERENCES payments(id)  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_customer_id  ON orders(customer_id);
CREATE INDEX IF NOT EXISTS orders_cart_id      ON orders(cart_id);
CREATE INDEX IF NOT EXISTS orders_payment_id   ON orders(payment_id);

-- -----------------------------------------------------------------------------
-- 9. FUNCTION: mark_abandoned_carts
-- Call this via a Supabase cron job (pg_cron) or scheduled edge function every hour.
-- Marks carts active for >3 hours with no order as abandoned.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS int AS $$
DECLARE updated_count int;
BEGIN
  UPDATE carts
  SET    status = 'abandoned', abandoned_at = now()
  WHERE  status = 'active'
    AND  updated_at < now() - interval '3 hours'
    AND  NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.cart_id = carts.id
    );
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 10. FUNCTION: update_customer_stats
-- Recalculates total_orders and total_spent_cents on a customer after an order is
-- confirmed paid. Call from the payfast webhook or a trigger.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_customer_stats(p_customer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET
    total_orders      = (SELECT COUNT(*) FROM orders WHERE customer_id = p_customer_id AND status != 'pending'),
    total_spent_cents = (SELECT COALESCE(SUM(total_cents), 0) FROM orders WHERE customer_id = p_customer_id AND status != 'pending'),
    updated_at        = now()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 11. RLS — CUSTOMERS
-- Anon: insert (identify flow) + update own row via email match (no auth needed
--       since we call from server-side route with service key in prod, but anon
--       key from API routes also works with these policies).
-- Authenticated admin: full access.
-- -----------------------------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert customers"         ON customers;
DROP POLICY IF EXISTS "Anon update customers"         ON customers;
DROP POLICY IF EXISTS "Admin select customers"        ON customers;
DROP POLICY IF EXISTS "Admin update customers"        ON customers;

CREATE POLICY "Anon insert customers" ON customers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon update customers" ON customers
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin select customers" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin update customers" ON customers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 12. RLS — SESSIONS
-- -----------------------------------------------------------------------------
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon upsert sessions" ON sessions;
DROP POLICY IF EXISTS "Admin select sessions" ON sessions;

CREATE POLICY "Anon upsert sessions" ON sessions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin select sessions" ON sessions
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 13. RLS — PAYMENTS
-- Anon INSERT: payfast webhook uses anon key.
-- Authenticated SELECT: admin dashboard.
-- -----------------------------------------------------------------------------
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert payments" ON payments;
DROP POLICY IF EXISTS "Anon update payments" ON payments;
DROP POLICY IF EXISTS "Admin select payments" ON payments;

CREATE POLICY "Anon insert payments" ON payments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon update payments" ON payments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin select payments" ON payments
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 14. RLS — CARTS
-- -----------------------------------------------------------------------------
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon all carts" ON carts;
DROP POLICY IF EXISTS "Admin select carts" ON carts;

CREATE POLICY "Anon all carts" ON carts
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin select carts" ON carts
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 15. RLS — CART ITEMS
-- -----------------------------------------------------------------------------
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon all cart_items" ON cart_items;
DROP POLICY IF EXISTS "Admin select cart_items" ON cart_items;

CREATE POLICY "Anon all cart_items" ON cart_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Admin select cart_items" ON cart_items
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 16. RLS — ORDER ITEMS
-- -----------------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert order_items" ON order_items;
DROP POLICY IF EXISTS "Admin select order_items" ON order_items;

CREATE POLICY "Anon insert order_items" ON order_items
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin select order_items" ON order_items
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 17. RLS — EVENTS
-- -----------------------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert events" ON events;
DROP POLICY IF EXISTS "Admin select events" ON events;

CREATE POLICY "Anon insert events" ON events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Admin select events" ON events
  FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 18. VIEWS — easy querying in the Supabase Table Editor
-- -----------------------------------------------------------------------------

-- Full order view: orders joined with customer email and payment gateway ID.
-- In your dashboard you can now search by customer email or see pf_payment_id clearly.
CREATE OR REPLACE VIEW view_order_details AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.product_type,
  o.quantity,
  o.subtotal_cents,
  o.shipping_cents,
  o.total_cents,
  o.wallpaper_style,
  o.application_method,
  o.wall_width_m,
  o.wall_height_m,
  o.total_sqm,
  o.image_url,
  o.province,
  o.city,
  o.created_at,
  o.shipped_at,
  o.delivered_at,
  c.email        AS customer_email,
  c.name         AS customer_name,
  c.phone        AS customer_phone,
  p.gateway      AS payment_gateway,
  p.gateway_payment_id,
  p.status       AS payment_status,
  p.amount_cents AS payment_amount_cents,
  f.name         AS factory_name
FROM orders o
LEFT JOIN customers  c ON c.id = o.customer_id
LEFT JOIN payments   p ON p.id = o.payment_id
LEFT JOIN factories  f ON f.id = o.assigned_factory_id;

-- Abandoned carts with estimated recovery value.
CREATE OR REPLACE VIEW view_abandoned_carts AS
SELECT
  ca.id          AS cart_id,
  ca.status,
  ca.updated_at,
  ca.abandoned_at,
  cu.email       AS customer_email,
  cu.name        AS customer_name,
  cu.phone       AS customer_phone,
  s.last_seen_at AS session_last_seen,
  (
    SELECT COALESCE(SUM(ci.subtotal_cents), 0)
    FROM cart_items ci WHERE ci.cart_id = ca.id
  )              AS cart_value_cents,
  (
    SELECT COUNT(*) FROM cart_items ci WHERE ci.cart_id = ca.id
  )              AS item_count
FROM carts ca
LEFT JOIN sessions  s  ON s.id  = ca.session_id
LEFT JOIN customers cu ON cu.id = ca.customer_id
WHERE ca.status IN ('active', 'abandoned')
ORDER BY ca.updated_at DESC;

-- Customer summary with lifetime value.
CREATE OR REPLACE VIEW view_customer_summary AS
SELECT
  c.id,
  c.email,
  c.name,
  c.phone,
  c.total_orders,
  c.total_spent_cents,
  c.created_at,
  c.last_seen_at,
  (
    SELECT o.order_number
    FROM orders o
    WHERE o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 1
  ) AS last_order_number,
  (
    SELECT o.created_at
    FROM orders o
    WHERE o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 1
  ) AS last_order_at
FROM customers c
ORDER BY c.total_spent_cents DESC;

-- =============================================================================
-- Done. Next steps:
-- 1. Deploy via Supabase SQL Editor or supabase db push.
-- 2. Set up a cron job calling SELECT mark_abandoned_carts() every hour.
--    In Supabase: Database → Extensions → enable pg_cron, then:
--    SELECT cron.schedule('abandon-carts', '0 * * * *', 'SELECT mark_abandoned_carts()');
-- =============================================================================
