# PaperWalls Brand & Design Guide

A pragmatic reference for keeping the site, emails, social, and pack-ins visually
consistent. Pulled from the live design system (`tailwind.config.ts`,
`src/app/globals.css`, primitives in `src/components/ui/`). Update this file
when those files change.

---

## 1. Voice & visual posture

**Premium-quiet.** Reference points: Aesop, Apartmento, Kinfolk. Confident with
empty space, warm rather than sterile, never loud, never discount-led.

- One brand voice: assured, restrained, plain English. Sells the outcome
  (your wall, transformed) not the product specs.
- Cold-traffic copy leads with **buyer psychology** (transformation, price,
  time, risk, proof). Specs (gsm, dpi, ink chemistry) live deep in the page,
  never in marketing.
- The accent rust orange `#C4622D` is used **sparingly** as punctuation, not
  as paint. White space and the warm cream background do the heavy lifting.

### Things to never do

- **No em or en dashes (`—`, `–`) in any user-facing copy.** Use a period,
  comma, hyphen, or middle dot (`·`) instead. They read as AI-generated.
- **No fabricated reviews, ratings, or claim numbers.** If we haven't
  measured it, we don't write it.
- **No discount stings** (`SALE!`, `LIMITED!`). Premium-quiet means no
  shouting.
- **No spec language in marketing copy.** "200 gsm non-woven" belongs on
  a deep materials page; the hero says "wallpaper that lasts a decade."

---

## 2. Colour palette

All tokens live in `tailwind.config.ts` under the `pw-*` prefix and are
mirrored to CSS custom properties in `globals.css` for legacy classes.
Use the Tailwind classes in new code (`text-pw-ink`, `bg-pw-bg`, etc.).

### Surfaces & ink

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| `--bg`           | `#F8F4EF` | `bg-pw-bg`           | Default page background. Warm off-white. |
| `--surface`      | `#FFFFFF` | `bg-pw-surface`      | Cards, modals, raised panels. |
| `--ink`          | `#1A1714` | `text-pw-ink`, `bg-pw-ink` | Primary text. Dark sections. |
| `--ink-soft`     | `#2E2A26` | `bg-pw-ink-soft`     | Hover state on dark buttons. |
| `--muted`        | `#8A8175` | `text-pw-muted`      | Secondary text, captions. |
| `--muted-light`  | `#B5ADA4` | `text-pw-muted-light`| Tertiary text, footer fine print. |
| `--stone`        | `#E6DFD8` | `bg-pw-stone`        | Soft neutral surface (hero block, dividers). |
| `--stone-dark`   | `#D4C9BE` | `bg-pw-stone-dark`   | Stronger neutral, dashed borders. |

### Accent

| Token | Hex | Tailwind | Role |
|---|---|---|---|
| `--accent`       | `#C4622D` | `text-pw-accent`, `bg-pw-accent`     | Primary accent. Logo `walls`, eyebrows, links. |
| `--accent-soft`  | `#F2E8E1` | `bg-pw-accent-soft`                  | Pale tint behind eyebrow pills, accent-soft cards. |
| `--accent-mid`   | `#E8795A` | `text-pw-accent-mid`                 | Italic emphasis on dark backgrounds. |

### Borders (CSS-var only)

| Token | Value | Role |
|---|---|---|
| `--border`     | `rgba(26,23,20,0.10)` | Standard hairline (0.5px in legacy CSS, 1px in Tailwind). |
| `--border-mid` | `rgba(26,23,20,0.18)` | Stronger borders (active inputs, chip borders). |

### Status colors (used inside admin only)

Pulled from Tailwind defaults, not the brand palette. Admin chrome doesn't
need to be premium; it needs to be legible.

- Green: `bg-green-100 text-green-800` — paid / sent / delivered
- Amber: `bg-amber-100 text-amber-800` — pending / new / preflight warning
- Red:   `bg-red-50 text-red-800`      — errors, failures
- Blue:  `bg-blue-100 text-blue-800`   — in-production / ship form

---

## 3. Typography

**One family, six sizes, two weights.** Hierarchy is `size + weight`, never
font-swap.

### Family

**Satoshi**, by Indian Type Foundry (Fontshare). Loaded from
`api.fontshare.com` with weights 300 / 400 / 500 / 700 / 900.

- Headings use **900** (Black) — confident-luxury character at the heaviest cuts.
- Body uses **400** (Regular).
- Italic is **700** (Bold) so emphasis visually steps back from the surrounding
  900-weight heading rather than thinning out.

```css
font-family: "Satoshi", system-ui, -apple-system, "Segoe UI", sans-serif;
```

### Type scale

Defined as utility classes in `globals.css`. Always use these classes, never
raw `text-{size}` in new components.

