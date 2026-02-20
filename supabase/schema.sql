-- PaperWalls: Orders table for Supabase
-- Run this in Supabase Dashboard → SQL Editor → New query, then Run.

-- Orders: one row per purchase
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,

  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,

  address_line1 text not null,
  address_line2 text,
  city text not null,
  province text not null,
  postal_code text not null,

  wall_width_m numeric not null,
  wall_height_m numeric not null,
  wall_count int not null default 1,
  total_sqm numeric not null,
  image_url text not null,
  image_urls jsonb default '[]',
  walls_spec jsonb,

  wallpaper_style text not null check (wallpaper_style in ('matte', 'satin', 'textured', 'premium')),
  application_method text not null check (application_method in ('diy', 'diy_kit', 'installer')),

  subtotal_cents bigint not null,
  shipping_cents bigint not null,
  total_cents bigint not null,

  status text not null default 'pending' check (status in ('pending', 'new', 'in_production', 'shipped', 'delivered')),
  stitch_payment_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for admin: list orders by date and filter by status
create index if not exists orders_created_at_desc on orders (created_at desc);
create index if not exists orders_status on orders (status);

-- Optional: auto-update updated_at (run this if you want automatic timestamps)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- Enable Row Level Security (RLS) so we can later restrict who can read/write
alter table orders enable row level security;

-- Allow anonymous insert (checkout creates orders) and select by service role only
-- For now: allow all for anon key so app can insert and we can read in admin with same key
-- You can tighten this later when you add proper admin auth
create policy "Allow insert for anon" on orders for insert to anon with check (true);
create policy "Allow select for anon" on orders for select to anon using (true);
create policy "Allow update for anon" on orders for update to anon using (true);
