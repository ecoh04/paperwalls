import crypto from "crypto";

function env(key: string, fallback = ""): string {
  const v = process.env[key] ?? fallback;
  return typeof v === "string" ? v.trim() : "";
}

const PAYFAST_MERCHANT_ID  = env("PAYFAST_MERCHANT_ID");
const PAYFAST_MERCHANT_KEY = env("PAYFAST_MERCHANT_KEY");
const PAYFAST_PASSPHRASE   = env("PAYFAST_PASSPHRASE") || null;
const PAYFAST_SANDBOX      = env("PAYFAST_SANDBOX", "true").toLowerCase() === "true";
const NEXT_PUBLIC_APP_URL  = (env("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");

/**
 * Replicates PHP urlencode():
 *   - Spaces → '+'
 *   - All percent-encoded bytes uppercase
 * PayFast signatures are built this way on both ends.
 */
export function pfUrlEncode(value: string): string {
  let encoded = encodeURIComponent(value.trim());
  encoded = encoded.replace(/%20/g, "+");
  encoded = encoded.replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
  return encoded;
}

export function getPayfastHost(): string {
  return PAYFAST_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
}

export function getPayfastSandbox(): boolean {
  return PAYFAST_SANDBOX;
}

export function assertPayfastEnv() {
  const missing = [
    !PAYFAST_MERCHANT_ID  && "PAYFAST_MERCHANT_ID",
    !PAYFAST_MERCHANT_KEY && "PAYFAST_MERCHANT_KEY",
  ].filter(Boolean) as string[];
  if (missing.length > 0) {
    throw new Error(
      `PayFast env not set: ${missing.join(", ")}. Set them in Vercel → Project → Settings → Environment Variables.`
    );
  }
}

export function formatPayfastAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

/**
 * Generate MD5 signature per PayFast docs Step 2.
 * Field order MUST match the order in the data object (same as form field declaration order).
 * https://developers.payfast.co.za/docs#step_2_create_security_signature
 */
export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase: string | null = PAYFAST_PASSPHRASE
): string {
  const pairs: string[] = [];
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== "") {
      pairs.push(`${key}=${pfUrlEncode(val)}`);
    }
  });
  let paramString = pairs.join("&");
  if (passphrase && passphrase.length > 0) {
    paramString += `&passphrase=${pfUrlEncode(passphrase)}`;
  }
  return crypto.createHash("md5").update(paramString).digest("hex");
}

/**
 * Builds the PayFast payment data object.
 * Used by both the onsite and custom integration flows.
 */
function buildPayfastData(params: {
  orderNumbers:  string[];
  amountCents:   number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
}): Record<string, string> {
  assertPayfastEnv();

  const [firstName, ...rest] = params.customerName.trim().split(" ");
  const lastName = rest.join(" ");

  const digits = params.customerPhone.replace(/\D/g, "");
  let cellNumber = "";
  if (digits.length === 10 && digits.startsWith("0")) {
    cellNumber = digits;
  } else if (digits.length === 11 && digits.startsWith("27")) {
    cellNumber = "0" + digits.slice(2);
  }

  const returnUrl = `${NEXT_PUBLIC_APP_URL}/checkout/success?orders=${encodeURIComponent(
    params.orderNumbers.join(",")
  )}`;
  const cancelUrl  = `${NEXT_PUBLIC_APP_URL}/checkout`;
  const notifyUrl  = `${NEXT_PUBLIC_APP_URL}/api/payfast/notify`;

  const data: Record<string, string> = {
    merchant_id:  PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url:   returnUrl,
    cancel_url:   cancelUrl,
    notify_url:   notifyUrl,
    name_first:   firstName || params.customerName.trim(),
    name_last:    lastName,
    email_address: params.customerEmail,
    ...(cellNumber ? { cell_number: cellNumber } : {}),
    m_payment_id:     params.orderNumbers[0],
    amount:           formatPayfastAmount(params.amountCents),
    item_name:        `PaperWalls order ${params.orderNumbers[0]}`,
    item_description: params.orderNumbers.length > 1
      ? `PaperWalls custom wallpaper (${params.orderNumbers.length} items)`
      : "PaperWalls custom wallpaper",
    custom_str1:           params.orderNumbers.join(","),
    email_confirmation:    "1",
    confirmation_address:  params.customerEmail,
  };

  return data;
}

/**
 * ONSITE PAYMENTS (preferred)
 * POSTs payment details server-side to PayFast → returns a uuid.
 * The client then calls window.payfast_do_onsite_payment({uuid}) to
 * show the embedded payment modal — customer never leaves the page.
 * https://developers.payfast.co.za/docs#onsite_payments
 */
export async function generateOnsiteIdentifier(params: {
  orderNumbers:  string[];
  amountCents:   number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
}): Promise<string> {
  const data = buildPayfastData(params);
  const signature = generatePayfastSignature(data);
  data.signature = signature;

  // Build URL-encoded body (same urlencode as signature generation)
  const body = Object.entries(data)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${pfUrlEncode(v)}`)
    .join("&");

  const host = getPayfastHost();
  const res = await fetch(`https://${host}/onsite/process`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`PayFast onsite/process responded ${res.status}`);
  }

  const json = await res.json() as { uuid?: string };
  if (!json.uuid) {
    throw new Error("PayFast onsite/process did not return a uuid");
  }

  return json.uuid;
}

/**
 * CUSTOM INTEGRATION (fallback redirect flow)
 * Returns a PayFast form URL + hidden fields the client can POST to.
 * Kept as a fallback in case onsite is unavailable.
 */
export function buildPayfastFormFields(params: {
  orderNumbers:  string[];
  amountCents:   number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
}): { url: string; fields: Record<string, string> } {
  const data = buildPayfastData(params);
  data.signature = generatePayfastSignature(data);
  const host = getPayfastHost();
  return {
    url:    `https://${host}/eng/process`,
    fields: data,
  };
}
