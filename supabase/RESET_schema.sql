-- =============================================================================
-- PaperWalls: COMPLETE SCHEMA RESET  (v3 — final)
--
-- ⚠️  WIPES ALL DATA. Run once in Supabase → SQL Editor on a clean database.
--
-- Design decisions captured here:
--   • No multi-factory routing — one operation, orders pushed manually
--   • Sequential order IDs: PW-1001, PW-1002 … (human-readable, customer-friendly)
--   • Full UTM + click-ID attribution on every session and order
--   • application_method = 'pro_installer' is clearly visible for external follow-up
--   • Customer notifications via scheduled_emails queue (send service plugged in later)
--   • Simple discount codes (percent or fixed, expiry, max uses)
--   • Meta CAPI events table ready for when Pixel is set up
--   • Views use security_invoker=true — no "UNRESTRICTED" warnings
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. WIPE
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS events            CASCADE;
DROP TABLE IF EXISTS scheduled_emails  CASCADE;
DROP TABLE IF EXISTS capi_events       CASCADE;
DROP TABLE IF EXISTS discount_codes    CASCADE;
DROP TABLE IF EXISTS order_items       CASCADE;
DROP TABLE IF EXISTS order_activity    CASCADE;
DROP TABLE IF EXISTS orders            CASCADE;
DROP TABLE IF EXISTS cart_items        CASCADE;
DROP TABLE IF EXISTS carts             CASCADE;
DROP TABLE IF EXISTS payments          CASCADE;
DROP TABLE IF EXISTS sessions          CASCADE;
DROP TABLE IF EXISTS profiles          CASCADE;
DROP TABLE IF EXISTS customers         CASCADE;
DROP TABLE IF EXISTS factories         CASCADE;

DROP VIEW IF EXISTS view_production_queue  CASCADE;
DROP VIEW IF EXISTS view_order_details     CASCADE;
DROP VIEW IF EXISTS view_abandoned_carts   CASCADE;
DROP VIEW IF EXISTS view_customer_summary  CASCADE;
DROP VIEW IF EXISTS view_analytics_daily   CASCADE;

DROP SEQUENCE IF EXISTS order_number_seq;
DROP FUNCTION  IF EXISTS mark_abandoned_carts();
DROP FUNCTION  IF EXISTS update_customer_stats(uuid);
DROP FUNCTION  IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER   IF EXISTS on_auth_user_created ON auth.users;

-- =============================================================================
-- 1. ORDER NUMBER SEQUENCE
-- Generates PW-1001, PW-1002 … automatically at insert time.
-- Starting at 1001 so the business doesn't look brand new.
-- =============================================================================
CREATE SEQUENCE order_number_seq START WITH 1001 INCREMENT BY 1 NO CYCLE;

-- =============================================================================
-- 2. PROFILES  (admin users only — extends auth.users)
-- =============================================================================
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  full_name  text,
  role       text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile row when an auth user is added in Supabase dashboard
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 3. CUSTOMERS
-- One row per unique buyer email. Source of truth for support + retargeting.
-- marketing_source = first utm_source that brought them in.
-- tags = ['repeat_buyer', 'sample_only', 'high_value', 'installer_required']
-- =============================================================================
CREATE TABLE customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  name                text,
  phone               text,
  marketing_source    text,                   -- first utm_source (Meta, Google, organic…)
  marketing_opt_in    boolean NOT NULL DEFAULT false,
  tags                text[] NOT NULL DEFAULT '{}',
  total_orders        int NOT NULL DEFAULT 0,
  total_spent_cents   bigint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz
);

CREATE INDEX customers_email      ON customers(email);
CREATE INDEX customers_created_at ON customers(created_at DESC);

