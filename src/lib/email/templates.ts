// Editorial transactional templates. Spare, composed, interiors-magazine voice
// (Aesop / Apartmento register): serif headlines, generous whitespace, tracked
// uppercase labels, a quiet sign-off. Inline styles only, because every webmail
// client mangles <style>. No emoji, no marketing language, no em or en dashes.

const INK     = "#1f1b16";
const BODY    = "#4f4840";
const MUTED   = "#857d70";
const FAINT   = "#a39a8c";
const ACCENT  = "#c4622d";
const EYEBROW = "#b07a4a";
const BORDER  = "#e8e2d8";
const RULE    = "#ece6db";
const PAGE    = "#f3efe8";

const SANS  = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

function shell(args: { preheader: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PaperWalls</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE};font-family:${SANS};color:${INK};">
    <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${args.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;">
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:0.04em;color:${INK};">paper<span style="color:${ACCENT};">walls</span></div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 36px 40px;">
                ${args.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;border-top:1px solid ${RULE};color:${FAINT};font-size:12px;line-height:1.7;">
                PaperWalls &middot; Cape Town, South Africa<br/>
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

function eyebrow(text: string): string {
  return `<p style="margin:0 0 18px 0;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${EYEBROW};">${text}</p>`;
}
function h1(text: string): string {
  return `<h1 style="margin:0 0 20px 0;font-family:${SERIF};font-size:27px;line-height:1.32;font-weight:500;color:${INK};">${text}</h1>`;
}
function p(text: string): string {
  return `<p style="margin:0 0 22px 0;font-size:16px;line-height:1.75;color:${BODY};">${text}</p>`;
}
function muted(text: string): string {
  return `<p style="margin:0 0 22px 0;font-size:14px;line-height:1.65;color:${MUTED};">${text}</p>`;
}
function signoff(line: string, name: string): string {
  return `<p style="margin:26px 0 0 0;font-family:${SERIF};font-style:italic;font-size:15px;line-height:1.7;color:${MUTED};">${line}<br/><span style="font-style:normal;font-weight:500;color:${INK};">${name}</span></p>`;
}
function button(href: string, label: string): string {
  return `<p style="margin:4px 0 22px 0;"><a href="${href}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a></p>`;
}
function textLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${ACCENT};text-decoration:underline;font-weight:500;">${label}</a>`;
}

type SpecRow = { label: string; value: string; strong?: boolean };
function specBlock(rows: SpecRow[]): string {
  const body = rows.map((r) => `<tr>
    <td style="padding:9px 0;color:${FAINT};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;">${r.label}</td>
    <td style="padding:9px 0;color:${INK};font-size:${r.strong ? "16px" : "14px"};font-weight:${r.strong ? "700" : "400"};text-align:right;">${r.value}</td>
  </tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px 0;border-top:1px solid ${RULE};border-bottom:1px solid ${RULE};">${body}</table>`;
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
  const firstName = o.customer_name?.trim().split(" ")[0];

  const rows: SpecRow[] = isWallpaper
    ? ([
        o.wall_count ? { label: "Walls", value: String(o.wall_count) } : null,
        o.total_sqm ? { label: "Coverage", value: `${Number(o.total_sqm).toFixed(2)} m²` } : null,
        o.wallpaper_style ? { label: "Finish", value: o.wallpaper_style } : null,
        o.application_method ? { label: "Application", value: o.application_method === "diy" ? "DIY install" : "Pro install" } : null,
        { label: "Total", value: fmtZar(o.total_cents), strong: true },
      ].filter(Boolean) as SpecRow[])
    : [{ label: "Total", value: fmtZar(o.total_cents), strong: true }];

  const body = `
    ${eyebrow("Order confirmed")}
    ${h1("Your wallpaper has gone to print.")}
    ${p(`${firstName ? `Thank you, ${firstName}.` : "Thank you."} We print each order to the exact measurements you sent, so your design meets the wall without a seam out of place. Allow about five working days to make and pack it properly. We will write the moment it ships.`)}
    ${specBlock(rows)}
    ${muted("Free delivery anywhere in South Africa. If anything arrives less than perfect, we reprint it free, with nothing to send back.")}
    ${signoff("Until then,", "PaperWalls")}
  `;

  return {
    subject,
    html: shell({ preheader: `We have started printing order ${o.order_number}.`, bodyHtml: body }),
  };
}

export function renderOrderShipped(o: OrderEmailRow) {
  const subject = `Order ${o.order_number} shipped`;
  const courier = o.courier_name ?? "Courier";
  const trackingBlock = o.tracking_number
    ? `${specBlock([{ label: "Courier", value: courier }, { label: "Tracking", value: o.tracking_number }])}${o.tracking_url ? `<p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;">${textLink(o.tracking_url, "Track your parcel")}</p>` : ""}`
    : muted("Tracking details to follow shortly.");

  const body = `
    ${eyebrow("On its way")}
    ${h1("Your wallpaper is on its way.")}
    ${p(`Order <strong>${o.order_number}</strong> has left us. Most of South Africa receives within one to three working days.`)}
    ${trackingBlock}
    ${muted("When it arrives, unroll it and have a look. If anything seems off, reply to this note and we will reprint, no questions and nothing to send back.")}
    ${signoff("Speak soon,", "PaperWalls")}
  `;
  return {
    subject,
    html: shell({ preheader: `Order ${o.order_number} is on its way.`, bodyHtml: body }),
  };
}

export function renderOrderDelivered(o: OrderEmailRow) {
  const subject = `Order ${o.order_number} delivered`;
  const body = `
    ${eyebrow("Delivered")}
    ${h1("Your wallpaper has arrived.")}
    ${p(`Order <strong>${o.order_number}</strong> shows as delivered. We hope it goes up beautifully. If you are hanging it yourself, take your time on the first panel. The rest follow easily from there.`)}
    ${p("If anything is not right, the sizing, the finish, anything at all, reply to this note. We will reprint and cover the shipping both ways.")}
    ${muted("And if it turns out well, we would love to see it. Reply with a photo.")}
    ${signoff("Warmly,", "PaperWalls")}
  `;
  return {
    subject,
    html: shell({ preheader: `Order ${o.order_number} has arrived.`, bodyHtml: body }),
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
    ${eyebrow("New paid order")}
    ${h1(fmtZar(args.total_cents))}
    ${p(orderList)}
    ${specBlock([
      { label: "Customer", value: args.customer_name },
      { label: "Contact", value: `${args.customer_email} &middot; ${args.customer_phone}` },
      { label: "Ship to", value: `${args.city}, ${args.province}` },
      ...(args.pf_payment_id ? [{ label: "PayFast id", value: args.pf_payment_id }] : []),
    ])}
    ${button(args.admin_url, "Open in admin")}
  `;
  return {
    subject,
    html: shell({ preheader: subject, bodyHtml: body }),
  };
}

export function renderAbandonedCart(args: { customer_name: string; resume_url: string }) {
  const subject = "Your design is still saved";
  const first = args.customer_name?.trim().split(" ")[0] || "Hello";
  const body = `
    ${eyebrow("Still saved")}
    ${h1(`${first}, we saved your design.`)}
    ${p("Your configuration is exactly where you left it, measurements and all. Pick it back up whenever you are ready.")}
    ${button(args.resume_url, "Finish your order")}
    ${muted("Not the right time? No matter. This is the only reminder you will get.")}
  `;
  return {
    subject,
    html: shell({ preheader: "Your saved configuration is one click away.", bodyHtml: body }),
  };
}
