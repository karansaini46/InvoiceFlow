import { Router, type Request, type Response } from "express";
import express from "express";

import { prisma } from "../lib/prisma";
import {
  constructWebhookEvent,
  isStripeConfigured,
} from "../services/stripeService";
import {
  sendPaymentConfirmationEmails,
  isResendConfigured,
} from "../services/email/resendService";
import { cancelAllFollowUps } from "../services/followUpService";
import { isRedisConfigured } from "../config/redis";

// ──────────────────────────────────────────────────────────────
// Stripe Webhook
// ──────────────────────────────────────────────────────────────

const stripeRouter = Router();

// Use express.raw for Stripe signature verification
stripeRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!isStripeConfigured()) {
      console.warn("[STRIPE WEBHOOK] Stripe is not configured — ignoring webhook");
      res.sendStatus(200);
      return;
    }

    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      console.error("[STRIPE WEBHOOK] Missing stripe-signature header");
      res.sendStatus(400);
      return;
    }

    let eventType: string;
    let eventData: Record<string, unknown>;

    try {
      const { event } = constructWebhookEvent(
        req.body as Buffer,
        signature,
      );

      eventType = event.type;
      eventData = event.data.object as unknown as Record<string, unknown>;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[STRIPE WEBHOOK] Signature verification failed:", message);
      res.sendStatus(400);
      return;
    }

    try {
      if (eventType === "checkout.session.completed") {
        const metadata = eventData.metadata as Record<string, string> | undefined;
        const invoiceId = metadata?.invoiceId;

        if (!invoiceId) {
          console.warn("[STRIPE WEBHOOK] checkout.session.completed missing invoiceId metadata");
          res.sendStatus(200);
          return;
        }

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!invoice) {
          console.error(`[STRIPE WEBHOOK] Invoice ${invoiceId} not found`);
          res.sendStatus(200);
          return;
        }

        // Idempotency check — if already paid, return 200 without side effects
        if (invoice.status === "PAID") {
          console.log(`[STRIPE WEBHOOK] Invoice ${invoiceId} already PAID — ignoring duplicate`);
          res.sendStatus(200);
          return;
        }

        const paymentIntentId = typeof eventData.payment_intent === "string"
          ? eventData.payment_intent
          : null;

        const paidAt = new Date();

        // Mark as PAID
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt,
            stripePaymentIntentId: paymentIntentId,
          },
        });

        console.log(`[STRIPE WEBHOOK] Invoice ${invoiceId} marked as PAID`);

        // Cancel pending follow-up jobs
        if (isRedisConfigured()) {
          await cancelAllFollowUps(invoiceId, invoice.userId);
        }

        // Send payment confirmation emails
        if (isResendConfigured()) {
          try {
            await sendPaymentConfirmationEmails({
              invoiceNumber: invoice.number,
              freelancerName: invoice.user.name,
              freelancerEmail: invoice.user.email,
              clientName: invoice.clientName,
              clientEmail: invoice.clientEmail,
              total: invoice.total,
              currency: invoice.currency,
              paidAt,
            });
          } catch (emailError: unknown) {
            const msg = emailError instanceof Error ? emailError.message : String(emailError);
            console.error(`[STRIPE WEBHOOK] Failed to send payment confirmation emails: ${msg}`);
            // Don't fail the webhook for email errors
          }
        }
      } else if (eventType === "checkout.session.expired") {
        const metadata = eventData.metadata as Record<string, string> | undefined;
        const invoiceId = metadata?.invoiceId;
        console.log(`[STRIPE WEBHOOK] Checkout session expired for invoice ${invoiceId ?? "unknown"}`);
        // Leave invoice status as-is (still SENT)
      } else if (eventType === "payment_intent.payment_failed") {
        const metadata = eventData.metadata as Record<string, string> | undefined;
        const invoiceId = metadata?.invoiceId;
        console.warn(`[STRIPE WEBHOOK] Payment failed for invoice ${invoiceId ?? "unknown"}`);
        // Optionally notify freelancer — for now just log
      }

      res.sendStatus(200);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[STRIPE WEBHOOK] Error processing event:", message);
      res.sendStatus(500);
    }
  },
);

// ──────────────────────────────────────────────────────────────
// Resend Webhook
// ──────────────────────────────────────────────────────────────

const resendRouter = Router();

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id?: string;
    to?: string[];
    from?: string;
    created_at?: string;
    [key: string]: unknown;
  };
}

resendRouter.post("/", express.json(), async (req: Request, res: Response) => {
  const payload = req.body as ResendWebhookPayload;

  if (!payload || !payload.type) {
    res.sendStatus(400);
    return;
  }

  const eventType = payload.type;
  const email = payload.data?.to?.[0] ?? "unknown";

  // Only persist bounce/complaint events
  if (eventType === "email.bounced" || eventType === "email.complained") {
    try {
      // Try to find the most recent invoice for this email
      const recentInvoice = await prisma.invoice.findFirst({
        where: { clientEmail: email },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      await prisma.emailEvent.create({
        data: {
          invoiceId: recentInvoice?.id ?? null,
          type: eventType,
          email,
          payload: JSON.stringify(payload.data),
        },
      });

      console.log(`[RESEND WEBHOOK] Recorded ${eventType} for ${email}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[RESEND WEBHOOK] Failed to persist event: ${message}`);
    }
  } else {
    console.log(`[RESEND WEBHOOK] Ignoring event type: ${eventType}`);
  }

  res.sendStatus(200);
});

export { stripeRouter, resendRouter };
