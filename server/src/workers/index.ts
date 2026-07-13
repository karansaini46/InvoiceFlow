import { isRedisConfigured } from "../config/redis";
import { createSendInvoiceWorker } from "./sendInvoiceWorker";
import { createFollowUpWorker } from "./followUpWorker";
import { createOverdueCheckWorker } from "./overdueCheckWorker";
import { registerOverdueCheckJob } from "../queues/overdueCheckQueue";

/**
 * Register and start all BullMQ workers.
 * Gracefully degrades if Redis is not configured.
 */
export const startWorkers = async (): Promise<void> => {
  if (!isRedisConfigured()) {
    console.warn(
      "[WORKERS] REDIS_URL is not set — BullMQ workers will not start. " +
      "Set REDIS_URL in .env to enable scheduled sending, follow-ups, and overdue checks.",
    );
    return;
  }

  try {
    createSendInvoiceWorker();
    console.log("[WORKERS] Send invoice worker started");

    createFollowUpWorker();
    console.log("[WORKERS] Follow-up worker started");

    createOverdueCheckWorker();
    console.log("[WORKERS] Overdue check worker started");

    // Register the daily overdue check cron job
    await registerOverdueCheckJob();

    console.log("[WORKERS] All workers registered and running");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[WORKERS] Failed to start workers:", message);
  }
};
