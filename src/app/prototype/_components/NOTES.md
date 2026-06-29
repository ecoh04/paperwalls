# Redesign prototype — PDP + configurator-entry

> THROWAWAY. Not wired to cart/checkout/Supabase. No real data, no mutations.
> Route names contain "prototype" on purpose. Each route is noindex/nofollow.
> Do not ship.

## Question being answered

The funnel has two big leaks above the cart:

1. **PDP -> configurator: 87% of PDP visitors never open the configurator.**
2. **Configurator -> image upload: 79% of people who open it never upload an image.**

The upload step is the wall. People land on the PDP, never engage, and the
ones who do engage hit a blank "upload your photo" gate and bounce. Each
variant below attacks both leaks with a structurally different PDP hero AND a
different configurator-ENTRY experience (the part that decides whether someone
gets past the upload gate).

## The three variants — one hidden route each, no switcher

Each variant now lives at its own hidden route and renders only its PDP body
(the real site header comes from the root layout, so they read like real
product pages for a clean side-by-side comparison):

- **`/prototype/pdp-samples` — Variant A — Samples-first (lower the commitment).**
  Hero leads with the sample pack as the cheap, low-risk entry (R300, R150 back
  on first order) instead of asking for a buying decision. Config-entry leads
  with "start from one of our designs" (template gallery, no upload needed);
  "upload your own photo" is the secondary path. Removes the upload as a gate by
  making it optional.

- **`/prototype/pdp-preview` — Variant B — Preview-first / see it on your wall
  (visual-led).** Hero IS a room mockup with a design already on the wall and a
  thumbnail strip to swap designs instantly. Primary CTA "See it on your wall."
  Config-entry is preview-led: the room preview is the centrepiece, a template
  is already applied by default, and "upload your own" lives *inside* the
  preview as an option, never a gate.

- **`/prototype/pdp-guided` — Variant C — Guided steps / clarity-led.** Hero
  leads with a crisp value prop and a prominent 3-step "how it works", one
  strong CTA "Design yours in 2 minutes." Config-entry is a guided stepper;
  step 1 puts "Use our designs" and "Upload your own" side by side as EQUAL
  choices, plus an "email me my design and price" save-progress capture so an
  undecided visitor isn't lost.

All three reuse the live brand system (pw-* Tailwind tokens, pw-* typography
classes, Satoshi) so they read as PaperWalls, not generic.

## Structure

- `pdp-samples/page.tsx`, `pdp-preview/page.tsx`, `pdp-guided/page.tsx` — the
  three hidden routes. Each imports its one variant from `_components/` and
  renders it directly.
- `_components/` (leading underscore = not a route) holds `VariantA.tsx`,
  `VariantB.tsx`, `VariantC.tsx`, `shared.tsx`, and this `NOTES.md`.
