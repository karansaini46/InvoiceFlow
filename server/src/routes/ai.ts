import { Router } from "express";
import { z } from "zod";

import { authMiddleware } from "../middleware/authMiddleware";
import { aiRateLimiter } from "../middleware/aiRateLimit";
import {
  analyzeInvoiceForUser,
  generateCashFlowInsightsForUser,
  generatePaymentReminderForUser,
} from "../services/aiService";
import { HttpError } from "../utils/httpError";

const invoiceRequestSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice id is required."),
});

const router = Router();

router.use(authMiddleware, aiRateLimiter);

router.post("/analyze-invoice", async (request, response, next) => {
  try {
    const { invoiceId } = invoiceRequestSchema.parse(request.body);
    const result = await analyzeInvoiceForUser(request.user!.id, invoiceId);
    response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof HttpError || error instanceof z.ZodError) {
      next(error);
      return;
    }

    console.error("[AI] analyze-invoice error:", error);
    next(new HttpError(502, "AI analysis failed."));
  }
});

router.post("/cash-flow-insights", async (request, response, next) => {
  try {
    const result = await generateCashFlowInsightsForUser(request.user!.id);
    response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    console.error("[AI] cash-flow-insights error:", error);
    next(new HttpError(502, "AI insights failed."));
  }
});

router.post("/payment-reminder", async (request, response, next) => {
  try {
    const { invoiceId } = invoiceRequestSchema.parse(request.body);
    const result = await generatePaymentReminderForUser(request.user!.id, invoiceId);
    response.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof HttpError || error instanceof z.ZodError) {
      next(error);
      return;
    }

    console.error("[AI] payment-reminder error:", error);
    next(new HttpError(502, "Reminder generation failed."));
  }
});

export { router as aiRouter };
