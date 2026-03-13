import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Shipping & delivery | Paperwalls South Africa",
  description: "Delivery zones, lead times, and flat-rate shipping costs for custom wallpaper across South Africa.",
};

const PROVINCES = [
  { name: "Gauteng",        rate: "R 150", time: "1–2 business days after dispatch" },
  { name: "Western Cape",   rate: "R 180", time: "2–3 business days after dispatch" },
  { name: "KwaZulu-Natal",  rate: "R 180", time: "2–3 business days after dispatch" },
  { name: "Mpumalanga",     rate: "R 180", time: "2–3 business days after dispatch" },
  { name: "Free State",     rate: "R 180", time: "2–3 business days after dispatch" },
  { name: "North West",     rate: "R 180", time: "2–3 business days after dispatch" },
  { name: "Eastern Cape",   rate: "R 200", time: "3–4 business days after dispatch" },
  { name: "Limpopo",        rate: "R 200", time: "3–4 business days after dispatch" },
  { name: "Northern Cape",  rate: "R 220", time: "3–5 business days after dispatch" },
];

export default function ShippingPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shipping & delivery" }]} />

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-pw-ink">Shipping & delivery</h1>
        <p className="mt-3 text-pw-muted">
          All orders are printed to order at our facility and shipped nationwide via a tracked courier service.
          Shipping costs are flat-rate by province and are calculated at checkout.
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

        {/* Province rates */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-pw-ink">Shipping rates by province</h2>
          <p className="mt-2 text-pw-muted">All prices are in ZAR and include VAT.</p>
          <div className="mt-4 overflow-hidden rounded-pw-card border border-pw-stone">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pw-stone bg-pw-bg">
                  <th className="px-4 py-3 text-left font-medium text-pw-ink">Province</th>
                  <th className="px-4 py-3 text-left font-medium text-pw-ink">Shipping cost</th>
                  <th className="px-4 py-3 text-left font-medium text-pw-ink">Estimated delivery</th>
                </tr>
              </thead>
              <tbody>
                {PROVINCES.map((p, i) => (
                  <tr key={p.name} className={i < PROVINCES.length - 1 ? "border-b border-pw-stone" : ""}>
                    <td className="px-4 py-3 text-pw-ink">{p.name}</td>
                    <td className="px-4 py-3 font-medium text-pw-ink">{p.rate}</td>
                    <td className="px-4 py-3 text-pw-muted">{p.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-pw-muted">
            Delivery times are estimates from the date of dispatch and exclude weekends and public holidays.
            Remote or rural areas may take an additional 1–2 business days.
          </p>
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
