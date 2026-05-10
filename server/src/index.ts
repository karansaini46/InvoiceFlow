import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { healthRouter } from "./routes/health";
import { invoiceRouter } from "./routes/invoiceRouter";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/health", healthRouter);
app.use("/invoices", invoiceRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
