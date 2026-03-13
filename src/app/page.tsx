'use client'

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadSize, setUploadSize] = useState<string | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      zone.style.borderColor = "var(--accent)";
      zone.style.background = "var(--accent-soft)";
    };
    const onDragLeave = () => {
      zone.style.borderColor = "";
      zone.style.background = "";
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      zone.style.borderColor = "";
      zone.style.background = "";
      const file = e.dataTransfer?.files[0];
      if (file) {
        setUploadName(file.name);
        setUploadSize(
          (file.size / 1e6).toFixed(1) + " MB — ready to configure"
        );
      }
    };
    zone.addEventListener("dragover", onDragOver);
    zone.addEventListener("dragleave", onDragLeave);
    zone.addEventListener("drop", onDrop);
    return () => {
      zone.removeEventListener("dragover", onDragOver);
      zone.removeEventListener("dragleave", onDragLeave);
      zone.removeEventListener("drop", onDrop);
    };
  }, []);

  const marqueeItems = [
    "Commercial-grade print press",
    "72-hour production",
    "Cut to any dimension",
    "4 substrate options",
    "Zero banding guarantee",
    "Precise colour matching",
    "Upload any image format",
    "Ships rolled & ready",
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow eyebrow-pill fade-up">
            Custom wallpaper printing
          </div>

          <h1 className="hero-h1 fade-up delay-1">
            Your image.
            <br />
            <em>Your walls.</em>
            <br />
            Flawlessly printed.
          </h1>

          <p className="hero-sub fade-up delay-2">
            Upload any photo, pattern, or texture — we print it on premium
            fabrics and substrates using commercial-grade presses. Delivered
            cut-to-size, ready to hang.
          </p>

          <div className="hero-ctas fade-up delay-3">
            <Link href="/config" className="btn btn-primary">
              Upload your design <span className="btn-arrow">↗</span>
            </Link>
            <button className="hero-link">See how it works →</button>
          </div>

          <div className="hero-trust fade-up delay-4">
            <div className="trust-item">
              <span className="trust-num">72hr</span>
              <span className="trust-label">Production time</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">4</span>
              <span className="trust-label">Substrate grades</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">300 DPI</span>
              <span className="trust-label">Print resolution</span>
            </div>
            <div className="trust-item">
              <span className="trust-num">Any size</span>
              <span className="trust-label">Cut to dimension</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="configurator fade-up delay-2">
            <div ref={zoneRef} className="upload-zone">
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
              <span className="upload-title">
                {uploadName ?? "Drop your image here"}
              </span>
              <span className="upload-sub">
                {uploadSize ??
                  "JPG, PNG, TIFF up to 500MB\nMin. 150 DPI recommended"}
              </span>
              {!uploadName && (
                <span className="upload-cta">or browse files</span>
              )}
            </div>

            <div>
              <div className="config-label">Material</div>
              <div className="chips">
                {MATERIAL_KEYS.map((key) => (
                  <button
                    key={key}
                    className={`chip${
                      activeMaterial === key ? " active" : ""
                    }`}
                    onClick={() => setActiveMaterial(key)}
                  >
                    {MATERIAL_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="config-label">Wall dimensions</div>
              <div className="size-grid">
                <div className="field-group">
                  <label className="field-label">Width (m)</label>
                  <input
                    className="field-input"
                    type="number"
                    value={width}
                    step={0.1}
                    min={0.5}
                    max={20}
                    onChange={(e) =>
                      setWidth(parseFloat(e.target.value) || 2.4)
                    }
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Height (m)</label>
                  <input
                    className="field-input"
                    type="number"
                    value={height}
                    step={0.1}
                    min={0.5}
                    max={20}
                    onChange={(e) =>
                      setHeight(parseFloat(e.target.value) || 2.7)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="price-row">
              <div className="price-left">
                <span className="price-est">Estimated total</span>
                <span className="price-note">incl. VAT &amp; shipping</span>
              </div>
              <span className="price-val">{price}</span>
            </div>

            <Link href="/config" className="btn btn-primary config-submit">
              Continue to checkout <span className="btn-arrow">↗</span>
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
              <rect
                x="2"
                y="2"
                width="8"
                height="8"
                rx="2.5"
                fill="#C4622D"
              />
              <rect
                x="12"
                y="2"
                width="8"
                height="8"
                rx="2.5"
                fill="#C4622D"
                opacity="0.45"
              />
              <rect
                x="2"
                y="12"
                width="8"
                height="8"
                rx="2.5"
                fill="#C4622D"
                opacity="0.45"
              />
              <rect
                x="12"
                y="12"
                width="8"
                height="8"
                rx="2.5"
                fill="#C4622D"
                opacity="0.2"
              />
            </svg>
          </div>
          <div className="feat-title">Upload anything</div>
          <p className="feat-body">
            Photos, patterns, abstract textures, brand artwork, architectural
            renders. If you can save it as a file, we can print it at any scale
            without quality loss.
          </p>
        </div>
        <div className="feat-card">
          <div className="feat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="#C4622D"
                strokeWidth="1.5"
              />
              <path
                d="M11 7v4.5l3 2"
                stroke="#C4622D"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="feat-title">72-hour production</div>
          <p className="feat-body">
            Our commercial print house runs daily. Your order enters production
            within hours of approval and ships within 3 business days, anywhere
            in South Africa.
          </p>
        </div>
        <div className="feat-card">
          <div className="feat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M3 11s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z"
                stroke="#C4622D"
                strokeWidth="1.5"
              />
              <circle cx="11" cy="11" r="2.5" fill="#C4622D" />
            </svg>
          </div>
          <div className="feat-title">Commercial-grade quality</div>
          <p className="feat-body">
            The same presses and operators behind large-format OOH advertising.
            Zero banding, sharp edges, precise ICC colour management on every
            single panel.
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
              desc: "Soft-touch textile with a linen-like finish. Warm, premium, and removable without wall damage.",
              tag: "Most popular",
              price: "R89",
            },
            {
              swatch: "mat-swatch-nonwoven",
              name: "Non-Woven",
              desc: "Dimensionally stable with a smooth matte surface. The best choice for high-resolution photography and fine detail.",
              tag: null,
              price: "R72",
            },
            {
              swatch: "mat-swatch-peel",
              name: "Peel & Stick",
              desc: "Repositionable vinyl with a satin finish. No paste, no mess, no commitment — perfect for renters.",
              tag: "Renter-friendly",
              price: "R105",
            },
            {
              swatch: "mat-swatch-canvas",
              name: "Textured Canvas",
              desc: "Heavy-grain canvas substrate for a tactile, art-studio feel. Painterly depth with photographic precision.",
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
              title: "Hang & enjoy",
              body: "Each order includes a printed step-by-step hanging guide specific to your chosen substrate. Support available if you need it.",
              tag: "Included guide",
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
      </section>

      <section className="testimonials">
        <div className="section-header">
          <div className="eyebrow">Reviews</div>
          <h2 className="section-title">What our customers say</h2>
        </div>

        <div className="testimonials-grid">
          {[
            {
              quote:
                "I uploaded a photo I took on my phone — the print quality was extraordinary. Our living room is completely transformed.",
              initials: "SL",
              name: "Sarah Louw",
              detail: "Interior designer · Cape Town",
              avatarBg: "#F2E8E1",
              avatarColor: "#C4622D",
            },
            {
              quote:
                "Used Paperwalls for a restaurant renovation. Six walls, all custom. The consistency panel-to-panel is exceptional. Highly recommend.",
              initials: "MN",
              name: "Musa Nkosi",
              detail: "Hospitality operator · Johannesburg",
              avatarBg: "#EAF5EE",
              avatarColor: "#1A6B35",
            },
            {
              quote:
                "The peel-and-stick material is genuinely brilliant. I've moved it twice already and it still holds perfectly. Great colour accuracy too.",
              initials: "JM",
              name: "Jess Marais",
              detail: "Homeowner · Pretoria",
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="specs-section" id="specs">
        <div>
          <div className="section-header">
            <div className="eyebrow">Technical specs</div>
            <h2 className="section-title">
              Built to
              <br />
              <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
                professional standard.
              </em>
            </h2>
            <p className="section-sub">
              We run the same presses used for large-format out-of-home
              advertising. The specs reflect that.
            </p>
          </div>
          <button className="btn btn-outline">Download spec sheet →</button>
        </div>

        <div>
          <table className="specs-table">
            <tbody>
              <tr>
                <td>Print resolution</td>
                <td>Up to 1440 × 1440 DPI</td>
              </tr>
              <tr>
                <td>Minimum DPI input</td>
                <td>72 DPI (150 DPI recommended)</td>
              </tr>
              <tr>
                <td>Colour profile</td>
                <td>ICC-managed, sRGB and Adobe RGB</td>
              </tr>
              <tr>
                <td>Maximum width</td>
                <td>3.2m per roll</td>
              </tr>
              <tr>
                <td>Maximum height</td>
                <td>Unlimited (seamed panels)</td>
              </tr>
              <tr>
                <td>File formats accepted</td>
                <td>JPG, PNG, TIFF, PDF, PSD</td>
              </tr>
              <tr>
                <td>Production time</td>
                <td>
                  <span className="specs-badge">72hr</span>
                </td>
              </tr>
              <tr>
                <td>Delivery</td>
                <td>Nationwide, 2–4 business days</td>
              </tr>
              <tr>
                <td>Returns</td>
                <td>
                  Reprints for print defects. Custom orders are
                  non-refundable.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="cta-banner">
        <div>
          <h2 className="cta-banner-title">
            Ready to
            <br />
            <em>transform your space?</em>
          </h2>
          <p className="cta-banner-sub">
            Upload your image, choose your substrate, and get a live quote in
            under 60 seconds. No account required to start.
          </p>
        </div>
        <div className="cta-banner-actions">
          <Link href="/config" className="btn btn-accent">
            Upload your design <span className="btn-arrow">↗</span>
          </Link>
          <span className="cta-note">
            No account needed &nbsp;·&nbsp; Free DPI check
          </span>
        </div>
      </div>

    </>
  );
}
