import { loadEnv } from "./env";

loadEnv();

const localJwtSecrets = {
  JWT_REFRESH_SECRET: "invoiceflow-local-refresh-secret",
  JWT_SECRET: "invoiceflow-local-access-secret",
} as const;

export const getJwtSecret = (name: keyof typeof localJwtSecrets) => {
  const configuredSecret = process.env[name];

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return localJwtSecrets[name];
  }

  throw new Error(`${name} is required.`);
};
