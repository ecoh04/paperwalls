# Paperwalls — Master Site Plan
*Single source of truth. Read this before touching any file.*

---

## 1. What Paperwalls Is

South African custom wallpaper company that owns its print infrastructure (commercial OOH print house). Customers upload any image — it is printed on premium fabrics and substrates, cut to exact wall dimensions, and shipped nationwide. No middlemen. No minimum order. Any size.

**Brand positioning:** Premium physical product brand (Minted / Framebridge) meets self-serve SaaS tool (Canva / Vercel). Editorial luxury meets clean configurator.

---

## 2. Design System — Non-Negotiable Rules

### Colors (CSS variables in globals.css)
```
--bg:           #F8F4EF   page background
--surface:      #FFFFFF   cards, panels
--ink:          #1A1714   primary text
--ink-soft:     #2E2A26   button hover
--muted:        #6B6560   body copy (accessibility-safe)
--muted-light:  #B5ADA4   hints, footnotes
--accent:       #C4622D   terracotta — use aggressively on CTAs
--accent-soft:  #F2E8E1   blush backgrounds, hover states
--stone:        #E6DFD8   warm grey, section backgrounds
--stone-dark:   #D4C9BE   dashed borders
--border:       rgba(26,23,20,0.10)
--border-mid:   rgba(26,23,20,0.18)
```

### Tailwind tokens (pw-* classes)
Always use `pw-*` tokens. Never use `stone-*`, `gray-*`, or hardcoded hex values.

### Typography Scale
| Element | Size | Font |
|---------|------|------|
| H1 Hero | clamp(44px, 5vw, 64px) | DM Serif Display |
| H2 Section title | 42px / text-4xl | DM Serif Display |
| H3 Card title | 20px / text-xl | DM Sans 500 |
| Body | 15px / text-[15px] | DM Sans 300 |
| Small / Labels | 12px / text-xs | DM Sans 400 |
| Eyebrow | 11px, tracking-widest | DM Sans 500 uppercase |

### Spacing
- Section vertical padding: `py-20 md:py-28`
- Page max width: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Card padding: `p-6`

### Components
- **Primary button:** `bg-pw-ink text-white rounded-pw px-6 py-3 text-sm font-medium hover:bg-pw-ink-soft`
- **Ghost button:** `border border-pw-ink text-pw-ink rounded-pw px-6 py-3 text-sm font-medium hover:bg-pw-accent-soft`
- **Accent button:** `bg-pw-accent text-white rounded-pw px-6 py-3 text-sm font-medium`
- **Card:** `bg-pw-surface rounded-pw-card border border-pw-border shadow-pw-sm`
- **Input:** `rounded-pw border border-pw-stone px-3 py-2 text-pw-ink focus:border-pw-ink focus:outline-none focus:ring-1 focus:ring-pw-ink`
- **Section label (eyebrow):** `text-[11px] font-medium uppercase tracking-widest text-pw-muted`

### Brand name
Always "Paperwalls" — capital P, lowercase w, one word. In the logo: `paper` in `--ink`, `walls` in `--accent`, DM Serif Display.

---

## 3. Navigation — Two-Navbar Rule

### Marketing Nav (Header.tsx)
Used on all marketing and support pages. Sticky, frosted glass.

**Left:** paperwalls logo → `/`
**Center:** How it works → `/how-it-works` · Materials → `/materials` · Inspiration → `/inspiration` · FAQ → `/faq`
**Right:** "Design your wallpaper" CTA → `/config` · Cart icon with item count badge

Pages using this nav: `/`, `/products/custom-wallpaper`, `/how-it-works`, `/materials`, `/inspiration`, `/faq`, `/contact`, `/shipping`, `/returns`, `/about`, `/privacy`, `/terms`, `/404`

### Focused Nav (FocusedHeader.tsx — create this component)
Used on the conversion flow. Minimal — no exit links.

**Left:** paperwalls logo → `/`
**Right:** "Save & exit" text link → `/`

Pages using this nav: `/config`, `/cart`, `/checkout`, `/checkout/success`, `/checkout/cancelled`