-- =============================================================================
-- 4. SESSIONS
-- One UUID per browser (stored in localStorage). Captures full UTM attribution
-- and click IDs at the moment a visitor first lands — before they buy anything.
-- =============================================================================
CREATE TABLE sessions (
  id             uuid PRIMARY KEY,              -- client-generated, stored in localStorage
  customer_id    uuid REFERENCES customers(id) ON DELETE SET NULL,
  -- UTM attribution
  utm_source     text,                           -- meta / google / instagram / email / organic
  utm_medium     text,                           -- paid / cpc / social / email / organic
  utm_campaign   text,                           -- campaign name
  utm_content    text,                           -- ad creative / variant
  utm_term       text,                           -- search keyword (Google)
  -- Ad platform click IDs (needed for CAPI and Google Ads conversion import)
  fbclid         text,                           -- Facebook Click ID
  gclid          text,                           -- Google Click ID
  -- Entry point
  landing_page   text,                           -- first URL they hit (e.g. /config, /)
  referrer       text,                           -- HTTP referrer
  user_agent     text,
  first_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_customer_id ON sessions(customer_id);
CREATE INDEX sessions_utm_source  ON sessions(utm_source);
CREATE INDEX sessions_fbclid      ON sessions(fbclid);

-- =============================================================================
-- 5. PAYMENTS
-- One row per PayFast transaction. gateway_payment_id is the pf_payment_id
-- returned by PayFast — the thing you previously couldn't find.
-- =============================================================================
CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway             text NOT NULL DEFAULT 'payfast'
                        CHECK (gateway IN ('payfast', 'manual', 'voucher', 'other')),
  gateway_payment_id  text,                     -- pf_payment_id from PayFast ITN
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  amount_cents        bigint NOT NULL,
  currency            text NOT NULL DEFAULT 'ZAR',
  order_numbers       text[],                    -- ['PW-1001', 'PW-1002'] for multi-item carts
  raw_payload         jsonb,                     -- full ITN payload for debugging
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_gateway_payment_id ON payments(gateway_payment_id);
CREATE INDEX payments_status             ON payments(status);
CREATE INDEX payments_created_at         ON payments(created_at DESC);

-- =============================================================================
-- 6. DISCOUNT CODES
-- Simple promo codes. type = 'percent' (0–100) or 'fixed' (ZAR cents).
-- =============================================================================
CREATE TABLE discount_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE,         -- uppercase, e.g. 'LAUNCH10'
  type             text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value            numeric NOT NULL,              -- 10 = 10% off | 10000 = R100 off
  min_order_cents  bigint NOT NULL DEFAULT 0,
  max_uses         int,                           -- NULL = unlimited
  used_count       int NOT NULL DEFAULT 0,
  expires_at       timestamptz,                   -- NULL = never
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX discount_codes_code ON discount_codes(code);

-- =============================================================================
-- 7. CARTS
-- One active cart per session. Lifecycle: active → converted | abandoned.
-- =============================================================================
CREATE TABLE carts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'converted', 'abandoned', 'dismissed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  abandoned_at timestamptz
);

CREATE INDEX carts_session_id  ON carts(session_id);
CREATE INDEX carts_customer_id ON carts(customer_id);
CREATE INDEX carts_status      ON carts(status);
CREATE INDEX carts_updated_at  ON carts(updated_at DESC);

-- =============================================================================
-- 8. CART ITEMS
-- Synced from the browser on every cart change (debounced, ~900ms).
-- spec stores product data without image blobs.
-- =============================================================================
CREATE TABLE cart_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id          uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_type     text NOT NULL CHECK (product_type IN ('wallpaper', 'sample_pack')),
  quantity         int NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL,
  subtotal_cents   bigint NOT NULL,
  spec             jsonb NOT NULL DEFAULT '{}',   -- { width_m, height_m, wall_count, style, application, walls[] }
  client_item_id   text,                          -- matches localStorage item id (pw-xxxx)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cart_items_cart_id ON cart_items(cart_id);

