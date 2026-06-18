-- Capture the real Meta _fbp / _fbc cookies onto each order so the PayFast
-- webhook can include them in the server-side Purchase CAPI event. This lifts
-- Event Match Quality well above the fbclid-only signal we had before.
-- Additive + nullable; existing orders backfill as null.
alter table public.orders
  add column if not exists fbp text,
  add column if not exists fbc text;

comment on column public.orders.fbp is 'Meta _fbp browser cookie captured at checkout (for CAPI match quality)';
comment on column public.orders.fbc is 'Meta _fbc click cookie captured at checkout (for CAPI match quality)';
