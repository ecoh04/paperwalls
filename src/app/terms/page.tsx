import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Terms of service | PaperWalls",
  description: "Terms of service for using PaperWalls.",
};

export default function TermsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Terms of service" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Terms of service</h1>
      <p className="mt-2 text-stone-500">Last updated: {new Date().toLocaleDateString("en-ZA")}</p>
      <div className="mt-8 max-w-2xl space-y-6 text-stone-600">
        <p>
          By using PaperWalls and placing an order, you agree to these terms. You must provide 
          accurate details and images you have the right to use. We print to your specifications 
          and are not responsible for design choices (e.g. resolution or cropping) once you confirm.
        </p>
        <p>
          Prices are in ZAR and include the amounts shown at checkout unless otherwise stated. 
          Our Returns & refunds and Shipping & delivery pages form part of the agreement. We 
          reserve the right to refuse or cancel orders and to update these terms; continued use 
          after changes constitutes acceptance.
        </p>
      </div>
    </PageContainer>
  );
}
