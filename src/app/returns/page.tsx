import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";
import { ConversionPageIntro } from "@/components/ConversionPageIntro";

export const metadata = {
  title: "Returns & refunds | Paperwalls South Africa",
  description: "Our returns and refund policy for custom-printed wallpaper orders.",
};

export default function ReturnsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Returns & refunds" }]} />

      <div className="max-w-2xl">
        <ConversionPageIntro
          eyebrow="Policy"
          title="Returns & refunds"
          description="Because every order is custom-printed to your exact dimensions and design, returns are limited once production has started."
        />
        <div className="mt-5 rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-surface px-4 py-3 text-sm text-pw-ink/80">
          <strong className="text-pw-ink">Plain English:</strong> custom orders are non-returnable, but if there is
          a print or production defect we will reprint or refund quickly.
        </div>

        {/* No returns */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Custom print policy</h2>
          <p className="mt-2 text-pw-ink/80">
            All wallpaper is printed to order and cut to your specified dimensions. We do not hold
            stock of pre-printed items. As such, we cannot offer returns or refunds for:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-pw-ink/80">
            <li>Change of mind after production has started</li>
            <li>Incorrect dimensions entered by the customer</li>
            <li>Low-resolution images supplied by the customer (we flag DPI warnings in the configurator)</li>
            <li>Colour differences due to monitor calibration vs. print output</li>
          </ul>
          <p className="mt-3 text-pw-ink/80">
            Before placing your order, please double-check your wall measurements and review the image
            quality indicator in the configurator.
          </p>
        </div>

        {/* Defects */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Production defects & printing errors</h2>
          <p className="mt-2 text-pw-ink/80">
            If your order arrives with a genuine production defect — including misaligned cuts,
            significant colour banding, missing sections, or damage caused by our packaging — we
            will reprint and reship your order at no cost to you, or issue a full refund, at your
            discretion.
          </p>
          <p className="mt-3 text-pw-ink/80">
            To lodge a defect claim, please contact us within <strong className="text-pw-ink">7 days</strong> of
            receiving your order and include:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-pw-ink/80">
            <li>Your order number</li>
            <li>Photographs of the defect (clear, well-lit, showing the full panel)</li>
            <li>A brief description of the issue</li>
          </ul>
          <p className="mt-3 text-pw-ink/80">
            Claims submitted after 7 days of delivery may not be eligible for a reprint or refund.
          </p>
        </div>

        {/* Cancellations */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Cancellations</h2>
          <p className="mt-2 text-pw-ink/80">
            If you need to cancel your order, please contact us <strong className="text-pw-ink">as soon as possible</strong>.
            We begin reviewing and preparing files within hours of payment confirmation. If production
            has not yet started, we will issue a full refund. If production has already started,
            we are unable to cancel or refund the order.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-10 rounded-pw-card border border-pw-stone bg-pw-bg p-6">
          <h2 className="text-base font-semibold text-pw-ink">Need to report an issue?</h2>
          <p className="mt-1 text-sm text-pw-ink/75">
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
