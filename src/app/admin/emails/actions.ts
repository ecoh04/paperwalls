"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  renderOrderConfirmed,
  renderOrderShipped,
  renderOrderDelivered,
  renderAdminNewOrder,
  renderAbandonedCart,
  type OrderEmailRow,
} from "@/lib/email/templates";

// Founder QA tool: fire any transactional template to your own inbox to check
// how it renders in a real client. Admin-gated exactly like setDailySpend.
// Hits Resend directly (not the queue + drainer) so a misconfigured key
// surfaces here as a clear error rather than a silent skip in the cron.
//
// Reuses the existing render functions and sendEmail; never reimplements a
// template. Each kind builds realistic sample data, then sends with a [TEST]
// subject prefix so it is obvious in your inbox these are not real orders.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://paperwalls.co.za";
}

// Shared sample order used by the three customer order templates.
const SAMPLE_ORDER: OrderEmailRow = {
  order_number:       "PW-TEST",
  customer_name:      "Elad Cohen",
  total_cents:        348000,
  wall_count:         3,
  total_sqm:          12.4,
  wallpaper_style:    "matte",
  application_method: "diy",
  product_type:       "wallpaper",
};

function rendered(kind: string): { subject: string; html: string } | null {
  switch (kind) {
    case "order_confirmed":
      return renderOrderConfirmed(SAMPLE_ORDER);
    case "order_shipped":
      return renderOrderShipped({
        ...SAMPLE_ORDER,
        tracking_number: "CG48820551",
        courier_name:    "The Courier Guy",
        tracking_url:    "https://www.thecourierguy.co.za",
      });
    case "order_delivered":
      return renderOrderDelivered(SAMPLE_ORDER);
    case "admin_new_order":
      return renderAdminNewOrder({
        order_numbers:  ["PW-TEST"],
        total_cents:    348000,
        customer_name:  "Elad Cohen",
        customer_email: "elad@adsytemedia.com",
        customer_phone: "082 000 0000",
        city:           "Cape Town",
        province:       "western_cape",
        pf_payment_id:  "TEST123",
        admin_url:      `${appUrl()}/admin/orders`,
      });
    case "abandoned_cart_wallpaper":
      return renderAbandonedCart({
        customer_name:     "Elad Cohen",
        resume_url:        `${appUrl()}/configure`,
        image_preview_url: "https://www.paperwalls.co.za/images/product/pdp-01-hero.jpg",
        kind:              "wallpaper",
      });
    case "abandoned_cart_sample":
      return renderAbandonedCart({
        customer_name: "Elad Cohen",
        resume_url:    `${appUrl()}/configure`,
        kind:          "sample",
      });
    default:
      return null;
  }
}

export async function sendTestEmail(
  kind: string,
  toOverride?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false, error: "Admin only" };

  const override = toOverride?.trim();
  const to = override && EMAIL_RE.test(override) ? override : user.email;
  if (override && !EMAIL_RE.test(override)) return { ok: false, error: "That does not look like a valid email address" };
  if (!to) return { ok: false, error: "No recipient address found" };

  const tpl = rendered(kind);
  if (!tpl) return { ok: false, error: `Unknown template: ${kind}` };

  const result = await sendEmail({
    to,
    subject: `[TEST] ${tpl.subject}`,
    html:    tpl.html,
  });

  if ("skipped" in result) return { ok: false, error: "Email not configured (no RESEND_API_KEY)" };
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
