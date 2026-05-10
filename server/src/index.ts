import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";

dotenv.config({ quiet: true });

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
app.use("/health", healthRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
