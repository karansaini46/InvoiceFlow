import { Worker, type Job, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";
import { prisma } from "../lib/prisma";
import { generateInvoicePDF, getInvoicePdfFilename } from "../services/pdfService";
import { createCheckoutSession, isStripeConfigured } from "../services/stripeService";
import { sendInvoiceEmailViaResend, isResendConfigured } from "../services/email/resendService";
import { seedDefaultRulesIfNeeded, scheduleFollowUps } from "../services/followUpService";
import { SEND_INVOICE_QUEUE_NAME, type SendInvoiceJobData } from "../queues/sendInvoiceQueue";

const loadInvoiceForSend = async (invoiceId: string) =>
  prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: { orderBy: { id: "asc" } },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          businessName: true,
        },
      },
    },
  });

type InvoiceForSend = NonNullable<Awaited<ReturnType<typeof loadInvoiceForSend>>>;

const processJob = async (job: Job<SendInvoiceJobData>): Promise<void> => {
  const { invoiceId } = job.data;
  console.log(`[SEND INVOICE WORKER] Processing invoice ${invoiceId}`);

  const invoice = await loadInvoiceForSend(invoiceId);

  if (!invoice) {
    console.error(`[SEND INVOICE WORKER] Invoice ${invoiceId} not found — skipping`);
    return;
  }

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    console.log(`[SEND INVOICE WORKER] Invoice ${invoiceId} is ${invoice.status} — skipping`);
    return;
  }

  // 1. Generate PDF
  const [pdfBuffer, pdfFilename] = await Promise.all([
    generateInvoicePDF(invoiceId, invoice.userId),
    getInvoicePdfFilename(invoiceId, invoice.userId),
  ]);

  // 2. Create Stripe Checkout Session (if not already created)
  let paymentUrl = "";

  if (!invoice.stripeCheckoutSessionId && isStripeConfigured()) {
    const session = await createCheckoutSession({
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      clientEmail: invoice.clientEmail,
      amountCents: Math.round(invoice.total * 100),
      currency: invoice.currency,
      freelancerName: invoice.user.name,
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { stripeCheckoutSessionId: session.sessionId },
    });

    paymentUrl = session.url;
  } else if (invoice.stripeCheckoutSessionId) {
    // If session already exists, reconstruct the URL
    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
    paymentUrl = `${clientUrl}/invoices/${invoiceId}?payment=pending`;
  } else {
    // Stripe not configured — use invoice view URL as fallback
    const baseUrl = process.env.PUBLIC_INVOICE_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    paymentUrl = `${baseUrl.replace(/\/$/, "")}/invoices/${invoiceId}/view`;
  }

  // 3. Send email via Resend
  if (isResendConfigured()) {
    await sendInvoiceEmailViaResend({
      invoiceNumber: invoice.number,
      freelancerName: invoice.user.name,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      total: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      paymentUrl,
      pdfBuffer,
      pdfFilename,
      replyTo: invoice.user.email,
    });
  } else {
    console.warn("[SEND INVOICE WORKER] Resend not configured — skipping email send");
  }

  // 4. Update invoice status
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  // 5. Seed default follow-up rules if needed, then schedule follow-ups
  await seedDefaultRulesIfNeeded(invoice.userId);
  await scheduleFollowUps(invoiceId, invoice.userId, invoice.dueDate);

  console.log(`[SEND INVOICE WORKER] Invoice ${invoiceId} sent successfully`);
};

export const createSendInvoiceWorker = (): Worker<SendInvoiceJobData> => {
  const worker = new Worker<SendInvoiceJobData>(
    SEND_INVOICE_QUEUE_NAME,
    processJob,
    {
      connection: getRedisConnection() as unknown as ConnectionOptions,
      concurrency: 3,
    },
  );

  worker.on("completed", (job: Job<SendInvoiceJobData>) => {
    console.log(`[SEND INVOICE WORKER] Job ${job.id ?? "unknown"} completed`);
  });

  worker.on("failed", (job: Job<SendInvoiceJobData> | undefined, error: Error) => {
    console.error(`[SEND INVOICE WORKER] Job ${job?.id ?? "unknown"} failed:`, error.message);
  });

  return worker;
};
