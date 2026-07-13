import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { enqueueSendInvoice, removeSendInvoiceJob } from "../queues/sendInvoiceQueue";
import { isRedisConfigured } from "../config/redis";

const scheduleSchema = z.object({
  scheduledSendAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date string")
    .transform((val) => new Date(val)),
});

const getRouteId = (req: Request): string => {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0];
  }

  if (!id) {
    throw new HttpError(400, "Invoice id is required");
  }

  return id;
};

/**
 * PATCH /invoices/:id/schedule
 * Schedule an invoice for future sending.
 */
export const scheduleInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);

    if (!isRedisConfigured()) {
      throw new HttpError(503, "Scheduling is not available — Redis is not configured.");
    }

    const { scheduledSendAt } = scheduleSchema.parse(req.body);

    if (scheduledSendAt.getTime() <= Date.now()) {
      throw new HttpError(400, "Scheduled time must be in the future.");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    if (invoice.status !== "DRAFT" && invoice.status !== "SCHEDULED") {
      throw new HttpError(400, `Cannot schedule an invoice with status ${invoice.status}`);
    }

    const delayMs = scheduledSendAt.getTime() - Date.now();

    await enqueueSendInvoice(id, delayMs);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "SCHEDULED",
        scheduledSendAt,
      },
      include: { lineItems: true },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, error.issues[0]?.message ?? "Validation failed"));
    } else {
      next(error);
    }
  }
};

/**
 * DELETE /invoices/:id/schedule
 * Cancel a scheduled send and revert to DRAFT.
 */
export const cancelSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    if (invoice.status !== "SCHEDULED") {
      throw new HttpError(400, "Invoice is not scheduled");
    }

    if (isRedisConfigured()) {
      await removeSendInvoiceJob(id);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "DRAFT",
        scheduledSendAt: null,
      },
      include: { lineItems: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
