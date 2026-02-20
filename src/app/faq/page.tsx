import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

const faqs = [
  {
    q: "How does custom wallpaper work?",
    a: "You upload an image (photo, art, or pattern), enter your wall dimensions, and choose a finish and application method. We calculate the price and print to your specs, then ship or arrange installation.",
  },
  {
    q: "What file formats do you accept?",
    a: "We accept JPG, PNG, and PDF. For best print quality we recommend high-resolution files (at least 150 DPI at print size).",
  },
  {
    q: "Do you deliver across South Africa?",
    a: "Yes. We ship to all provinces. Shipping cost depends on your zone (e.g. Gauteng, Western Cape, KZN, and other regions).",
  },
  {
    q: "Can someone install it for me?",
    a: "Yes. You can choose our installer service at checkout. We send a professional to your address; pricing depends on wall size and location.",
  },
  {
    q: "What if I need to return or change my order?",
    a: "Because each order is custom-printed to your dimensions and design, returns are limited. See our Returns & refunds page for the full policy.",
  },
];

export const metadata = {
  title: "FAQ | PaperWalls",
  description: "Frequently asked questions about custom wallpaper, ordering, and delivery.",
};

export default function FAQPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Frequently asked questions</h1>
      <dl className="mt-10 space-y-8">
        {faqs.map((faq, i) => (
          <div key={i}>
            <dt className="font-medium text-stone-900">{faq.q}</dt>
            <dd className="mt-2 text-stone-600">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </PageContainer>
  );
}
