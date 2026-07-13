import IORedis from "ioredis";

import { loadEnv } from "./env";

loadEnv();

let connection: IORedis | null = null;

/**
 * Returns a shared IORedis connection for BullMQ queues and workers.
 * Lazily initialised on first call. If REDIS_URL is not set, throws.
 */
export const getRedisConnection = (): IORedis => {
  if (connection) {
    return connection;
  }

  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error(
      "REDIS_URL is required for BullMQ queues. Set it in .env or environment variables.",
    );
  }

  connection = new IORedis(url, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });

  connection.on("error", (error: Error) => {
    console.error("[REDIS ERROR]", error.message);
  });

  return connection;
};

/**
 * Check whether Redis is configured (REDIS_URL is set).
 * Workers/queues should check this before attempting to start.
 */
export const isRedisConfigured = (): boolean => {
  return Boolean(process.env.REDIS_URL);
};
