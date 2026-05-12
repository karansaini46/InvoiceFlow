import "dotenv/config";
import { defineConfig } from "prisma/config";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export default defineConfig({
  schema: "server/prisma/schema.prisma",
  migrations: {
    path: "server/prisma/migrations",
    seed: "tsx server/prisma/seed.ts",
  },
  datasource: {
    url: connectionString,
  },
});
