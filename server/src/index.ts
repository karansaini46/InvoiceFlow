import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import type {} from "./types/express";

import "./config/env";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middleware/errorHandler";
import { aiRouter } from "./routes/ai";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { healthRouter } from "./routes/health";
import { invoiceRouter } from "./routes/invoiceRouter";
import { paymentRouter } from "./routes/payment";
import { proposalRouter } from "./routes/proposalRouter";
import { settingsRouter } from "./routes/settings";
import { stripeRouter, resendRouter } from "./routes/webhooks";
import { startWorkers } from "./workers";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(cors(corsOptions));

// Mount webhooks BEFORE express.json() so Stripe signature verification can access the raw body
app.use("/webhooks/stripe", stripeRouter);
app.use("/webhooks/resend", resendRouter);

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/auth", authRouter);
app.use("/ai", aiRouter);
app.use("/dashboard", dashboardRouter);
app.use("/health", healthRouter);
app.use("/invoices", invoiceRouter);
app.use("/payment", paymentRouter);
app.use("/proposals", proposalRouter);
app.use("/settings", settingsRouter);

app.use(errorHandler);

const server = app.listen(port, (error?: Error) => {
  if (error) {
    throw error;
  }

  console.log(`Server running on port ${port}`);
  
  // Start background workers
  startWorkers();
});

server.ref();