-- =============================================================================
-- 9. ORDERS
-- One row per line item (one per cart item at checkout).
-- Keeps a full snapshot of customer + address so print ops work even if the
-- customer later changes their details.
--
-- Key fields for each pillar:
--   Pillar 1 (Production): product_type, application_method, wall_*, image_url,
--                          wallpaper_style, status, shipping_notes
--   Pillar 2 (Support):    customer_*, address_*, notes, activity log
--   Pillar 3 (Analytics):  utm_*, fbclid, gclid, discount_*, total_cents
-- =============================================================================
CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Human-readable sequential ID, DB-generated (PW-1001, PW-1002 …)
  order_number          text NOT NULL UNIQUE
                          DEFAULT ('PW-' || nextval('order_number_seq')::text),

  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN (
                            'pending',      -- awaiting payment
                            'new',          -- payment confirmed, not yet in production
                            'in_production',-- being printed
                            'shipped',      -- dispatched
                            'delivered',    -- confirmed received
                            'cancelled'     -- cancelled / refunded
                          )),

  -- FK links (all nullable — checkout flow writes them, never blocks order creation)
  customer_id           uuid REFERENCES customers(id) ON DELETE SET NULL,
  cart_id               uuid REFERENCES carts(id)     ON DELETE SET NULL,
  session_id            uuid REFERENCES sessions(id)  ON DELETE SET NULL,
  payment_id            uuid REFERENCES payments(id)  ON DELETE SET NULL,

  -- ── Customer snapshot ─────────────────────────────────────────────────────
  customer_name         text NOT NULL,
  customer_email        text NOT NULL,
  customer_phone        text NOT NULL,
  address_line1         text NOT NULL,
  address_line2         text,
  city                  text NOT NULL,
  province              text NOT NULL,
  postal_code           text NOT NULL,

  -- ── Product ───────────────────────────────────────────────────────────────
  product_type          text NOT NULL DEFAULT 'wallpaper'
                          CHECK (product_type IN ('wallpaper', 'sample_pack')),
  quantity              int NOT NULL DEFAULT 1,

  -- Wallpaper-specific (NULL for sample_pack)
  wall_count            int NOT NULL DEFAULT 1,
  wall_width_m          numeric,
  wall_height_m         numeric,
  total_sqm             numeric,
  image_url             text,
  image_urls            jsonb NOT NULL DEFAULT '[]',
  walls_spec            jsonb,              -- [{ widthM, heightM }, …]
  wallpaper_type        text
                          CHECK (wallpaper_type IS NULL
                            OR wallpaper_type IN ('traditional','peel_and_stick')),
  wallpaper_style       text
                          CHECK (wallpaper_style IS NULL
                            OR wallpaper_style IN ('satin','matte','linen')),
  -- INSTALLER FLAG: when 'pro_installer', production team knows to flag for external follow-up
  application_method    text
                          CHECK (application_method IS NULL
                            OR application_method IN ('diy','diy_kit','pro_installer')),

  -- ── Financials ────────────────────────────────────────────────────────────
  subtotal_cents        bigint NOT NULL,
  shipping_cents        bigint NOT NULL DEFAULT 0,
  discount_cents        bigint NOT NULL DEFAULT 0,   -- amount saved by discount code
  total_cents           bigint NOT NULL,
  discount_code         text,                        -- applied code, if any

  -- ── Attribution snapshot (from session at checkout) ────────────────────────
  -- Lets you calculate revenue-per-campaign without joining to sessions.
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  utm_content           text,
  fbclid                text,   -- needed for Meta CAPI Purchase event
  gclid                 text,   -- needed for Google Ads conversion import

  -- ── Admin / ops ───────────────────────────────────────────────────────────
  shipping_notes        text,   -- internal: e.g. "left with neighbour", "re-delivery needed"
  notes                 text,   -- internal: any production or customer notes

  -- ── Lifecycle ─────────────────────────────────────────────────────────────
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  refunded_at           timestamptz,
  deleted_at            timestamptz,          -- soft-delete / archive
  last_activity_at      timestamptz,
  last_activity_preview text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_status           ON orders(status);
CREATE INDEX orders_customer_id      ON orders(customer_id);
CREATE INDEX orders_payment_id       ON orders(payment_id);
CREATE INDEX orders_cart_id          ON orders(cart_id);
CREATE INDEX orders_created_at       ON orders(created_at DESC);
CREATE INDEX orders_deleted_at       ON orders(deleted_at);
CREATE INDEX orders_last_activity_at ON orders(last_activity_at DESC);
CREATE INDEX orders_utm_source       ON orders(utm_source);
CREATE INDEX orders_application_method ON orders(application_method);

-- =============================================================================
-- 10. ORDER ITEMS
-- Normalised line items attached to each order. spec mirrors cart_items.spec
-- but also includes image_urls after upload.
-- =============================================================================
CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_type     text NOT NULL CHECK (product_type IN ('wallpaper', 'sample_pack')),
  quantity         int NOT NULL DEFAULT 1,
  unit_price_cents bigint NOT NULL,
  subtotal_cents   bigint NOT NULL,
  spec             jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_items_order_id ON order_items(order_id);

