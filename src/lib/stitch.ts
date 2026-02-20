/**
 * Stitch Express payment integration (South Africa).
 * Create a payment and get a redirect URL for the customer.
 * Set STITCH_API_URL and STITCH_API_KEY in env. See https://express.stitch.money/api-docs
 */

const STITCH_API_URL = process.env.STITCH_API_URL ?? "";
const STITCH_API_KEY = process.env.STITCH_API_KEY ?? "";
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface CreatePaymentParams {
  /** Total amount in ZAR cents. */
  amountCents: number;
  /** Order numbers to pass to success URL and webhook (e.g. ["PW-20260216-abc1", "PW-20260216-def2"]). */
  orderNumbers: string[];
  /** Optional reference for your records. */
  reference?: string;
}

/**
 * Creates a Stitch Express payment and returns the URL to redirect the customer to.
 * If Stitch is not configured, returns the success page URL with orders (for local testing).
 */
export async function createStitchPayment(params: CreatePaymentParams): Promise<{ redirectUrl: string }> {
  const { amountCents, orderNumbers } = params;
  const successUrl = `${NEXT_PUBLIC_APP_URL}/checkout/success?orders=${encodeURIComponent(orderNumbers.join(","))}`;
  const cancelUrl = `${NEXT_PUBLIC_APP_URL}/checkout`;

  if (!STITCH_API_URL || !STITCH_API_KEY) {
    // No Stitch config: redirect straight to success (for dev/testing only)
    return { redirectUrl: successUrl };
  }

  try {
    const res = await fetch(STITCH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STITCH_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amountCents / 100,
        currency: "ZAR",
        reference: params.reference ?? orderNumbers[0],
        redirectUrl: successUrl,
        cancelUrl,
        metadata: { order_numbers: orderNumbers.join(",") },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stitch API error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { url?: string; redirectUrl?: string; paymentUrl?: string };
    const redirectUrl =
      data.url ?? data.redirectUrl ?? data.paymentUrl;
    if (!redirectUrl || typeof redirectUrl !== "string") {
      throw new Error("Stitch API did not return a redirect URL");
    }
    return { redirectUrl };
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Failed to create Stitch payment");
  }
}
