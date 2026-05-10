import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