-- =============================================================================
-- 11. ORDER ACTIVITY
-- Append-only audit log. Every status change, edit, note recorded here.
-- actor_email is a snapshot — no FK to profiles so it survives staff changes.
-- =============================================================================
CREATE TABLE order_activity (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_email  text NOT NULL,             -- who did it
  action       text NOT NULL CHECK (action IN (
    'created', 'status_change', 'note',
    'address_edit', 'customer_edit', 'spec_edit',
    'shipped', 'cancelled', 'refunded',
    'archived', 'restored'
  )),
  old_value    text,
  new_value    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX order_activity_order_id   ON order_activity(order_id);
CREATE INDEX order_activity_created_at ON order_activity(created_at DESC);

-- =============================================================================
-- 12. SCHEDULED EMAILS
-- Queue of customer-facing emails. Sending service (Resend/SendGrid/Klaviyo)
-- polls this table or is triggered by a cron job.
-- =============================================================================
CREATE TABLE scheduled_emails (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  order_id    uuid REFERENCES orders(id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN (
    'order_confirmed',    -- immediate: payment received
    'order_shipped',      -- immediate: status → shipped
    'order_delivered',    -- immediate: status → delivered
    'abandoned_cart',     -- 3h after cart abandoned with email identified
    'review_request',     -- 7d after delivered_at
    'win_back'            -- 60d after last order with no new order
  )),
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  send_at     timestamptz NOT NULL,       -- when to send (now() for immediate)
  sent_at     timestamptz,
  subject     text,
  metadata    jsonb NOT NULL DEFAULT '{}', -- extra data for the template
  error       text,                        -- if failed, store the error message
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scheduled_emails_status  ON scheduled_emails(status);
CREATE INDEX scheduled_emails_send_at ON scheduled_emails(send_at);
CREATE INDEX scheduled_emails_type    ON scheduled_emails(type);

-- =============================================================================
-- 13. META CAPI EVENTS
-- Server-side events queue for Meta Conversions API.
-- Built now, wired to Meta when Pixel + access token are ready.
-- Purchase events sent here recover ~20–40% of conversions Meta can't see
-- due to iOS14 / ad blockers.
-- =============================================================================
CREATE TABLE capi_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text NOT NULL CHECK (event_type IN (
    'Purchase', 'InitiateCheckout', 'AddToCart', 'ViewContent', 'Lead'
  )),
  order_id     uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_id  uuid REFERENCES customers(id) ON DELETE SET NULL,
  fbclid       text,                      -- from session/order
  event_id     text,                      -- dedup key sent to Meta
  value_cents  bigint,
  currency     text NOT NULL DEFAULT 'ZAR',
  payload      jsonb NOT NULL DEFAULT '{}', -- full event payload
  sent_at      timestamptz,
  response     jsonb,                     -- Meta API response
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'sent', 'failed')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX capi_events_status     ON capi_events(status);
CREATE INDEX capi_events_event_type ON capi_events(event_type);
CREATE INDEX capi_events_created_at ON capi_events(created_at DESC);

-- =============================================================================
-- 14. EVENTS  (general analytics / funnel tracking)
-- type: session.start | cart.updated | cart.abandoned | customer.identified |
--       checkout.initiated | order.created | payment.completed | payment.failed
-- =============================================================================
CREATE TABLE events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  session_id  uuid REFERENCES sessions(id)   ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id)  ON DELETE SET NULL,
  cart_id     uuid REFERENCES carts(id)      ON DELETE SET NULL,
  order_id    uuid REFERENCES orders(id)     ON DELETE SET NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_type        ON events(type);
CREATE INDEX events_session_id  ON events(session_id);
CREATE INDEX events_customer_id ON events(customer_id);
CREATE INDEX events_order_id    ON events(order_id);
CREATE INDEX events_created_at  ON events(created_at DESC);

-- =============================================================================
-- 15. FUNCTIONS
-- =============================================================================

-- Called via pg_cron every hour. Returns count of carts marked abandoned.
-- Enable pg_cron in Supabase → Database → Extensions, then:
--   SELECT cron.schedule('abandon-carts', '0 * * * *', 'SELECT mark_abandoned_carts()');
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS int AS $$
DECLARE n int;
BEGIN
  UPDATE carts
  SET status = 'abandoned', abandoned_at = now()
  WHERE status = 'active'
    AND updated_at < now() - interval '3 hours'
    AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.cart_id = carts.id);
  GET DIAGNOSTICS n = ROW_COUNT;

  -- Queue abandoned_cart emails for identified customers
  INSERT INTO scheduled_emails (customer_id, type, send_at, metadata)
  SELECT DISTINCT
    ca.customer_id,
    'abandoned_cart',
    now() + interval '30 minutes',
    jsonb_build_object('cart_id', ca.id)
  FROM carts ca
  WHERE ca.status = 'abandoned'
    AND ca.customer_id IS NOT NULL
    AND ca.abandoned_at >= now() - interval '10 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_emails se
      WHERE se.customer_id = ca.customer_id
        AND se.type = 'abandoned_cart'
        AND se.created_at > now() - interval '24 hours'
    );

  RETURN n;
