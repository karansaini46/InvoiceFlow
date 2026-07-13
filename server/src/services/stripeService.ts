import Stripe from "stripe";

import { loadEnv } from "../config/env";

loadEnv();

interface CreateCheckoutSessionParams {
  invoiceId: string;
  invoiceNumber: string;
  clientEmail: string;
  amountCents: number;
  currency: string;
  freelancerName: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

interface WebhookEventResult {
  event: Stripe.Event;
}

let stripeClient: Stripe | null = null;

const getStripe = (): Stripe => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required for payment processing.");
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: "2026-06-24.dahlia", // Matches installed stripe sdk
  });

  return stripeClient;
};

/**
 * Whether Stripe is configured (requires both secret key and webhook secret).
 */
export const isStripeConfigured = (): boolean => {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
};

/**
 * Create a Stripe Checkout Session for invoice payment.
 * The invoiceId is stored in session metadata for webhook mapping.
 */
export const createCheckoutSession = async (
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSessionResult> => {
  const stripe = getStripe();

  const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.clientEmail,
    metadata: {
      invoiceId: params.invoiceId,
    },
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `Invoice ${params.invoiceNumber}`,
            description: `Payment to ${params.freelancerName}`,
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${clientUrl}/invoices/${params.invoiceId}?payment=success`,
    cancel_url: `${clientUrl}/invoices/${params.invoiceId}?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours in seconds
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
};

/**
 * Construct and verify a Stripe webhook event from the raw body and signature.
 */
export const constructWebhookEvent = (
  rawBody: Buffer,
  signature: string,
): WebhookEventResult => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required for webhook verification.");
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  return { event };
};

/**
 * Retrieve a Checkout Session from Stripe by ID.
 */
export const retrieveCheckoutSession = async (
  sessionId: string,
): Promise<Stripe.Checkout.Session> => {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
};

export type { CreateCheckoutSessionParams, CheckoutSessionResult };