| Class | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `pw-display`  | `clamp(44px, 6vw, 72px)` | 900 | 1.02 | -0.04em | Homepage hero H1, dark closing-CTA H2 |
| `pw-h1` / `pw-h2` | `clamp(28px, 3.2vw, 40px)` | 900 | 1.10 | -0.03em | Every section heading and most page H1s |
| `pw-h3`       | 20px                     | 700 | 1.30 | -0.02em | Card titles, accordion questions, sub-section heads |
| `pw-body-lg`  | 18px                     | 400 | 1.55 | -0.005em | Hero subtext, section leads |
| `pw-body`     | 16px                     | 400 | 1.60 | normal  | Default paragraph copy |
| `pw-small`    | 14px                     | 400 | 1.55 | normal  | Captions, helpers, list items, table cells |
| `pw-overline` | 12px                     | 700 | 1.40 | 0.14em (uppercase) | Eyebrow labels above headings. Sparingly. |

### Italic emphasis inside headings

```html
<h1 class="pw-h1 text-pw-ink">
  Wallpaper that&rsquo;s actually <em>yours.</em>
</h1>
```

Italic at 700 inside a 900-weight heading visually recedes. On dark sections
the italic word also colour-shifts to `text-pw-accent-mid` for contrast.

---

## 4. Layout primitives

### `<Section>` — every page section

`src/components/ui/Section.tsx`. Wraps content in a full-bleed background
band with consistent vertical rhythm and a `max-w-7xl` inner container.

```tsx
<Section tone="bg" density="default" id="story">
  ...
</Section>
```

| Prop | Values | Default | Effect |
|---|---|---|---|
| `tone`    | `bg` / `surface` / `ink` / `stone`  | `bg`      | Background color band. |
| `density` | `default` / `tight`                 | `default` | `default` is `py-12 sm:py-16 lg:py-24`. `tight` is `py-8 sm:py-12 lg:py-16` for thin transitional strips. |
| `id`      | string                              | —         | Anchor target for in-page navigation. |

### Page rhythm

- Hero / opening section: `tone="bg"`.
- Major sections alternate `bg` ↔ `surface` for soft contrast.
- One `tone="ink"` dark section per page, usually as the closing CTA. Don't
  use more than one — its weight becomes ordinary if everything is dark.
- `tone="stone"` is for very specific moments (homepage hero panel,
  testimonial backgrounds). Use with intent.

### Inner container

Every section wraps content in `mx-auto max-w-7xl px-5 sm:px-8 lg:px-12`.
Don't override unless the section is intentionally edge-to-edge (a full-bleed
gallery rail, e.g.).

### Border radius scale

| Token | Value | Use |
|---|---|---|
| `rounded-pw`      | 8px  | Buttons, inputs, small chips |
| `rounded-pw-card` | 16px | Cards, image containers, modals |
| `rounded-pw-lg`   | 20px | Big banners, the configurator panel |

### Shadows

Used very sparingly. Premium-quiet design trusts a hairline border over
a drop-shadow.

| Token | Use |
|---|---|
| `shadow-pw-sm` | Resting state on raised cards |
| `shadow-pw-md` | Hover lift on cards |
| `shadow-pw-lg` | The configurator panel only |

---

## 5. Components

### `<Button>` (`src/components/ui/Button.tsx`)

| Variant | Look | Use |
|---|---|---|
| `primary`      | Dark ink fill, white text                      | Hero CTAs, configurator submit, checkout submit |
| `secondary`    | Light, outlined                                | Secondary actions next to primary |
| `ghost`        | Underlined link, muted text                    | Tertiary "or order a sample" type CTAs |
| `ink-on-light` | Same as `primary`                              | Explicit when context is ambiguous |
| `light-on-ink` | White fill, dark text                          | CTAs sitting **on** a dark `tone="ink"` section |

Sizes: `md` is 44px (iOS minimum tap), `lg` is 56px (`h-14`). **Tailwind
does not ship `h-13`** — that was a real bug we fixed; never specify
arbitrary heights.

```tsx
<Button href="/config" variant="primary" size="lg">
  Design your wallpaper
</Button>
```

### `<Eyebrow>` (`src/components/ui/Eyebrow.tsx`)

Small-caps label above section headings. `accent` is rust orange, `muted`
is grey. On dark `ink` sections use `accent-mid` colour explicitly.

```tsx
<Eyebrow>What we believe</Eyebrow>
<Eyebrow variant="muted">Last updated 2026-04-28</Eyebrow>
<Eyebrow className="text-pw-accent-mid">Ready to start?</Eyebrow>
```

### `<SectionHeader>` (`src/components/ui/SectionHeader.tsx`)

