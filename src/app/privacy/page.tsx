import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Privacy policy | PaperWalls",
  description: "How PaperWalls collects and uses your information.",
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Privacy policy" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Privacy policy</h1>
      <p className="mt-2 text-stone-500">Last updated: {new Date().toLocaleDateString("en-ZA")}</p>
      <div className="mt-8 max-w-2xl space-y-6 text-stone-600">
        <p>
          PaperWalls collects the information you provide when you place an order (name, email, 
          phone, address) and your uploaded images. We use this to fulfil your order, communicate 
          with you, and improve our service. We do not sell your data to third parties.
        </p>
        <p>
          Payment is processed by Stripe; their privacy policy applies to payment data. We store 
          order details and image references in our systems to produce and ship your wallpaper 
          and for support and legal record-keeping.
        </p>
        <p>
          You can contact us to ask about your data or request deletion where applicable. We may 
          update this policy from time to time; the latest version will be on this page.
        </p>
      </div>
    </PageContainer>
  );
}
