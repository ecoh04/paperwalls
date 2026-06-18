-- Persist the buyer's real client IP (captured at checkout, on their request)
-- onto the order, so the PayFast ITN webhook can attach it to the server-side
-- Purchase CAPI event. The webhook itself sees PayFast's server IP, which is
-- useless/harmful for matching, so we must store the buyer's IP at checkout.
-- Additive + nullable.
alter table public.orders
  add column if not exists client_ip text;

comment on column public.orders.client_ip is 'Buyer real client IP captured at checkout (for the webhook Purchase CAPI match quality; never the PayFast server IP)';
