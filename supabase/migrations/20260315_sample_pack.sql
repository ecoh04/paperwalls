-- =============================================================================
-- PaperWalls: Add sample_pack product type support
-- Run after 20260222_order_management_full.sql
-- =============================================================================

-- 1. New columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'wallpaper'
  CHECK (product_type IN ('wallpaper', 'sample_pack'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity int NOT NULL DEFAULT 1;

-- 2. Make wallpaper-specific columns nullable
--    (they do not apply to sample_pack orders)
ALTER TABLE orders ALTER COLUMN wall_width_m  DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN wall_height_m DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN total_sqm     DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN image_url     DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN wallpaper_style    DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN application_method DROP NOT NULL;

-- 3. Relax CHECK constraints to allow NULL for non-wallpaper rows
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_wallpaper_style_check;
ALTER TABLE orders ADD CONSTRAINT orders_wallpaper_style_check
  CHECK (wallpaper_style IS NULL OR wallpaper_style IN ('matte', 'satin', 'textured', 'premium'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_application_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_application_method_check
  CHECK (application_method IS NULL OR application_method IN ('diy', 'diy_kit', 'installer'));

-- =============================================================================
-- Done. Existing wallpaper rows are unaffected (product_type defaults to
-- 'wallpaper'; all their required fields remain populated).
-- =============================================================================
