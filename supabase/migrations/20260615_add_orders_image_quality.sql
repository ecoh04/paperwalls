-- Persist the image-resolution verdict the buyer accepted at add-to-cart, so
-- the print team can see e.g. "buyer accepted soft 14dpi" and it serves as a
-- dispute/CPA defence. Null for sample packs and legacy orders.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS image_quality jsonb;
COMMENT ON COLUMN public.orders.image_quality IS
  'Image-resolution verdict accepted by the buyer: { level: good|borderline|too_low, pxPerMm, widthPx, heightPx }. Null for sample packs / legacy.';
