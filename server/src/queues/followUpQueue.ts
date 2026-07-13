import { Queue, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";

const QUEUE_NAME = "follow-up";

interface FollowUpJobData {
  invoiceId: string;
  ruleId: string;
}

let queue: Queue<FollowUpJobData> | null = null;

const getQueue = (): Queue<FollowUpJobData> => {
  if (!queue) {
    queue = new Queue<FollowUpJobData>(QUEUE_NAME, {
      connection: getRedisConnection() as unknown as ConnectionOptions,
    });
  }

  return queue;
};

/**
 * Enqueue a follow-up reminder with a deterministic jobId per invoice+rule.
 */
export const enqueueFollowUp = async (
  invoiceId: string,
  ruleId: string,
  delayMs: number,
): Promise<string> => {
  const jobId = `followup-${invoiceId}-${ruleId}`;
  const q = getQueue();

  // Remove existing job if present (for rescheduling)
  const existing = await q.getJob(jobId);

  if (existing) {
    await existing.remove();
  }

  const job = await q.add(
    "followup",
    { invoiceId, ruleId },
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
 * Remove all follow-up jobs for a given invoice (e.g. when invoice is paid or cancelled).
 */
export const removeFollowUpsForInvoice = async (
  invoiceId: string,
  ruleIds: string[],
): Promise<number> => {
  const q = getQueue();
  let removed = 0;

  for (const ruleId of ruleIds) {
    const jobId = `followup-${invoiceId}-${ruleId}`;
    const job = await q.getJob(jobId);

    if (job) {
      try {
        await job.remove();
        removed++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[FOLLOW-UP QUEUE] Could not remove job ${jobId}: ${message}`);
      }
    }
  }

  return removed;
};

export { QUEUE_NAME as FOLLOW_UP_QUEUE_NAME };
export type { FollowUpJobData };
