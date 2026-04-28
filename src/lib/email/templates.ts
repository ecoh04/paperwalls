// Plain-HTML transactional templates. Premium-quiet voice; no emoji, no marketing
// language. We render inline styles because every webmail client mangles <style>.

const BRAND_INK    = "#1a1a1a";
const BRAND_MUTED  = "#5a5a5a";
const BRAND_BORDER = "#e6e3dc";
const BRAND_BG     = "#f7f5f0";

function shell(args: { preheader: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PaperWalls</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND_INK};">
    <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${args.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 16px 32px;border-bottom:1px solid ${BRAND_BORDER};">
                <div style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">paper<span style="color:#c47b3a;">walls</span></div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${args.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid ${BRAND_BORDER};color:${BRAND_MUTED};font-size:12px;line-height:1.6;">
                PaperWalls · Cape Town, South Africa<br/>
                Reply to this email any time. A real person responds.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${BRAND_INK};">${text}</p>`;
}
function muted(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${BRAND_MUTED};">${text}</p>`;
}
function h1(text: string): string {
  return `<h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${BRAND_INK};">${text}</h1>`;
}
function spec(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${BRAND_MUTED};font-size:13px;width:40%;">${label}</td>
    <td style="padding:6px 0;color:${BRAND_INK};font-size:13px;font-weight:500;">${value}</td>
  </tr>`;
}

export type OrderEmailRow = {
  order_number:    string;
  customer_name:   string;
  total_cents:     number;
  wall_count?:     number | null;
  total_sqm?:      number | null;
  wallpaper_style?: string | null;
  application_method?: string | null;
  product_type?:   string;
  tracking_number?: string | null;
  courier_name?:   string | null;
  tracking_url?:   string | null;
};

function fmtZar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(cents / 100);
}

export function renderOrderConfirmed(o: OrderEmailRow) {
  const subject = `Order ${o.order_number} confirmed`;
  const isWallpaper = o.product_type !== "sample_pack";

  const specsRows = isWallpaper
    ? [
        o.wall_count ? spec("Walls", String(o.wall_count)) : "",
        o.total_sqm  ? spec("Coverage", `${Number(o.total_sqm).toFixed(2)} m²`) : "",
        o.wallpaper_style ? spec("Finish", o.wallpaper_style) : "",
        o.application_method ? spec("Application", o.application_method === "diy" ? "DIY install" : "Pro install") : "",
        spec("Total", fmtZar(o.total_cents)),
      ].join("")
    : spec("Total", fmtZar(o.total_cents));

  const body = `
    ${h1("Thanks. Your order is in.")}
    ${p(`We've received order <strong>${o.order_number}</strong> and have started production. You'll get another email when it ships, usually within five business days.`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px 0;border-top:1px solid ${BRAND_BORDER};border-bottom:1px solid ${BRAND_BORDER};">
      ${specsRows}
    </table>
    ${muted("Free SA delivery. Free reprints if anything ships imperfect, no return shipping needed.")}
  `;

  return {
    subject,
    html: shell({ preheader: `Order ${o.order_number} is in production`, bodyHtml: body }),
  };
}

export function renderOrderShipped(o: OrderEmailRow) {
  const subject = `Order ${o.order_number} shipped`;
  const tracking = o.tracking_number
    ? `${o.courier_name ?? "Courier"} · <strong>${o.tracking_number}</strong>${o.tracking_url ? ` · <a href="${o.tracking_url}" style="color:#c47b3a;">Track</a>` : ""}`
    : "Tracking details to follow";

  const body = `
    ${h1("Your wallpaper is on the way.")}
    ${p(`Order <strong>${o.order_number}</strong> has shipped. Most addresses receive in 1–3 business days.`)}
    ${p(tracking)}
    ${muted("Reply to this email if anything looks off when it arrives — we'll reprint, no questions asked.")}
  `;
  return {
    subject,
    html: shell({ preheader: `Order ${o.order_number} is on its way`, bodyHtml: body }),
  };
}

export function renderOrderDelivered(o: OrderEmailRow) {
  const subject = `Order ${o.order_number} delivered`;
  const body = `
    ${h1("Order delivered.")}
    ${p(`We marked order <strong>${o.order_number}</strong> as delivered. We hope it goes up beautifully.`)}
    ${p(`If anything's not right — sizing, finish, anything — just reply. Free reprint, free shipping back, no return shipping needed.`)}
  `;
  return {
    subject,
    html: shell({ preheader: `Order ${o.order_number} delivered`, bodyHtml: body }),
  };
}

export function renderAdminNewOrder(args: {
  order_numbers: string[];
  total_cents:   number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  city:          string;
  province:      string;
  pf_payment_id: string | null;
  admin_url:     string;
}) {
  const subject = args.order_numbers.length === 1
    ? `New order ${args.order_numbers[0]} · ${fmtZar(args.total_cents)}`
    : `${args.order_numbers.length} new orders · ${fmtZar(args.total_cents)}`;

  const orderList = args.order_numbers.map((n) => `<strong>${n}</strong>`).join(", ");
  const body = `
    ${h1("New paid order")}
    ${p(`${orderList} · ${fmtZar(args.total_cents)}`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px 0;border-top:1px solid ${BRAND_BORDER};border-bottom:1px solid ${BRAND_BORDER};">
      ${spec("Customer", `${args.customer_name} · ${args.customer_email} · ${args.customer_phone}`)}
      ${spec("Address",  `${args.city}, ${args.province}`)}
      ${args.pf_payment_id ? spec("PayFast id", args.pf_payment_id) : ""}
    </table>
    ${p(`<a href="${args.admin_url}" style="display:inline-block;background:${BRAND_INK};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Open in admin</a>`)}
  `;
  return {
    subject,
    html: shell({ preheader: subject, bodyHtml: body }),
  };
}

export function renderAbandonedCart(args: { customer_name: string; resume_url: string }) {
  const subject = "Your wallpaper, still in the cart";
  const body = `
    ${h1(`${args.customer_name?.split(" ")[0] || "Hi"}, your design is still saved.`)}
    ${p(`We held your configuration. If you want to finish, your cart is still there.`)}
    ${p(`<a href="${args.resume_url}" style="display:inline-block;background:${BRAND_INK};color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Pick up where you left off</a>`)}
    ${muted("If you've changed your mind, no worries — this is the only nudge.")}
  `;
  return {
    subject,
    html: shell({ preheader: "Your saved configuration is one click away", bodyHtml: body }),
  };
}