Eyebrow + heading + optional body lead, in one calm voice. Use this on
every section instead of free-form headings, for visual consistency.

```tsx
<SectionHeader
  eyebrow="What we believe"
  title="Three things, no more."
  body="Made-to-order, local press, promise on the print."
/>
```

`asH1` makes the heading `<h1>` semantically while keeping the same visual
size as H2. Hierarchy is semantic, not visual — only the homepage hero
uses `pw-display`.

### `<ImagePlaceholder>` (`src/components/ui/ImagePlaceholder.tsx`)

Renders a `next/image` when `src` is set, otherwise a labelled gradient
placeholder showing the prompt — useful while we're still generating the
photography. Always pass a `prompt` (becomes the `alt` text).

```tsx
<ImagePlaceholder
  src="/images/product/pdp-10-unboxing.jpg"
  prompt="PaperWalls flat-lay of order contents on warm cream paper"
  aspectRatio="4/3"
  sizes="(min-width: 1024px) 50vw, 100vw"
  priority
/>
```

`priority` only on above-the-fold (hero) images. `sizes` should match the
column the image occupies on each breakpoint, so Next.js picks the right
optimised variant.

---

## 6. Imagery

### Format & delivery

- Source: Higgsfield NanoBanana (image-gen) → JPG, longest edge ≤ 1600px,
  quality 82.
- Served via `next/image` with **AVIF first, WebP fallback**, original JPG
  for browsers that support neither. Configured in `next.config.mjs`.
- 30-day CDN cache TTL on the optimiser.
- Photography all stored under `public/images/{section}/`.

### Aspect ratios in use

| Use | Ratio | Examples |
|---|---|---|
| Hero, transformation shots          | `16/10` or `3/2` | `pdp-01-hero.jpg`, `home/hero.jpg` |
| Real-home / lifestyle               | `4/3`            | `pdp-11`/`12`/`13-home`, gallery items |
| Material macros                     | `1/1`            | `pdp-07-satin`, `pdp-08-matte`, `pdp-09-linen` |
| Editorial portrait crops            | `4/5` or `3/4`   | Gallery-1 hero, finish-card images |
| Process / step illustrations        | `4/3`            | `how-it-works/step-{1..4}.jpg`, `home/process-{1..3}.jpg` |
| Sample-pack flat-lay                | `1/1` or `4/3`   | `pdp-14-sample.jpg`, `home/sample-pack.jpg` |

### What's currently in `public/images/`

```
public/images/
├── home/
│   ├── hero.jpg                 (homepage editorial hero)
│   ├── finish-{satin,matte,linen}.jpg   (3 finish macros)
│   ├── gallery-{1..5}.jpg               (5 real-home shots)
│   ├── process-{1..3}.jpg               (3 process steps)
│   └── sample-pack.jpg
├── product/                              (PDP — 14 images)
│   ├── pdp-01-hero.jpg
│   ├── pdp-02-transform.jpg              (before/after transformation)
│   ├── pdp-03-price.jpg                  (price reassurance overlay)
│   ├── pdp-04-ease.jpg                   (single-installer overlay)
│   ├── pdp-05-renter.jpg                 (peel-clean overlay)
│   ├── pdp-06-proof.jpg                  (4-grid social proof)
│   ├── pdp-07-satin.jpg / 08-matte.jpg / 09-linen.jpg   (material macros)
│   ├── pdp-10-unboxing.jpg               (flat-lay)
│   ├── pdp-11-home-1.jpg / 12-home-2.jpg / 13-home-3.jpg
│   └── pdp-14-sample.jpg
└── how-it-works/
    ├── hero.jpg
    └── step-{1-upload, 2-measure, 3-print, 4-deliver}.jpg
```

### Image-generation prompt formula

Pattern that produced our existing photography. All generated in NanoBanana:

```
[Setting: editorial Cape Town room type] with custom-printed wallpaper as
[feature wall placement], [time of day light], [furniture detailing in 2-3
tactile materials], [floor + wall context]. [Style mood]. Photorealistic,
no people.
```

### Prompt examples (lifted directly from the codebase)

**Homepage hero**
> Editorial Cape Town living room with botanical custom-printed wallpaper
> as feature wall behind an oat-bouclé sofa, warm afternoon light from a
> tall window, brass floor lamp, travertine coffee table with linen books,
> oak herringbone floors, white-washed plaster walls. Apartmento × Aesop ×
> Kinfolk warmth. Photorealistic, no people.

**How it works — finished wall**
> Editorial photograph of a finished feature wall with custom wallpaper,
> person standing back admiring it.

**How it works — step 1 (upload)**
> A hand holding a phone with a photo ready to upload, on a soft linen sofa.

