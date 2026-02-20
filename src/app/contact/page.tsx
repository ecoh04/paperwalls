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
      <h1 className="text-3xl font-bold text-stone-900">Contact us</h1>
      <p className="mt-2 text-stone-600">
        Questions about your order, custom wallpaper, or installation? Reach out below.
      </p>
      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Email</h2>
          <a href="mailto:hello@paperwalls.co.za" className="mt-2 block text-stone-900 hover:underline">
            hello@paperwalls.co.za
          </a>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Phone</h2>
          <p className="mt-2 text-stone-900">Add your phone number here</p>
        </div>
      </div>
      <p className="mt-10 text-sm text-stone-500">
        A contact form can be added here when you’re ready (e.g. name, email, message).
      </p>
    </PageContainer>
  );
}
