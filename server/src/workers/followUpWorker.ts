import { Worker, type Job, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";
import { prisma } from "../lib/prisma";
import { sendFollowUpReminderEmail, isResendConfigured } from "../services/email/resendService";
import { FOLLOW_UP_QUEUE_NAME, type FollowUpJobData } from "../queues/followUpQueue";

const loadInvoiceForFollowUp = async (invoiceId: string) =>
  prisma.invoice.findUnique({
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

const processJob = async (job: Job<FollowUpJobData>): Promise<void> => {
  const { invoiceId, ruleId } = job.data;
  console.log(`[FOLLOW-UP WORKER] Processing follow-up for invoice ${invoiceId}, rule ${ruleId}`);

  const invoice = await loadInvoiceForFollowUp(invoiceId);

  if (!invoice) {
    console.error(`[FOLLOW-UP WORKER] Invoice ${invoiceId} not found — skipping`);
    return;
  }

  // If already paid or cancelled, skip
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    console.log(`[FOLLOW-UP WORKER] Invoice ${invoiceId} is ${invoice.status} — skipping follow-up`);
    return;
  }

  // Load the rule to get offsetDays
  const rule = await prisma.followUpRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule) {
    console.error(`[FOLLOW-UP WORKER] Rule ${ruleId} not found — skipping`);
    return;
  }

  // Construct payment URL
  let paymentUrl: string;

  if (invoice.stripeCheckoutSessionId) {
    const clientUrl = process.env.CLIENT_URL ?? "http://localhost:5173";
    paymentUrl = `${clientUrl}/invoices/${invoiceId}?payment=pending`;
  } else {
    const baseUrl = process.env.PUBLIC_INVOICE_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    paymentUrl = `${baseUrl.replace(/\/$/, "")}/invoices/${invoiceId}/view`;
  }

  let resendMessageId: string | null = null;

  // Send follow-up email via Resend
  if (isResendConfigured()) {
    const result = await sendFollowUpReminderEmail({
      invoiceNumber: invoice.number,
      freelancerName: invoice.user.name,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      total: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      offsetDays: rule.offsetDays,
      paymentUrl,
      replyTo: invoice.user.email,
    });

    resendMessageId = result.messageId;
  } else {
    console.warn("[FOLLOW-UP WORKER] Resend not configured — skipping email send");
  }

  // Write FollowUpLog
  await prisma.followUpLog.create({
    data: {
      invoiceId,
      ruleId,
      bullmqJobId: job.id ?? `followup-${invoiceId}-${ruleId}`,
      resendMessageId,
    },
  });

  console.log(`[FOLLOW-UP WORKER] Follow-up sent for invoice ${invoiceId} (offsetDays=${rule.offsetDays})`);
};

export const createFollowUpWorker = (): Worker<FollowUpJobData> => {
  const worker = new Worker<FollowUpJobData>(
    FOLLOW_UP_QUEUE_NAME,
    processJob,
    {
      connection: getRedisConnection() as unknown as ConnectionOptions,
      concurrency: 3,
    },
  );

  worker.on("completed", (job: Job<FollowUpJobData>) => {
    console.log(`[FOLLOW-UP WORKER] Job ${job.id ?? "unknown"} completed`);
  });

  worker.on("failed", (job: Job<FollowUpJobData> | undefined, error: Error) => {
    console.error(`[FOLLOW-UP WORKER] Job ${job?.id ?? "unknown"} failed:`, error.message);
  });

  return worker;
};