### Footer (Footer.tsx)
Used on all marketing pages. NOT shown on `/config`, `/cart`, `/checkout`, `/checkout/success`, `/checkout/cancelled`.

Sections: Shop · Help · Legal · Brand (About)

---

## 4. Full Site Map

### Core Conversion Flow
| Page | Route | Status | Job |
|------|-------|--------|-----|
| Homepage | `/` | Needs rebuild | Communicate product, build desire, funnel every visitor to the configurator |
| Configurator | `/config` | Needs polish | Upload image → dimensions → material → finish → installation → price → add to cart |
| Cart | `/cart` | Needs polish | Confirm order details with image thumbnail, push to checkout with zero friction |
| Checkout | `/checkout` | Needs polish | Collect name/email/phone/address, calculate shipping, hand off to PayFast |
| Order Success | `/checkout/success` | Needs polish | Confirm order received, show order number, explain what happens next |
| Order Cancelled | `/checkout/cancelled` | Build | Handle PayFast cancellations, link back to cart so order isn't lost |

### Product & Education
| Page | Route | Status | Job |
|------|-------|--------|-----|
| Product Page | `/products/custom-wallpaper` | Build | Describe product fully, explain materials, convert browsers into configurator users |
| How It Works | `/how-it-works` | Build | Walk user through 4-step process (upload → size → print → deliver) to eliminate hesitation |
| Materials | `/materials` | Build | Show every substrate with photography, specs, pricing per m², and "best for" use cases |
| Inspiration / Gallery | `/inspiration` | Build | Show the product in real rooms to create desire and give users ideas for what to upload |

### Support & Trust
| Page | Route | Status | Job |
|------|-------|--------|-----|
| FAQ | `/faq` | Needs more content | Answer every pre-purchase objection — file formats, DPI, delivery, returns, installation |
| Contact | `/contact` | Needs rebuild | Email, WhatsApp, and contact form for post-purchase queries |
| Shipping & Delivery | `/shipping` | Done | Provinces, lead times, costs, courier info |
| Returns & Refunds | `/returns` | Done | Custom print no-returns policy, defect claim process |
| Sample Pack | `/samples` | V2 | Let users order physical swatch pack before committing to full order |

### Brand
| Page | Route | Status | Job |
|------|-------|--------|-----|
| About Us | `/about` | Needs rebuild | Print house story, establish credibility, make brand feel human and local |

### Legal (Footer Only)
| Page | Route | Status | Job |
|------|-------|--------|-----|
| Privacy Policy | `/privacy` | Exists | POPIA compliance |
| Terms of Service | `/terms` | Exists | Purchase terms, custom print policy, liability |

### System / Utility
| Page | Route | Status | Job |
|------|-------|--------|-----|
| 404 Not Found | `not-found.tsx` | Exists | Catch broken URLs, redirect to homepage or configurator |
| Admin | `/admin` | DO NOT TOUCH | Internal order management |

---

## 5. Page-by-Page Spec

### Homepage `/`
**Nav:** Marketing nav  
**Goal:** One job — get the visitor to `/config`

**Sections in order:**
1. **Hero** — 2-col layout. Left: eyebrow pill "Printed in-house · South Africa", H1 "Your image. Your walls. Commercial quality, direct from our press." (italic on "Your walls."), subheading "We own the presses. No middlemen. Upload your image, set your dimensions, get commercial-grade wallpaper delivered to your door.", primary CTA "Start designing — it's free ↗" → `/config`, ghost link "See how it works →" smooth-scrolls to `#how`. Right: teaser upload widget (upload zone + "Get instant quote →" → `/config`). Right panel background `--stone`.
2. **Trust strip** — animated marquee: "72hr From upload to dispatch · 4 Premium substrates · 300 DPI Commercial-grade resolution · Any size Zero waste, cut to your exact wall · Printed in South Africa"
3. **Features** — 3-col cards: "Your image, any image", "Cut to your exact dimensions", "Four substrate options"
4. **Gallery** — 5-tile masonry grid showing wallpaper in real rooms
5. **Materials** — dark section, 4 substrate cards: Woven fabric / Non-woven / Peel & stick / Textured canvas
6. **How it works** (id="how") — 4-step process
7. **Testimonials** — 3 cards
8. **CTA banner** — dark, "Ready to transform your walls?" + button

