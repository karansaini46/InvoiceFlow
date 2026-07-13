import { Queue, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";

const QUEUE_NAME = "overdue-check";

interface OverdueCheckJobData {
  triggeredAt: string;
}

let queue: Queue<OverdueCheckJobData> | null = null;

const getQueue = (): Queue<OverdueCheckJobData> => {
  if (!queue) {
    queue = new Queue<OverdueCheckJobData>(QUEUE_NAME, {
      connection: getRedisConnection() as unknown as ConnectionOptions,
    });
  }

  return queue;
};

/**
 * Register a daily repeatable job that checks for overdue invoices.
 * Runs once daily at midnight UTC.
 */
export const registerOverdueCheckJob = async (): Promise<void> => {
  const q = getQueue();

  // Remove any stale repeatable jobs before adding
  const existingRepeatables = await q.getRepeatableJobs();

  for (const job of existingRepeatables) {
    await q.removeRepeatableByKey(job.key);
  }

  await q.upsertJobScheduler(
    "daily-overdue-check",
    { pattern: "0 0 * * *" },
    {
      name: "overdue-check",
      data: { triggeredAt: new Date().toISOString() },
    },
  );

  console.log("[OVERDUE CHECK] Daily overdue check job registered (cron: 0 0 * * *)");
};

export { QUEUE_NAME as OVERDUE_CHECK_QUEUE_NAME };
export type { OverdueCheckJobData };
