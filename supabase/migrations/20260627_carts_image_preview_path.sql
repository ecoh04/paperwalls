-- Abandoned-cart email preview. Stores the storage PATH of a downscaled cart
-- preview JPEG (in the private print-files bucket); the email drainer signs it
-- at send time. Additive + nullable: zero impact on cart sync or checkout.
-- Applied 2026-06-27 via the Supabase MCP; mirrored here for version control.

alter table public.carts add column if not exists image_preview_path text;

comment on column public.carts.image_preview_path is 'Storage path in the private print-files bucket for a downscaled cart preview JPEG, shown in the abandoned-cart email. Nullable, best-effort upload at cart-sync; the drainer signs it at send time. Never used by checkout.';
