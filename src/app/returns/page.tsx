import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageContainer } from "@/components/PageContainer";

export const metadata = {
  title: "Returns & refunds | PaperWalls",
  description: "Our returns and refund policy for custom wallpaper.",
};

export default function ReturnsPage() {
  return (
    <PageContainer>
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Returns & refunds" }]} />
      <h1 className="text-3xl font-bold text-stone-900">Returns & refunds</h1>
      <div className="mt-8 max-w-2xl space-y-6 text-stone-600">
        <p>
          Because each order is custom-printed to your dimensions and design, we generally 
          cannot accept returns or exchanges once production has started. If there has been 
          an error on our side (e.g. wrong size or print defect), we will work with you to 
          reprint or refund as appropriate.
        </p>
        <p>
          If you have a concern before we print, please contact us as soon as possible. 
          Refunds for cancelled orders may be subject to our cancellation policy.
        </p>
      </div>
    </PageContainer>
  );
}
