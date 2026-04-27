"use client";

import { useState } from "react";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

const FAQS = [
  {
    q: "How does custom wallpaper actually work?",
    a: "Drop in any image (photo, art, pattern), set your wall size, choose a finish and how it sticks to the wall. We give you a live price as you configure, then print to those exact specs and ship across South Africa. No standard rolls, no pre-printed designs.",
  },
  {
    q: "What file formats do you accept?",
    a: "JPG, PNG, or WebP up to 50 MB. The configurator runs a live resolution check against your wall size and tells you in plain language whether it'll print sharply or look soft. We never block you on resolution — you decide.",
  },
  {
    q: "How long does it take?",
    a: "Five days, door to door. We print and pack within 72 hours of your order. Free tracked courier delivery across South Africa adds two to three business days. If you're in a remote area, allow another day or two.",
  },
  {
    q: "Will the colour I see on my screen match the print?",
    a: "Within tolerance. We calibrate to industry-standard ICC profiles, but every screen displays colour differently. The R150 sample pack is the only way to see exact colour before you commit on a full wall.",
  },
  {
    q: "What's the difference between Traditional and Peel & Stick?",
    a: "Traditional uses paste applied to the wall before hanging. Permanent, cleanest seam lines, the industry standard. Peel & Stick has a self-adhesive backing — peel, press, reposition while you hang, removes cleanly later. Best for renters or anyone who might update later.",
  },
  {
    q: "Can someone install it for me?",
    a: "Yes. Pick the Pro installer option in the configurator. We send a certified installer to your address with all materials included. Cost is per square metre based on your wall area plus a fixed call-out fee.",
  },
  {
    q: "What if it ships imperfect?",
    a: "Free reprints, no questions. Send a photo within 7 days of delivery and we run it again on the press within 48 hours. The reprint guarantee covers print defects, packaging damage, and misaligned cuts.",
  },
  {
    q: "Do you ship outside South Africa?",
    a: "Not yet. We ship across all nine SA provinces, free, fully tracked. International shipping is on the roadmap.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="bg-pw-bg pb-16 sm:pb-20">
      <header className="mx-auto max-w-7xl px-5 pt-6 pb-5 sm:px-8 sm:pt-10 sm:pb-8 lg:px-12 lg:pt-14 lg:pb-12">
        <div className="max-w-2xl">
          <p className="pw-overline text-pw-muted">FAQ</p>
          <h1 className="pw-h1 mt-2 text-pw-ink sm:mt-3">
            Straight answers.
          </h1>
          <p className="pw-body mt-3 text-pw-ink/70 sm:pw-body-lg sm:mt-4">
            Files, finishes, delivery, returns. The most common things buyers ask before placing an order.
          </p>
        </div>
      </header>

      <Section tone="bg" id="faq">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Eight questions</Eyebrow>
            <h2 className="pw-h2 mt-3 text-pw-ink">Most asked.</h2>
            <p className="pw-body mt-3 max-w-md text-pw-ink/70">
              Tap a question to expand. Don&rsquo;t see yours? Email
              {" "}
              <a
                href="mailto:hello@paperwalls.co.za"
                className="font-medium text-pw-ink underline underline-offset-[6px] decoration-pw-ink/20 hover:decoration-pw-ink/60 transition-colors"
              >
                hello@paperwalls.co.za
              </a>
              {" "}
              and we&rsquo;ll reply within one business day.
            </p>
          </div>

          <ul className="mt-8 lg:col-span-8 lg:mt-0">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={i} className="border-b border-pw-stone first:border-t">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors sm:py-6"
                  >
                    <span className="pw-h3 text-pw-ink">{item.q}</span>
                    <span
                      aria-hidden
                      className={[
                        "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-pw-stone text-pw-ink transition-transform",
                        isOpen ? "rotate-45 bg-pw-accent-soft border-pw-accent text-pw-accent" : "",
                      ].join(" ").trim()}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <p className="pw-body pb-6 -mt-1 max-w-3xl text-pw-ink/70">{item.a}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section tone="ink" id="closing">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow className="text-pw-accent-mid">Still unsure?</Eyebrow>
            <h2 className="pw-display mt-3 text-white sm:mt-4">
              Try it before you buy.
            </h2>
            <p className="pw-body-lg mt-4 max-w-xl text-white/65 sm:mt-5">
              Order an A5 swatch of every finish for R150, credited to your wallpaper order when you come back.
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
            <Button href="/samples" variant="light-on-ink" size="lg" className="w-full sm:w-auto">
              Order sample pack
            </Button>
            <Button href="/config" variant="ghost" size="md" className="text-white/85 hover:text-white">
              Or design now →
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}
