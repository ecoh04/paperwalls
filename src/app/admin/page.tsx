import { redirect } from "next/navigation";

// Factory ops landing — orders is the daily-driver tab.
// Analytics has its own home at /admin/analytics so factory and analytics
// stay visually distinct.
export default function AdminPage() {
  redirect("/admin/orders");
}