END;
$$ LANGUAGE plpgsql;

-- Recalculates lifetime stats after a payment is confirmed.
CREATE OR REPLACE FUNCTION update_customer_stats(p_customer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET
    total_orders      = (SELECT COUNT(*) FROM orders
                         WHERE customer_id = p_customer_id AND status != 'pending'),
    total_spent_cents = (SELECT COALESCE(SUM(total_cents), 0) FROM orders
                         WHERE customer_id = p_customer_id AND status != 'pending'),
    updated_at        = now()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 16. VIEWS  (security_invoker = true → respects caller RLS, no dashboard warnings)
-- =============================================================================

-- PILLAR 1: Production queue — what the production team sees each morning.
-- Shows all new / in-production orders with everything needed to print and ship.
-- Installer orders are flagged clearly.
CREATE OR REPLACE VIEW view_production_queue WITH (security_invoker = true) AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.product_type,
  o.quantity,
  o.customer_name,
  o.customer_phone,
  o.city,
  o.province,
  o.postal_code,
  o.wall_count,
  o.wall_width_m,
  o.wall_height_m,
  o.total_sqm,
  o.image_url,
  o.image_urls,
  o.walls_spec,
  o.wallpaper_type,
  o.wallpaper_style,
  o.application_method,
  o.application_method = 'pro_installer' AS needs_installer,  -- quick flag
  o.shipping_notes,
  o.notes,
  o.total_cents,
  o.created_at,
  o.shipped_at
FROM orders o
WHERE o.status IN ('new', 'in_production')
  AND o.deleted_at IS NULL
ORDER BY o.created_at ASC;  -- oldest first = longest waiting

-- PILLAR 2: Full order detail for customer support.
-- Customer email + payment reference visible in one row.
CREATE OR REPLACE VIEW view_order_details WITH (security_invoker = true) AS
SELECT
  o.id,
  o.order_number,
  o.status,
  o.product_type,
  o.quantity,
  o.customer_name,
  o.customer_email,
  o.customer_phone,
  o.address_line1,
  o.address_line2,
  o.city,
  o.province,
  o.postal_code,
  o.wall_count,
  o.wall_width_m,
  o.wall_height_m,
  o.total_sqm,
  o.wallpaper_type,
  o.wallpaper_style,
  o.application_method,
  o.application_method = 'pro_installer' AS needs_installer,
  o.subtotal_cents,
  o.shipping_cents,
  o.discount_cents,
  o.discount_code,
  o.total_cents,
  o.utm_source,
  o.utm_campaign,
  o.shipping_notes,
  o.notes,
  o.created_at,
  o.shipped_at,
  o.delivered_at,
  o.refunded_at,
  -- Payment (the thing you previously couldn't find)
  p.gateway_payment_id,
  p.status           AS payment_status,
  p.gateway          AS payment_gateway,
  -- Customer lifetime
  c.total_orders     AS customer_total_orders,
  c.total_spent_cents AS customer_total_spent
FROM orders o
LEFT JOIN payments  p ON p.id = o.payment_id
LEFT JOIN customers c ON c.id = o.customer_id
WHERE o.deleted_at IS NULL;

-- PILLAR 2: Customer summary — lookup any buyer by email.
CREATE OR REPLACE VIEW view_customer_summary WITH (security_invoker = true) AS
SELECT
  c.id,
  c.email,
  c.name,
  c.phone,
  c.tags,
  c.marketing_source,
  c.total_orders,
  c.total_spent_cents,
  c.created_at,
  c.last_seen_at,
  (SELECT o.order_number FROM orders o
   WHERE o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 1) AS last_order_number,
  (SELECT o.status FROM orders o
   WHERE o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 1) AS last_order_status,
  (SELECT o.created_at FROM orders o
   WHERE o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 1) AS last_order_at,
  -- Active or abandoned cart?
  (SELECT ca.status FROM carts ca
   WHERE ca.customer_id = c.id ORDER BY ca.updated_at DESC LIMIT 1) AS latest_cart_status,
  (SELECT SUM(ci.subtotal_cents) FROM cart_items ci
   JOIN carts ca ON ca.id = ci.cart_id
   WHERE ca.customer_id = c.id AND ca.status IN ('active','abandoned')) AS open_cart_value_cents
FROM customers c
ORDER BY c.total_spent_cents DESC;

-- PILLAR 2: Abandoned carts — for proactive support outreach.
CREATE OR REPLACE VIEW view_abandoned_carts WITH (security_invoker = true) AS
SELECT
  ca.id          AS cart_id,
  ca.status,
  ca.updated_at,
  ca.abandoned_at,
  cu.email       AS customer_email,
  cu.name        AS customer_name,
  cu.phone       AS customer_phone,
  s.utm_source,
  s.utm_campaign,
  COALESCE((SELECT SUM(ci.subtotal_cents) FROM cart_items ci WHERE ci.cart_id = ca.id), 0) AS cart_value_cents,
  (SELECT COUNT(*) FROM cart_items ci WHERE ci.cart_id = ca.id) AS item_count
FROM carts ca
LEFT JOIN sessions  s  ON s.id  = ca.session_id
LEFT JOIN customers cu ON cu.id = ca.customer_id
WHERE ca.status IN ('active', 'abandoned')
ORDER BY ca.updated_at DESC;

-- PILLAR 3: Daily analytics — revenue, orders, AOV per day per channel.
CREATE OR REPLACE VIEW view_analytics_daily WITH (security_invoker = true) AS
SELECT
  DATE(o.created_at)  AS day,
  o.utm_source,
  o.utm_campaign,
  COUNT(*)            AS order_count,
  SUM(o.total_cents)  AS revenue_cents,
  AVG(o.total_cents)  AS avg_order_value_cents,
  SUM(o.total_sqm)    AS total_sqm_printed,
  COUNT(*) FILTER (WHERE o.product_type = 'sample_pack') AS sample_pack_orders,
  COUNT(*) FILTER (WHERE o.application_method = 'pro_installer') AS installer_orders
FROM orders o
WHERE o.status NOT IN ('pending', 'cancelled')
  AND o.deleted_at IS NULL
GROUP BY DATE(o.created_at), o.utm_source, o.utm_campaign
ORDER BY day DESC;

-- =============================================================================
-- 17. ROW LEVEL SECURITY
-- Simplified: anon = server API routes (checkout, cart sync, webhooks)
--             authenticated = admin dashboard
-- =============================================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_own_profile"     ON profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CUSTOMERS (server routes use anon key; admin reads all)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_write_customers"  ON customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_customers"    ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SESSIONS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_sessions"    ON sessions FOR ALL TO anon    USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_sessions"    ON sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PAYMENTS (payfast webhook = anon; admin reads)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_write_payments"  ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_payments"    ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DISCOUNT CODES (anon can select to validate at checkout; admin manages)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_discounts" ON discount_codes FOR SELECT TO anon USING (active = true);
CREATE POLICY "anon_update_discounts" ON discount_codes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_discounts"    ON discount_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CARTS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_carts"       ON carts FOR ALL TO anon          USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_carts"       ON carts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CART ITEMS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_cart_items"  ON cart_items FOR ALL TO anon     USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_cart_items"  ON cart_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ORDERS (anon: checkout + payfast webhook; authenticated: admin)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_orders"   ON orders FOR INSERT TO anon  WITH CHECK (true);
CREATE POLICY "anon_update_orders"   ON orders FOR UPDATE TO anon  USING (true) WITH CHECK (true);
CREATE POLICY "anon_select_orders"   ON orders FOR SELECT TO anon  USING (true);
CREATE POLICY "auth_all_orders"      ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ORDER ITEMS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_order_items"    ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ORDER ACTIVITY
ALTER TABLE order_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_activity"    ON order_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SCHEDULED EMAILS (anon writes; admin reads/updates)
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_emails"          ON scheduled_emails FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_scheduled_emails" ON scheduled_emails FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_emails"             ON scheduled_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CAPI EVENTS
ALTER TABLE capi_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_capi"     ON capi_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_all_capi"        ON capi_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_events"   ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_all_events"      ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- Done.
--
-- After running this file:
--   1. Go to Supabase → Auth → Users → Add user (your email + password)
--   2. Run: INSERT INTO profiles (id, email, full_name)
--           SELECT id, email, 'Your Name' FROM auth.users WHERE email = 'you@email.com';
--   3. Enable pg_cron: Database → Extensions → pg_cron, then:
--      SELECT cron.schedule('abandon-carts','0 * * * *','SELECT mark_abandoned_carts()');
-- =============================================================================
