import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

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

export default function HowItWorksPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "How it works" }]} />

      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-pw-accent">The process</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-pw-ink">How it works</h1>
        <p className="mt-4 text-base text-pw-muted leading-relaxed">
          A simple flow designed to keep things clear: upload, measure, choose finish, and checkout.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {STEPS.map((step) => (
          <article
            key={step.num}
            className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5"
          >
            <p className="text-3xl font-serif text-pw-stone-dark">{step.num}</p>
            <h2 className="mt-2 text-lg font-semibold text-pw-ink">{step.title}</h2>
            <p className="mt-2 text-sm text-pw-muted leading-relaxed">{step.body}</p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-pw-accent">{step.tag}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-bg p-6">
        <p className="text-pw-ink font-medium">Ready to start?</p>
        <p className="mt-1 text-sm text-pw-muted">Upload your image and get your price in under a minute.</p>
        <Link
          href="/config"
          className="mt-4 inline-flex rounded-pw bg-pw-ink px-5 py-3 text-sm font-medium text-white hover:bg-pw-ink-soft"
        >
          Start designing
        </Link>
      </div>
    </PageContainer>
  );
}
