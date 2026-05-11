import { loadEnv } from "./env";

loadEnv();

const requiredJwtSecretNames = ["JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

type JwtSecretName = (typeof requiredJwtSecretNames)[number];

const getRequiredJwtSecret = (name: JwtSecretName) => {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is not set. Refusing to start.`);
  }

  return secret;
};

const jwtSecrets: Record<JwtSecretName, string> = {
  JWT_SECRET: getRequiredJwtSecret("JWT_SECRET"),
  JWT_REFRESH_SECRET: getRequiredJwtSecret("JWT_REFRESH_SECRET"),
};

export const getJwtSecret = (name: JwtSecretName) => {
  return jwtSecrets[name];
};
