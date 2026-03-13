import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Returns & refunds | Paperwalls South Africa",
  description: "Our returns and refund policy for custom-printed wallpaper orders.",
};

export default function ReturnsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Returns & refunds" }]} />

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-pw-ink">Returns & refunds</h1>
        <p className="mt-3 text-pw-muted">
          Because every order is custom-printed to your exact dimensions and design, we are unable
          to accept returns or exchanges once production has started — except in the cases described below.
          Please read this policy before placing your order.
        </p>

        {/* No returns */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Custom print policy</h2>
          <p className="mt-2 text-pw-muted">
            All wallpaper is printed to order and cut to your specified dimensions. We do not hold
            stock of pre-printed items. As such, we cannot offer returns or refunds for:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-pw-muted">
            <li>Change of mind after production has started</li>
            <li>Incorrect dimensions entered by the customer</li>
            <li>Low-resolution images supplied by the customer (we flag DPI warnings in the configurator)</li>
            <li>Colour differences due to monitor calibration vs. print output</li>
          </ul>
          <p className="mt-3 text-pw-muted">
            Before placing your order, please double-check your wall measurements and review the image
            quality indicator in the configurator.
          </p>
        </div>

        {/* Defects */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Production defects & printing errors</h2>
          <p className="mt-2 text-pw-muted">
            If your order arrives with a genuine production defect — including misaligned cuts,
            significant colour banding, missing sections, or damage caused by our packaging — we
            will reprint and reship your order at no cost to you, or issue a full refund, at your
            discretion.
          </p>
          <p className="mt-3 text-pw-muted">
            To lodge a defect claim, please contact us within <strong className="text-pw-ink">7 days</strong> of
            receiving your order and include:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-pw-muted">
            <li>Your order number</li>
            <li>Photographs of the defect (clear, well-lit, showing the full panel)</li>
            <li>A brief description of the issue</li>
          </ul>
          <p className="mt-3 text-pw-muted">
            Claims submitted after 7 days of delivery may not be eligible for a reprint or refund.
          </p>
        </div>

        {/* Cancellations */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Cancellations</h2>
          <p className="mt-2 text-pw-muted">
            If you need to cancel your order, please contact us <strong className="text-pw-ink">as soon as possible</strong>.
            We begin reviewing and preparing files within hours of payment confirmation. If production
            has not yet started, we will issue a full refund. If production has already started,
            we are unable to cancel or refund the order.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-10 rounded-pw-card border border-pw-stone bg-pw-bg p-6">
          <h2 className="text-base font-semibold text-pw-ink">Need to report an issue?</h2>
          <p className="mt-1 text-sm text-pw-muted">
            Contact us with your order number and photos and we&apos;ll resolve it within one business day.
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
