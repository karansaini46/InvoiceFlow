import type { CorsOptions } from "cors";

import { loadEnv } from "./env";

loadEnv();

const defaultAllowedOrigins = ["https://invoice-flow-client.vercel.app"];

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");

const getEnvOrigins = () =>
  [process.env.CLIENT_URL, process.env.CLIENT_URLS, process.env.ALLOWED_ORIGINS]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...getEnvOrigins()]);

const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const vercelPreviewOriginPattern =
  /^https:\/\/invoice-flow-client(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    allowedOrigins.has(normalizedOrigin) ||
    localhostOriginPattern.test(normalizedOrigin) ||
    vercelPreviewOriginPattern.test(normalizedOrigin)
  );
};

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    console.warn(`[CORS BLOCKED] ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
};
