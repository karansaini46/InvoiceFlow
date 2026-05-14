import { beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

// Import routes and middleware
import "./src/config/env";
import { errorHandler } from "../src/middleware/errorHandler";
import { authRouter } from "../src/routes/auth";
import { dashboardRouter } from "../src/routes/dashboard";
import { healthRouter } from "../src/routes/health";
import { invoiceRouter } from "../src/routes/invoiceRouter";
import { paymentRouter } from "../src/routes/payment";
import { proposalRouter } from "../src/routes/proposalRouter";
import { settingsRouter } from "../src/routes/settings";

// Create test app
const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith("http://localhost") ||
        origin === process.env.CLIENT_URL
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/health", healthRouter);
app.use("/invoices", invoiceRouter);
app.use("/payment", paymentRouter);
app.use("/proposals", proposalRouter);
app.use("/settings", settingsRouter);

app.use(errorHandler);

// Use the same Prisma client setup as the main application
import { prisma as mainPrisma } from '../src/lib/prisma';

const prisma = mainPrisma;

// Test user data
export const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'testpassword123'
};

let testUserIdInternal: string;
let testAccessTokenInternal: string;

beforeAll(async () => {
  await prisma.lineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.user.deleteMany();

  // Create the shared test user used by auth and invoice route tests.
  const passwordHash = await bcrypt.hash(testUser.password, 12);
  const user = await prisma.user.create({
    data: {
      email: testUser.email,
      name: testUser.name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
    }
  });

  testUserIdInternal = user.id;

  // Generate JWT for test user
  testAccessTokenInternal = jwt.sign(
    {
      id: user.id,
      email: user.email,
      plan: user.plan.toLowerCase(),
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '15m' }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma, testUserIdInternal as testUserId, testAccessTokenInternal as testAccessToken };
export { app as testApp };
