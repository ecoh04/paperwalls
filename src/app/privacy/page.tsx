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
      <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-pw-ink">Privacy policy</h1>
      <p className="mt-2 text-sm text-pw-muted-light">Last updated: {new Date().toLocaleDateString("en-ZA")}</p>
      <div className="mt-5 max-w-3xl rounded-pw border border-[rgba(26,23,20,0.1)] bg-pw-surface px-4 py-3 text-sm text-pw-ink/80">
        <strong className="text-pw-ink">Plain English:</strong> we only use your details to process and support your
        order, and we do not sell your personal data.
      </div>
      <div className="mt-8 max-w-3xl space-y-6 text-pw-ink/80 leading-relaxed">
        <p>
          PaperWalls collects the information you provide when you place an order (name, email, 
          phone, address) and your uploaded images. We use this to fulfil your order, communicate 
          with you, and improve our service. We do not sell your data to third parties.
        </p>
        <p>
          Payment is processed securely by PayFast; their privacy policy applies to your card and payment data.
          We store order details and image references in our systems to produce and ship your wallpaper and
          for support and legal record‑keeping.
        </p>
        <p>
          You can contact us to ask about your data or request deletion where applicable. We may 
          update this policy from time to time; the latest version will be on this page.
        </p>
      </div>
    </PageContainer>
  );
}
