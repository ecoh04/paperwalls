import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Contact | PaperWalls",
  description: "Get in touch about your order or custom wallpaper.",
};

export default function ContactPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Contact" }]} />
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-pw-accent">Support</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-pw-ink">Contact us</h1>
        <p className="mt-4 text-base text-pw-muted leading-relaxed">
          Questions about your order, image quality, installation, or delivery? Reach out and our team will help.
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-muted-light">Email</h2>
          <a href="mailto:hello@paperwalls.co.za" className="mt-2 block text-pw-ink hover:underline">
            hello@paperwalls.co.za
          </a>
          <p className="mt-2 text-sm text-pw-muted">Best for order support, artwork checks, and project quotes.</p>
        </div>
        <div className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-pw-muted-light">Phone</h2>
          <p className="mt-2 text-pw-ink">Phone support coming soon</p>
          <p className="mt-2 text-sm text-pw-muted">For now, email is the fastest way to reach us.</p>
        </div>
      </div>
      <p className="mt-8 text-sm text-pw-muted">
        We typically respond within one business day.
      </p>
    </PageContainer>
  );
}
