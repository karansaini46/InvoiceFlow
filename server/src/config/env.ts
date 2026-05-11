import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: false });

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

  for (const envPath of unique([
    path.resolve(__dirname, "../../.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.join(getWorkspaceRoot(), ".env"),
  ])) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false, quiet: true });
    }
  }
};

loadEnv();
