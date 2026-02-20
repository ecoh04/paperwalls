-- =============================================================================
-- PaperWalls: Full Supabase setup (run once in SQL Editor)
-- =============================================================================
-- Run this entire file in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run on a new project or to add missing pieces to an existing one.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ORDERS TABLE
-- -----------------------------------------------------------------------------
-- One row per order. Each order = one customer + one address + that order's
-- print image(s). So "right image to right user" is automatic: order_number
-- and image_url(s) are on the same row as customer_* and address_*.

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,

  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,

  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,

  wall_width_m numeric NOT NULL,
  wall_height_m numeric NOT NULL,
  wall_count int NOT NULL DEFAULT 1,
  total_sqm numeric NOT NULL,
  image_url text NOT NULL,
  image_urls jsonb DEFAULT '[]',
  walls_spec jsonb,

  wallpaper_style text NOT NULL CHECK (wallpaper_style IN ('matte', 'satin', 'textured', 'premium')),
  application_method text NOT NULL CHECK (application_method IN ('diy', 'diy_kit', 'installer')),

  subtotal_cents bigint NOT NULL,
  shipping_cents bigint NOT NULL,
  total_cents bigint NOT NULL,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'new', 'in_production', 'shipped', 'delivered')),
  stitch_payment_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- If table already existed without these columns, add them
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS walls_spec jsonb;

-- Allow 'pending' status (for checkout before payment)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'new', 'in_production', 'shipped', 'delivered'));

-- Indexes for admin list and webhook lookup
CREATE INDEX IF NOT EXISTS orders_created_at_desc ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status ON orders (status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (ORDERS)
-- -----------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert for anon" ON orders;
CREATE POLICY "Allow insert for anon" ON orders FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select for anon" ON orders;
CREATE POLICY "Allow select for anon" ON orders FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow update for anon" ON orders;
CREATE POLICY "Allow update for anon" ON orders FOR UPDATE TO anon USING (true);

-- -----------------------------------------------------------------------------
-- 3. STORAGE BUCKET (PRINT IMAGES)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-files', 'print-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow app (anon) to upload to print-files
DROP POLICY IF EXISTS "Allow anon upload to print-files" ON storage.objects;
CREATE POLICY "Allow anon upload to print-files"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'print-files');

-- Allow public read so image URLs work for factory
DROP POLICY IF EXISTS "Allow public read print-files" ON storage.objects;
CREATE POLICY "Allow public read print-files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'print-files');

-- =============================================================================
-- Done. Orders table and print-files bucket are ready.
-- =============================================================================
