import path from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { getWorkspaceRoot, loadEnv } from "../config/env";

loadEnv();

const resolveDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

  if (!databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const sqlitePath = databaseUrl.slice("file:".length);

  if (sqlitePath === ":memory:" || path.isAbsolute(sqlitePath)) {
    return databaseUrl;
  }

  return `file:${path.join(getWorkspaceRoot(), sqlitePath)}`;
};

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(),
});

export const prisma = new PrismaClient({
  adapter,
});
