import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

export const metadata = {
  title: "How it works | PaperWalls",
  description: "See exactly how PaperWalls custom wallpaper works from upload to delivery.",
};

const STEPS = [
  {
    num: "01",
    title: "Upload your image",
    body: "Upload a JPG, PNG, WebP, or PDF. We guide image quality up front so you know if your file can print sharply at your wall size.",
    tag: "Quality checked",
  },
  {
    num: "02",
    title: "Enter wall dimensions",
    body: "Add exact width and height per wall. We calculate total area and pricing live as you configure.",
    tag: "Live pricing",
  },
  {
    num: "03",
    title: "Pick type and material",
    body: "Choose Traditional or Peel & Stick, then select Satin, Matte, or Linen based on the finish and budget you want.",
    tag: "Clear options",
  },
  {
    num: "04",
    title: "Choose installation",
    body: "Go DIY (with optional kit) or Pro installer. We print, dispatch in 72 hours, and deliver nationwide with free shipping.",
    tag: "Fast dispatch",
  },
];

const CHECKLIST = [
  "Measure full wall width and height at the widest points",
  "Add 5-10 cm trim allowance per side where needed",
  "Use the highest-resolution image available",
  "Confirm wallpaper type, material, and installation method",
];

export default function HowItWorksPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "How it works" }]} />

      <ConversionPageIntro
        eyebrow="The process"
        title="How it works"
        description="This is the exact order flow customers follow. Clear inputs up front, live pricing, then secure checkout."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {STEPS.map((step) => (
          <article
            key={step.num}
            className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5"
          >
            <p className="text-3xl font-bold tracking-tight text-pw-ink/45">{step.num}</p>
            <h2 className="mt-2 font-sans text-xl font-semibold text-pw-ink">{step.title}</h2>
            <p className="mt-2 text-[15px] text-pw-ink/75 leading-relaxed">{step.body}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-pw-accent">{step.tag}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
          <h2 className="font-sans text-lg font-semibold text-pw-ink">Before you start: quick checklist</h2>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-pw-ink/80">
                <span className="mt-0.5 text-pw-accent">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-6">
          <h2 className="font-sans text-lg font-semibold text-pw-ink">What happens after checkout</h2>
          <ul className="mt-4 space-y-2 text-sm text-pw-ink/80">
            <li>Order confirmed and queued for production</li>
            <li>Printed and packed in Cape Town</li>
            <li>Dispatched within 72 hours</li>
            <li>Free tracked delivery nationwide</li>
          </ul>
        </section>
      </div>

      <div className="mt-8 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="font-sans text-lg font-semibold text-pw-ink">Ready to start?</p>
        <p className="mt-1 text-sm text-pw-ink/75">Upload your image and get your live price in under a minute.</p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-semibold text-white hover:bg-pw-ink-soft"
        >
          Start designing
        </Link>
      </div>
    </PageContainer>
  );
}
