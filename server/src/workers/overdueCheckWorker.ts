import { Worker, type Job, type ConnectionOptions } from "bullmq";

import { getRedisConnection } from "../config/redis";
import { prisma } from "../lib/prisma";
import { OVERDUE_CHECK_QUEUE_NAME, type OverdueCheckJobData } from "../queues/overdueCheckQueue";

const processJob = async (job: Job<OverdueCheckJobData>): Promise<void> => {
  console.log(`[OVERDUE CHECK WORKER] Running overdue check (triggered: ${job.data.triggeredAt})`);

  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ["SENT", "VIEWED"] },
      dueDate: { lt: now },
    },
    data: {
      status: "OVERDUE",
    },
  });

  console.log(`[OVERDUE CHECK WORKER] Marked ${result.count} invoice(s) as OVERDUE`);
};

export const createOverdueCheckWorker = (): Worker<OverdueCheckJobData> => {
  const worker = new Worker<OverdueCheckJobData>(
    OVERDUE_CHECK_QUEUE_NAME,
    processJob,
    {
      connection: getRedisConnection() as unknown as ConnectionOptions,
      concurrency: 1,
    },
  );

  worker.on("completed", (job: Job<OverdueCheckJobData>) => {
    console.log(`[OVERDUE CHECK WORKER] Job ${job.id ?? "unknown"} completed`);
  });

  worker.on("failed", (job: Job<OverdueCheckJobData> | undefined, error: Error) => {
    console.error(`[OVERDUE CHECK WORKER] Job ${job?.id ?? "unknown"} failed:`, error.message);
  });

  return worker;
};
