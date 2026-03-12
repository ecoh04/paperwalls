import crypto from "crypto";

function env(key: string, fallback = ""): string {
  const v = process.env[key] ?? fallback;
  return typeof v === "string" ? v.trim() : "";
}

const PAYFAST_MERCHANT_ID = env("PAYFAST_MERCHANT_ID");
const PAYFAST_MERCHANT_KEY = env("PAYFAST_MERCHANT_KEY");
const PAYFAST_PASSPHRASE = env("PAYFAST_PASSPHRASE") || null;
const PAYFAST_SANDBOX = env("PAYFAST_SANDBOX", "true").toLowerCase() === "true";
const NEXT_PUBLIC_APP_URL = (env("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");

export function getPayfastHost() {
  return PAYFAST_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
}

export function assertPayfastEnv() {
  const missing = [
    !PAYFAST_MERCHANT_ID && "PAYFAST_MERCHANT_ID",
    !PAYFAST_MERCHANT_KEY && "PAYFAST_MERCHANT_KEY",
  ].filter(Boolean) as string[];
  if (missing.length > 0) {
    throw new Error(
      `PayFast env not set: ${missing.join(
        ", "
      )}. Set them in Vercel → Project → Settings → Environment Variables. See https://developers.payfast.co.za/documentation/`
    );
  }
}

export function formatPayfastAmount(amountCents: number): string {
  const rands = amountCents / 100;
  return rands.toFixed(2);
}

/**
 * Generate PayFast signature for custom integration / ITN as per docs:
 * https://developers.payfast.co.za/documentation/#step_2_create_security_signature
 */
export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase: string | null = PAYFAST_PASSPHRASE
): string {
  let pfOutput = "";
  Object.entries(data).forEach(([key, val]) => {
    if (val !== "") {
      pfOutput += `${key}=${encodeURIComponent(val.trim())}&`;
    }
  });
  const paramString = pfOutput.slice(0, -1);
  const withPassphrase =
    passphrase && passphrase.length > 0
      ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim())}`
      : paramString;
  return crypto.createHash("md5").update(withPassphrase).digest("hex");
}

export function buildPayfastFormFields(params: {
  orderNumbers: string[];
  amountCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): { url: string; fields: Record<string, string> } {
  assertPayfastEnv();
  const host = getPayfastHost();

  const [firstName, ...rest] = params.customerName.trim().split(" ");
  const lastName = rest.join(" ");

  const returnUrl = `${NEXT_PUBLIC_APP_URL}/checkout/success?orders=${encodeURIComponent(
    params.orderNumbers.join(",")
  )}`;
  const cancelUrl = `${NEXT_PUBLIC_APP_URL}/checkout`;
  const notifyUrl = `${NEXT_PUBLIC_APP_URL}/api/payfast/notify`;

  const data: Record<string, string> = {
    // Merchant details
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    // Customer details
    name_first: firstName || params.customerName.trim(),
    name_last: lastName,
    email_address: params.customerEmail,
    cell_number: params.customerPhone,
    // Transaction details
    m_payment_id: params.orderNumbers[0],
    amount: formatPayfastAmount(params.amountCents),
    item_name: `PaperWalls order ${params.orderNumbers[0]}`,
    item_description:
      params.orderNumbers.length > 1
        ? `PaperWalls custom wallpaper (${params.orderNumbers.length} items)`
        : "PaperWalls custom wallpaper",
    custom_str1: params.orderNumbers.join(","),
    // Transaction options
    email_confirmation: "1",
    confirmation_address: params.customerEmail,
  };

  const signature = generatePayfastSignature(data);
  data.signature = signature;

  return {
    url: `https://${host}/eng/process`,
    fields: data,
  };
}

