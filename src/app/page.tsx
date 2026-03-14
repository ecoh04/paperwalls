'use client'

import Link from "next/link";
import { useState, useEffect } from "react";

const PRICE_PER_SQM: Record<string, number> = {
  woven: 89,
  nonwoven: 72,
  peel: 105,
  canvas: 134,
};

const MATERIAL_KEYS = ["woven", "nonwoven", "peel", "canvas"] as const;
type MaterialKey = (typeof MATERIAL_KEYS)[number];

const MATERIAL_LABELS: Record<MaterialKey, string> = {
  woven: "Woven fabric",
  nonwoven: "Non-woven",
  peel: "Peel & stick",
  canvas: "Textured canvas",
};

export default function HomePage() {
  const [activeMaterial, setActiveMaterial] = useState<MaterialKey>("woven");
  const [activeMat, setActiveMat] = useState(0);
  const [width, setWidth] = useState(2.4);
  const [height, setHeight] = useState(2.7);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sqm = width * height;
  const total = Math.round(sqm * PRICE_PER_SQM[activeMaterial] * 8.1);
  const price = "R" + total.toLocaleString("en-ZA");

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".feat-card, .step, .testi-card, .mat-tile"
    );
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);


  const marqueeItems = [
    "500+ SA orders printed",
    "72-hour production",
    "Cut to your exact dimensions",
    "Renter-friendly peel & stick",
    "From R72 per m²",
    "Ships nationwide",
    "No design experience needed",
    "Ships rolled & ready to hang",
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow eyebrow-pill fade-up">
            Printed in-house · Cape Town
          </div>

          <h1 className="hero-h1 fade-up delay-1">
            Your image.<br />
            <em>Your walls.</em>
          </h1>

          <p className="hero-sub fade-up delay-2">
            Upload any image — printed on commercial-grade fabric and shipped to
            your door, cut to your exact wall dimensions. No design skills
            needed.
          </p>

          <div className="hero-ctas fade-up delay-3">
            <Link href="/config" className="btn btn-primary">
              Upload your design <span className="btn-arrow">↗</span>
            </Link>
            <Link href="/samples" className="hero-link">
              Not sure yet? Order a sample pack →
            </Link>
          </div>

          {/* Mobile hero visual — placeholder until real photography is added */}
          <Link href="/config" className="hero-mobile-visual fade-up delay-4">
            <div className="hero-mobile-visual-inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="hero-mobile-visual-label">Your photo here</span>
              <span className="hero-mobile-visual-sub">Any image · Any size · Any wall</span>
            </div>
          </Link>

          <div className="hero-trust fade-up delay-5">
            <div className="trust-item">
              <span className="trust-num">72hr</span>
              <span className="trust-label">Print & dispatch</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">From R72</span>
              <span className="trust-label">Per m²</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">4.9 ★</span>
              <span className="trust-label">Customer rating</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">Any size</span>
              <span className="trust-label">Cut to your exact wall</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="configurator fade-up delay-2">
            <Link href="/config">
              <div className="upload-zone" style={{ cursor: 'pointer' }}>
                <div className="upload-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                      d="M11 4L11 14M11 4L8 7M11 4L14 7"
                      stroke="#1A1714"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 15.5v1.5a2 2 0 002 2h11a2 2 0 002-2v-1.5"
                      stroke="#8A8175"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="upload-title">Your design starts here</span>
                <span className="upload-sub">
                  Upload a photo, get a live quote in 60 seconds
                </span>
                <span className="upload-cta">Start designing →</span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div key={i} className="marquee-item">
              <span className="marquee-dot" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <section className="features">
        <div className="feat-card">
          <div className="feat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="2.5" fill="#C4622D" />
              <rect x="12" y="2" width="8" height="8" rx="2.5" fill="#C4622D" opacity="0.45" />
              <rect x="2" y="12" width="8" height="8" rx="2.5" fill="#C4622D" opacity="0.45" />
              <rect x="12" y="12" width="8" height="8" rx="2.5" fill="#C4622D" opacity="0.2" />
            </svg>
          </div>
          <div className="feat-title">Start with any photo you own</div>
          <p className="feat-body">
            Your phone photo, a scanned painting, a downloaded pattern. If you can save it as a file, we can scale it to fill a wall — no design software or experience needed.
          </p>
        </div>
        <div className="feat-card">
          <div className="feat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#C4622D" strokeWidth="1.5" />
              <path d="M11 7v4.5l3 2" stroke="#C4622D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="feat-title">On your wall in under a week</div>
          <p className="feat-body">
            We print and dispatch within 72 hours of payment. Add 2–4 days for nationwide delivery and you could be hanging it before the weekend is over.
          </p>
        </div>
        <div className="feat-card">
          <div className="feat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 11s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" stroke="#C4622D" strokeWidth="1.5" />
              <circle cx="11" cy="11" r="2.5" fill="#C4622D" />
            </svg>
          </div>
          <div className="feat-title">The quality you see in hotels</div>
          <p className="feat-body">
            We run the same commercial press equipment used for large-format signage and retail displays. Sharp edges, zero banding, and colours that stay true to your original image.
          </p>
        </div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-header">
          <div className="eyebrow">Inspiration</div>
          <h2 className="section-title">
            Walls that make
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
              the room.
            </em>
          </h2>
          <p className="section-sub">
            From abstract art to family photos — if you can save it as a file, we can print it at any scale.
          </p>
        </div>

        <div className="gallery-grid">
          {[
            {
              cls: "gal-1",
              caption: "Botanical gradient — Woven fabric, 3.2 × 2.7m",
            },
            {
              cls: "gal-2",
              caption: "Linen cross-hatch — Non-woven, 1.8 × 2.4m",
            },
            {
              cls: "gal-3",
              caption: "Midnight burn — Textured canvas, 2.4 × 2.7m",
            },
            {
              cls: "gal-4",
              caption: "Stone dot grid — Peel & stick, 1.2 × 2.4m",
            },
            {
              cls: "gal-5",
              caption: "Raw earth — Woven fabric, 2.8 × 2.7m",
            },
          ].map(({ cls, caption }) => (
            <div key={cls} className="gallery-item">
              <div className={cls} style={{ width: "100%", height: "100%" }} />
              <div className="gallery-overlay">
                <span className="gallery-caption">{caption}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="gallery-cta">
          <p className="gallery-cta-note">Every print is unique to your order. We print your image — not ours.</p>
          <Link href="/config" className="btn btn-outline">
            Start with your own image <span className="btn-arrow">↗</span>
          </Link>
        </div>
      </section>

      <section className="materials" id="materials">
        <div className="section-header">
          <div className="eyebrow">Substrates</div>
          <h2 className="section-title" style={{ color: "#fff" }}>
            Four materials.
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent-mid)" }}>
              One standard.
            </em>
          </h2>
          <p className="section-sub">
            Every substrate is printed on the same commercial press. The
            difference is in the feel, finish, and installation method.
          </p>
        </div>

        <div className="materials-grid">
          {[
            {
              swatch: "mat-swatch-woven",
              name: "Woven Fabric",
              desc: "A soft linen-like finish that looks and feels premium. Applies with paste, removes cleanly, and covers minor wall imperfections well.",
              tag: "Most popular",
              price: "R89",
            },
            {
              swatch: "mat-swatch-nonwoven",
              name: "Non-Woven",
              desc: "Flat matte surface that renders sharp photographic detail edge-to-edge without distortion. Best for portraits, cityscapes and fine linework.",
              tag: null,
              price: "R72",
            },
            {
              swatch: "mat-swatch-peel",
              name: "Peel & Stick",
              desc: "No paste, no damage, no commitment. Repositionable vinyl that peels off painted walls cleanly — perfect for renters or feature walls you might change.",
              tag: "Renter-friendly",
              price: "R105",
            },
            {
              swatch: "mat-swatch-canvas",
              name: "Textured Canvas",
              desc: "A tactile, textured substrate that makes your image feel like a work of art. Heavier than standard wallpaper — best for bold, graphic imagery.",
              tag: "Premium",
              price: "R134",
            },
          ].map((mat, i) => (
            <div
              key={mat.name}
              className={`mat-tile${activeMat === i ? " active" : ""}`}
              onClick={() => setActiveMat(i)}
            >
              <div className={`mat-swatch ${mat.swatch}`} />
              <div className="mat-name">{mat.name}</div>
              <p className="mat-desc">{mat.desc}</p>
              {mat.tag && <span className="mat-tag">{mat.tag}</span>}
              <div className="mat-price">
                {mat.price} <span>per m²</span>
              </div>
            </div>
          ))}
        </div>

        <div className="section-cta">
          <Link href="/config" className="btn btn-accent">
            Choose your material <span className="btn-arrow">↗</span>
          </Link>
          <p className="section-cta-note">
            Ordering for a project?{" "}
            <Link href="/contact">Contact us for bulk pricing →</Link>
          </p>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-header">
          <div className="eyebrow">The process</div>
          <h2 className="section-title">
            Four steps.
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
              Order in minutes.
            </em>
          </h2>
          <p className="section-sub">
            No design experience needed. No trade account. Just your image and
            your dimensions.
          </p>
        </div>

        <div className="steps-grid">
          {[
            {
              num: "01",
              title: "Upload your file",
              body: "Drop any high-resolution image — JPG, PNG, TIFF, or PDF. We'll flag if your DPI is too low before you pay.",
              tag: "Free DPI check",
            },
            {
              num: "02",
              title: "Choose your material",
              body: "Pick from 4 substrate options. Enter your exact wall dimensions — we cut every order to the millimetre.",
              tag: "Live price estimate",
            },
            {
              num: "03",
              title: "We print & ship",
              body: "Your order hits our commercial press within 24 hours of payment confirmation. Arrives rolled, labelled by panel, and ready to hang.",
              tag: "72hr production",
            },
            {
              num: "04",
              title: "Hang it — we make it easy",
              body: "Every order includes a substrate-specific hanging guide. Panels arrive rolled and labelled in order. Most customers hang their wall in an afternoon.",
              tag: "Guide included",
            },
          ].map((step) => (
            <div key={step.num} className="step">
              <div className="step-num">{step.num}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-body">{step.body}</p>
              <span className="step-tag">{step.tag}</span>
            </div>
          ))}
        </div>

        <div className="section-cta">
          <Link href="/config" className="btn btn-primary">
            Start your order <span className="btn-arrow">↗</span>
          </Link>
        </div>
      </section>

      <section className="testimonials">
        <div className="section-header">
          <div className="eyebrow">Reviews</div>
          <h2 className="section-title">What our customers say</h2>
          <div className="review-summary">
            <span className="review-stars">★★★★★</span>
            <span className="review-count">4.9 · 200+ verified orders</span>
          </div>
        </div>

        <div className="testimonials-grid">
          {[
            {
              quote:
                "I uploaded a photo I took on my phone — the print quality was extraordinary. Our living room is completely transformed.",
              initials: "SL",
              name: "Sarah Louw",
              detail: "Interior designer · Cape Town",
              badge: "Verified buyer",
              avatarBg: "#F2E8E1",
              avatarColor: "#C4622D",
            },
            {
              quote:
                "Used Paperwalls for a restaurant renovation. Six walls, all custom. The consistency panel-to-panel is exceptional. Every client who visits comments on them.",
              initials: "MN",
              name: "Musa Nkosi",
              detail: "Hospitality operator · Johannesburg",
              badge: "Verified buyer",
              avatarBg: "#EAF5EE",
              avatarColor: "#1A6B35",
            },
            {
              quote:
                "The peel-and-stick is genuinely brilliant. I&apos;ve repositioned it twice and it still holds perfectly — and came off cleanly when I moved flats.",
              initials: "JM",
              name: "Jess Marais",
              detail: "Renter · Pretoria",
              badge: "Verified buyer",
              avatarBg: "#E6F0FB",
              avatarColor: "#1A5FAD",
            },
          ].map((t) => (
            <div key={t.name} className="testi-card">
              <div className="testi-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="star" />
                ))}
              </div>
              <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="testi-author">
                <div
                  className="testi-avatar"
                  style={{ background: t.avatarBg, color: t.avatarColor }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-detail">{t.detail}</div>
                  <div className="testi-verified">{t.badge}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-header">
          <div className="eyebrow">Common questions</div>
          <h2 className="section-title">
            Everything you need
            <br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
              to know.
            </em>
          </h2>
          <p className="section-sub">
            Still not sure?{" "}
            <Link href="/contact" style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Chat to us directly →
            </Link>
          </p>
        </div>

        <div className="faq-accordion">
          {[
            {
              q: "Do I need design software or special files?",
              a: "No. If you have a photo on your phone, you have everything you need. Just upload any JPG, PNG, TIFF or PDF — we handle the print setup from there.",
            },
            {
              q: "What if my image isn't high-resolution enough?",
              a: "We check your file's DPI before you pay. If it's too low for your chosen dimensions, we'll tell you upfront — no nasty surprises when it arrives.",
            },
            {
              q: "How do I measure my wall correctly?",
              a: "Width × height in centimetres, measured at the widest and tallest points. We cut every order to the millimetre, so measure twice. Our how-it-works page has a full guide.",
            },
            {
              q: "Which material should I choose?",
              a: "Woven fabric suits most homes. Non-woven is best for photographic detail. Peel & stick is for renters or commitment-free decorating. Canvas is a premium, art-gallery feel.",
            },
            {
              q: "I'm renting — will peel & stick damage my walls?",
              a: "No. Our peel & stick removes cleanly from painted or plaster walls without leaving residue. It can also be repositioned if you need to adjust after hanging.",
            },
            {
              q: "What if the print isn't right when it arrives?",
              a: "If there's a print defect — banding, colour shift, transit damage — we reprint at no cost. Send us a photo within 7 days and we sort it within 48 hours.",
            },
            {
              q: "How long does delivery take after I order?",
              a: "Production is 72 hours from payment confirmation. Nationwide delivery adds 2–4 business days depending on your province. You receive a tracking number when it ships.",
            },
            {
              q: "Can I order wallpaper for multiple walls?",
              a: "Yes. The configurator supports multi-wall orders — add each wall's dimensions separately and we print, label, and ship them together as one order.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`faq-accordion-item${openFaq === i ? " open" : ""}`}
            >
              <button
                className="faq-accordion-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span className="faq-accordion-q">{item.q}</span>
                <span className="faq-accordion-icon">+</span>
              </button>
              <div className="faq-accordion-body">
                <p className="faq-accordion-a">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="cta-banner">
        <div>
          <h2 className="cta-banner-title">
            Your image.
            <br />
            <em>On your wall within the week.</em>
          </h2>
          <p className="cta-banner-sub">
            Upload your photo, choose your material, and get a live price in under 60 seconds. Printed in Cape Town. Delivered nationwide.
          </p>
        </div>
        <div className="cta-banner-actions">
          <Link href="/config" className="btn btn-accent">
            Upload your design <span className="btn-arrow">↗</span>
          </Link>
          <span className="cta-note">
            No account needed &nbsp;·&nbsp; No design skills required
          </span>
        </div>
      </div>

    </>
  );
}
