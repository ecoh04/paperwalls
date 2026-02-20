-- Add pending status, image_urls, walls_spec for checkout.
-- Run in Supabase SQL Editor if you already have the main schema.

-- Allow 'pending' status (awaiting payment)
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'new', 'in_production', 'shipped', 'delivered'));

-- Optional: set default to 'pending' for new orders created at checkout
-- alter table orders alter column status set default 'pending';

-- Add image_urls (array of print URLs for multi-wall)
alter table orders add column if not exists image_urls jsonb default '[]';

-- Add walls_spec (per-wall dimensions when different)
alter table orders add column if not exists walls_spec jsonb;

-- Use stitch_payment_id column for Stitch Express payment/transaction id.
