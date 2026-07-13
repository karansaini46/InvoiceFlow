import { Queue, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";

const QUEUE_NAME = "send-invoice";

interface SendInvoiceJobData {
  invoiceId: string;
}

let queue: Queue<SendInvoiceJobData> | null = null;

const getQueue = (): Queue<SendInvoiceJobData> => {
  if (!queue) {
    queue = new Queue<SendInvoiceJobData>(QUEUE_NAME, {
      connection: getRedisConnection() as unknown as ConnectionOptions,
    });
  }

  return queue;
};

/**
 * Enqueue (or reschedule) a send-invoice job with a deterministic jobId
 * so it can be removed/rescheduled if the user changes the scheduled time.
 */
export const enqueueSendInvoice = async (
  invoiceId: string,
  delayMs: number,
): Promise<string> => {
  const jobId = `send-${invoiceId}`;
  const q = getQueue();

  // Remove existing job if present (for rescheduling)
  const existing = await q.getJob(jobId);

  if (existing) {
    await existing.remove();
  }

  const job = await q.add(
    "send",
    { invoiceId },
    {
      jobId,
      delay: delayMs,
      removeOnComplete: true,
      removeOnFail: { count: 5 },
    },
  );

  return job.id ?? jobId;
};

/**
 * Remove a pending send-invoice job (e.g. when cancelling a scheduled send).
 */
export const removeSendInvoiceJob = async (invoiceId: string): Promise<boolean> => {
  const jobId = `send-${invoiceId}`;
  const q = getQueue();
  const job = await q.getJob(jobId);

  if (job) {
    await job.remove();
    return true;
  }

  return false;
};

export { QUEUE_NAME as SEND_INVOICE_QUEUE_NAME };
export type { SendInvoiceJobData };
