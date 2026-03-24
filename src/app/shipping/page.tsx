import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Shipping & delivery | Paperwalls South Africa",
  description: "Production lead times, delivery windows, and shipping policy for custom wallpaper across South Africa.",
};

export default function ShippingPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shipping & delivery" }]} />

      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-pw-accent">Delivery</p>
        <h1 className="text-3xl font-bold text-pw-ink">Shipping & delivery</h1>
        <p className="mt-3 text-pw-muted">
          All orders are printed to order at our facility and shipped nationwide via a tracked courier service.
          Shipping is currently <strong className="text-pw-ink">free across South Africa</strong>.
        </p>

        {/* Production lead time */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Production lead time</h2>
          <p className="mt-2 text-pw-muted">
            Once your payment is confirmed, we review your file and begin printing within 24 hours.
            Most orders are dispatched within <strong className="text-pw-ink">72 hours</strong> of your order being confirmed.
            You will receive an email with your tracking number once your order has been dispatched.
          </p>
          <p className="mt-3 text-pw-muted">
            If you selected the <strong className="text-pw-ink">Pro installer</strong> option, we will contact
            you within 24 hours of dispatch to schedule the installation appointment.
          </p>
        </div>

        {/* Shipping policy */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Shipping policy</h2>
          <div className="mt-4 rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5">
            <p className="text-pw-muted">
              We currently offer <strong className="text-pw-ink">free standard shipping</strong> on all orders
              delivered within South Africa.
            </p>
            <p className="mt-3 text-pw-muted">
              Typical delivery is <strong className="text-pw-ink">2-4 business days after dispatch</strong>,
              depending on your area. Remote locations may take an additional 1-2 business days.
            </p>
          </div>
        </div>

        {/* What we ship */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">How your order is packaged</h2>
          <p className="mt-2 text-pw-muted">
            Your wallpaper is cut to your exact dimensions, rolled onto a protective cardboard core,
            and wrapped in heavy-duty protective film. Rolls are shipped in rigid cardboard tubes
            to prevent damage in transit. For multi-panel orders, each panel is rolled separately
            and clearly labelled.
          </p>
        </div>

        {/* Tracking */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Tracking your order</h2>
          <p className="mt-2 text-pw-muted">
            A tracking number will be emailed to you once your order has been dispatched. If you
            have not received a tracking email within 4 business days of placing your order, please
            contact us and we will investigate immediately.
          </p>
        </div>

        {/* Questions */}
        <div className="mt-10 rounded-pw-card border border-pw-stone bg-pw-bg p-6">
          <h2 className="text-base font-semibold text-pw-ink">Have a question about your delivery?</h2>
          <p className="mt-1 text-sm text-pw-muted">
            Reach out and we&apos;ll respond within one business day.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex rounded-pw bg-pw-ink px-4 py-2 text-sm font-medium text-white hover:bg-pw-ink-soft"
          >
            Contact us
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