**How it works — step 2 (measure)**
> A hand pulling a tape measure across a plain off-white wall, marking it
> lightly.

**How it works — step 3 (print)**
> Wide-format print press in mid-run, custom wallpaper emerging from the
> rollers.

**How it works — step 4 (deliver)**
> Editorial flat-lay of a PaperWalls package — rolled wallpaper, kraft
> sleeve, care card.

**PDP — material macros**
> Macro of {satin / matte / linen} wallpaper with [sheen / flat-finish /
> weave] and gsm label.

**PDP — real homes**
> {Dining room / Reading nook / Home office} with custom {watercolour /
> geometric / landscape} wallpaper, five-star caption.

**Sample pack flat-lay**
> PaperWalls sample pack flat-lay with three finish swatches and kraft
> envelope.

### Style anchors that recur

These words are doing real work in the prompts. Keep using them:

- **Editorial** (vs. catalogue or commercial)
- **Cape Town** / **South African home** (locality)
- **Apartmento × Aesop × Kinfolk warmth** (mood reference)
- **Oat-bouclé**, **travertine**, **linen**, **brass**, **walnut**, **oak
  herringbone** (tactile material vocabulary)
- **Warm afternoon light**, **tall window** (lighting)
- **Photorealistic, no people** (output constraint — we want the room
  to be the subject)

### Things to avoid in image prompts

- People in frame (gets weird quickly with AI; rooms photograph better).
- Stock-photo lighting (overexposed midday, hard flash).
- Sterile catalogue settings (white seamless, IKEA showroom).
- Modern minimalist trying-too-hard aesthetics. We want **lived-in warmth**.

---

## 7. Logo

The wordmark is set inline in markup (no SVG asset yet):

```tsx
paper<span className="text-pw-accent">walls</span>
```

- Family: Satoshi
- Weight: **bold (700)**
- Tracking: tighter than body (`tracking-tight`)
- Sizes: `text-xl` desktop, `text-[19px]` mobile
- Wordmark is two-tone: `paper` is `text-pw-ink`, `walls` is `text-pw-accent`
- Always lowercase. Never split with a space. No outline, drop-shadow,
  or ornament around it.

The same treatment is used on the marketing `<Header>`, the focused
`<FocusedHeader>` (configurator + checkout), the `<Footer>`, and inside
all transactional emails.

---

## 8. Email design

Plain HTML, inline styles only (every webmail client mangles `<style>` tags).
Defined in `src/lib/email/templates.ts`. Built around a single shell:

- Outer wrapper: `#F7F5F0` (muted version of `pw-bg`, more email-safe than
  raw `#F8F4EF`)
- Card: `#FFFFFF`, `border: 1px solid #E6E3DC`, `border-radius: 12px`,
  `max-width: 560px`
- Wordmark in the header, divided by a hairline rule
- Body uses the same Satoshi-style heading hierarchy (h1 24px / 700)
  rendered as system-sans (since custom webfonts in email are unreliable)
- Primary CTA: dark ink fill, white text, `border-radius: 8px`, 12/20 padding
- Footer: muted grey, brand line plus reply-to invitation. No social icons.

Templates: `order_confirmed`, `order_shipped`, `order_delivered`,
`abandoned_cart`, `admin_new_order`. Subject lines are terse and outcome-led
("Order PW-1042 confirmed", "Order PW-1042 shipped").

---

## 9. Decisions worth knowing

These came up during the v2 redesign and are now load-bearing:

- **Single-family typography** replaced our earlier Inter / Fraunces pairing.
  Two families fought for attention; one family with weight + size hierarchy
  reads calmer.
- **`pw-display` is reserved for the homepage hero and the dark closing CTA**.
  Promoting it elsewhere flattens hierarchy.
- **The configurator and checkout use `<FocusedHeader>`** (no nav, no
  email-capture, no footer on `/checkout`). Checkout is a zero-friction
  tunnel — the moment we add a footer link, conversion drops.
- **PDP cold-traffic CTAs route to `/shop/custom-wallpaper`**. Engaged
  CTAs (mid-scroll, supplementary closing CTAs) route to `/config`. Cold
  visitors haven't yet seen pricing, real homes, comparison, FAQ, sample-
  pack escape hatch — they need that page first.
- **Resolution check is warn-only**, never blocks add-to-cart. Wall art is
  viewed from across the room, not arm's length; a slightly-soft buyer
  photo at scale is acceptable, and the reprint guarantee covers genuine
  defects.
- **No mocked / fabricated reviews anywhere.** A previous "★★★★★ 4.9 from
  847 reviews" line was removed because we hadn't measured it. Real
  testimonials only, with first name + city.
