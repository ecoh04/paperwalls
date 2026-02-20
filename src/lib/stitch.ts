/**
 * Stitch Express payment integration (South Africa).
 * Flow: 1) POST /api/v1/token to get access token, 2) POST /api/v1/payment-links to create link, 3) redirect customer to link.
 * Env: STITCH_API_BASE_URL (e.g. https://express.stitch.money), STITCH_CLIENT_ID, STITCH_CLIENT_SECRET.
 * See https://express.stitch.money/api-docs
 */

function env(key: string, fallback = ""): string {
  const v = process.env[key] ?? fallback;
  return typeof v === "string" ? v.trim() : "";
}
const STITCH_API_BASE_URL = (env("STITCH_API_BASE_URL") || env("STITCH_API_URL")).replace(/\/$/, "");
const STITCH_CLIENT_ID = env("STITCH_CLIENT_ID");
const STITCH_CLIENT_SECRET = env("STITCH_CLIENT_SECRET") || env("STITCH_API_KEY");
const NEXT_PUBLIC_APP_URL = (env("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/$/, "");

export interface CreatePaymentParams {
  /** Total amount in ZAR cents. */
  amountCents: number;
  /** Order numbers to pass to success URL and webhook. */
  orderNumbers: string[];
  /** Optional reference for your records (Stitch: merchantReference). */
  reference?: string;
  /** Payer details (from checkout form). Stitch request body fields. */
  payerName?: string;
  payerEmailAddress?: string;
  payerPhoneNumber?: string;
}

/** Get a short-lived access token (Stitch uses 15min). */
async function getStitchToken(): Promise<string> {
  if (!STITCH_CLIENT_ID || !STITCH_CLIENT_SECRET) {
    const missing = [
      !STITCH_CLIENT_ID && "STITCH_CLIENT_ID",
      !STITCH_CLIENT_SECRET && "STITCH_CLIENT_SECRET",
    ].filter(Boolean);
    throw new Error(
      `Stitch env not set: ${missing.join(", ")}. In Vercel: Project → Settings → Environment Variables (exact names), then Redeploy.`
    );
  }
  const url = `${STITCH_API_BASE_URL}/api/v1/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: STITCH_CLIENT_ID,
      clientSecret: STITCH_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stitch token error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const token =
    (data.access_token as string) ??
    (data.accessToken as string) ??
    (data.token as string);
  if (!token || typeof token !== "string") {
    throw new Error(
      `Stitch token response missing access_token. Response keys: ${Object.keys(data).join(", ") || "(none)"}`
    );
  }
  return token;
}

/**
 * Creates a Stitch Express payment link and returns the URL to redirect the customer to.
 * Uses Stitch POST /api/v1/payment-links request body and appends redirect_url to the link for post-payment return.
 */
export async function createStitchPayment(params: CreatePaymentParams): Promise<{ redirectUrl: string }> {
  const { amountCents, orderNumbers } = params;
  const successUrl = `${NEXT_PUBLIC_APP_URL}/checkout/success?orders=${encodeURIComponent(orderNumbers.join(","))}`;

  if (!STITCH_API_BASE_URL || !STITCH_CLIENT_ID || !STITCH_CLIENT_SECRET) {
    return { redirectUrl: successUrl };
  }

  try {
    const token = await getStitchToken();
    const url = `${STITCH_API_BASE_URL}/api/v1/payment-links`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const body: Record<string, unknown> = {
      amount: amountCents / 100,
      merchantReference: params.reference ?? orderNumbers[0],
      expiresAt,
      payerName: params.payerName ?? "Customer",
      payerEmailAddress: params.payerEmailAddress ?? "customer@example.com",
      payerPhoneNumber: params.payerPhoneNumber ?? "",
      collectDeliveryDetails: false,
      skipCheckoutPage: false,
      deliveryFee: 0,
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stitch payment-links error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { link?: string };
    const link = data.link;
    if (!link || typeof link !== "string") {
      throw new Error("Stitch API did not return a link. Response: " + JSON.stringify(data));
    }
    const separator = link.includes("?") ? "&" : "?";
    const redirectUrl = `${link}${separator}redirect_url=${encodeURIComponent(successUrl)}`;
    return { redirectUrl };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Failed to create Stitch payment");
  }
}
