-- =============================================================================
-- PaperWalls: Factory ops – factories, profiles, activity log, order dates
-- Run in Supabase SQL Editor after full-setup.sql. Safe to run once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FACTORIES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

INSERT INTO factories (code, name) VALUES
  ('jhb', 'Johannesburg'),
  ('cpt', 'Cape Town'),
  ('kzn', 'KwaZulu-Natal')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. PROFILES (extends auth.users – one row per admin/factory user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  factory_id uuid REFERENCES factories(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'factory_staff' CHECK (role IN ('admin', 'factory_staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_factory_id ON profiles(factory_id);

-- Trigger: create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'factory_staff'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. ORDERS – new columns (assigned factory, shipped/delivered dates)
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_factory_id uuid REFERENCES factories(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_assigned_factory_id ON orders(assigned_factory_id);
CREATE INDEX IF NOT EXISTS orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS orders_delivered_at ON orders(delivered_at);

-- -----------------------------------------------------------------------------
-- 4. ORDER ACTIVITY LOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('status_change', 'assigned', 'note', 'created')),
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_activity_order_id ON order_activity(order_id);
CREATE INDEX IF NOT EXISTS order_activity_created_at ON order_activity(created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. RLS – PROFILES
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile name" ON profiles;
CREATE POLICY "Users can update own profile name" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 6. RLS – FACTORIES (authenticated and anon can read – anon for checkout assignment)
-- -----------------------------------------------------------------------------
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read factories" ON factories;
CREATE POLICY "Authenticated read factories" ON factories FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon read factories" ON factories;
CREATE POLICY "Anon read factories" ON factories FOR SELECT TO anon USING (true);

-- -----------------------------------------------------------------------------
-- 7. RLS – ORDERS (anon for checkout/webhook; authenticated for admin)
-- Keep existing anon INSERT/UPDATE for checkout and webhook.
-- Add authenticated SELECT/UPDATE for factory users (by factory or admin).
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select for anon" ON orders;
-- Authenticated: admin sees all; factory_staff sees own factory or unassigned
DROP POLICY IF EXISTS "Admin or same factory can select orders" ON orders;
CREATE POLICY "Admin or same factory can select orders" ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR profiles.factory_id = orders.assigned_factory_id
        OR (orders.assigned_factory_id IS NULL)
      )
    )
  );

-- Anon can still update (Stitch webhook)
DROP POLICY IF EXISTS "Allow update for anon" ON orders;
CREATE POLICY "Allow update for anon" ON orders FOR UPDATE TO anon USING (true);

-- Authenticated: admin or same factory can select and update
DROP POLICY IF EXISTS "Admin or same factory can update orders" ON orders;
CREATE POLICY "Admin or same factory can update orders" ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.factory_id = orders.assigned_factory_id OR orders.assigned_factory_id IS NULL)
    )
  )
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8. RLS – ORDER_ACTIVITY
-- -----------------------------------------------------------------------------
ALTER TABLE order_activity ENABLE ROW LEVEL SECURITY;

-- Select: same as orders (can see activity for orders you can see)
DROP POLICY IF EXISTS "Can select activity for visible orders" ON order_activity;
CREATE POLICY "Can select activity for visible orders" ON order_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = order_activity.order_id
      AND (p.role = 'admin' OR p.factory_id = o.assigned_factory_id OR o.assigned_factory_id IS NULL)
    )
  );

-- Insert: authenticated (when changing an order you can see)
DROP POLICY IF EXISTS "Can insert activity for visible orders" ON order_activity;
CREATE POLICY "Can insert activity for visible orders" ON order_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM orders o
      JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = order_activity.order_id
      AND (p.role = 'admin' OR p.factory_id = o.assigned_factory_id OR o.assigned_factory_id IS NULL)
    )
  );

-- -----------------------------------------------------------------------------
-- 9. DEFAULT ASSIGN FACTORY BY PROVINCE (optional – run once to backfill)
-- JHB: gauteng, limpopo, mpumalanga, north_west, free_state
-- CPT: western_cape
-- KZN: kwaZulu_natal, eastern_cape, northern_cape, other
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  jhb_id uuid; cpt_id uuid; kzn_id uuid;
BEGIN
  SELECT id INTO jhb_id FROM factories WHERE code = 'jhb' LIMIT 1;
  SELECT id INTO cpt_id FROM factories WHERE code = 'cpt' LIMIT 1;
  SELECT id INTO kzn_id FROM factories WHERE code = 'kzn' LIMIT 1;

  UPDATE orders SET assigned_factory_id = jhb_id
  WHERE assigned_factory_id IS NULL AND province IN ('gauteng', 'limpopo', 'mpumalanga', 'north_west', 'free_state');

  UPDATE orders SET assigned_factory_id = cpt_id
  WHERE assigned_factory_id IS NULL AND province = 'western_cape';

  UPDATE orders SET assigned_factory_id = kzn_id
  WHERE assigned_factory_id IS NULL AND province IN ('kwaZulu_natal', 'eastern_cape', 'northern_cape', 'other');
END $$;

-- =============================================================================
-- Done. Create users in Supabase Dashboard → Auth → Users, then set profile:
--   INSERT INTO profiles (id, email, full_name, factory_id, role)
--   VALUES ('auth-user-uuid', 'email@...', 'Name', factory_id, 'admin');
-- =============================================================================