**IMPORTANT:** Remove the existing custom navbar from `page.tsx`. The page must use the shared `Header.tsx`.

---

### Configurator `/config`
**Nav:** Focused nav (FocusedHeader.tsx)  
**Goal:** Complete configuration and add to cart

**Layout:** Single column, max-w-3xl, steps revealed progressively as each is completed. Sticky price summary on the right at ≥1024px.

**Steps:**
1. Upload image (with DPI quality indicator after upload)
2. Wall dimensions in cm (always display clean integers, never floating point)
3. Substrate — Woven fabric (R89/m²) / Non-woven (R72/m²) / Peel & stick (R105/m²) / Textured canvas (R134/m²)
4. Finish — Matte / Satin / Textured linen / Premium fabric
5. Installation — DIY (FREE) / DIY kit (+R299) / Pro installer (quoted)
6. Price summary + Add to cart

**Disabled button copy:** Context-aware — "Upload an image to continue →" / "Enter wall dimensions to continue →" / "Add to cart"

---

### Cart `/cart`
**Nav:** Focused nav  
**Goal:** Zero-friction push to checkout

**Must have:** Image thumbnail, clean dimensions (e.g. "361 cm × 240 cm"), material + finish labels, price, reassurance line "Custom-printed to your exact dimensions. Dispatched within 72 hours.", checkout button.

---

### Checkout `/checkout`
**Nav:** Focused nav  
**Goal:** Collect details and hand off to PayFast

**Must have:** All 9 SA provinces in dropdown: Gauteng, Western Cape, KwaZulu-Natal, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, Northern Cape. Trust signals visible.

---

### Order Success `/checkout/success`
**Nav:** Focused nav  
**Must have:** Order number, "What happens next" 3 steps (file review → production confirmation → ships within 72hr with tracking).

---

### Order Cancelled `/checkout/cancelled`
**Nav:** Focused nav  
**Must have:** "Your order wasn't completed" message, "Return to cart" button, reassurance that their design is still saved.

---

### FAQ `/faq`
**Nav:** Marketing nav  
**Must have:** 10–12 questions covering file formats, DPI, wall size limits, materials, installation, delivery, returns, payment methods, turnaround time.

---

### Contact `/contact`
**Nav:** Marketing nav  
**Must have:** Email address, WhatsApp link, and a working contact form (name / email / message / submit).

---

### About `/about`
**Nav:** Marketing nav  
**Must have:** Story of the print house, why custom wallpaper, South Africa angle, credibility signals (years in operation, commercial print background).

---

## 6. Files That Must Never Be Touched

```
src/app/api/          ← PayFast, Supabase, checkout API routes
src/lib/              ← pricing logic, Supabase client
src/middleware.ts     ← auth middleware
src/types/            ← TypeScript types
src/contexts/CartContext.tsx
```

---

## 7. Implementation Order

**Phase 1 — Shell (do first, everything depends on it)**
1. Create `FocusedHeader.tsx` component
2. Update `Header.tsx` nav links to match marketing nav spec
3. Update `layout.tsx` to use marketing nav by default
4. Update `/config`, `/cart`, `/checkout`, `/checkout/success`, `/checkout/cancelled` layouts to use `FocusedHeader.tsx`

**Phase 2 — Homepage rebuild**
5. Remove custom navbar from `page.tsx`
6. Rebuild hero section with correct copy and teaser widget
7. Verify all homepage sections use design system tokens

**Phase 3 — Configurator polish**
8. Add substrate selector step
9. Verify floating-point fix is working
10. Add DPI quality indicator

**Phase 4 — Build missing pages**
11. `/products/custom-wallpaper`
12. `/how-it-works`
13. `/materials`
14. `/inspiration`
15. `/checkout/cancelled`

**Phase 5 — Content pages**
16. `/contact` — add real form
17. `/about` — real content
18. `/faq` — expand to 12 questions

---

*Last updated: March 2026*