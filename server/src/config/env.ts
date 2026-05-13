import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

// Only load server-specific .env for separate deployments
dotenv.config({
  path: path.resolve(__dirname, "../../.env"), // server/.env
  override: false,
  quiet: true,
});

let isLoaded = false;

const unique = (paths: string[]) => Array.from(new Set(paths));

export const getWorkspaceRoot = () => {
  const candidates = unique([
    path.resolve(process.cwd()),
    path.resolve(process.cwd(), ".."),
    path.resolve(__dirname, "../../.."),
  ]);

  return (
    candidates.find(
      (candidate) =>
        existsSync(path.join(candidate, "pnpm-workspace.yaml")) &&
        existsSync(path.join(candidate, "package.json")),
    ) ?? process.cwd()
  );
};

export const loadEnv = () => {
  if (isLoaded) {
    return;
  }

  isLoaded = true;

  // Only look for .env in server directory for separate deployments
  const serverEnvPaths = unique([
    path.resolve(__dirname, "../../.env"), // server/.env from src/config/
    path.resolve(process.cwd(), ".env"),    // server/.env from server root
  ]);

  for (const envPath of serverEnvPaths) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false, quiet: true });
    }
  }
};

loadEnv();
