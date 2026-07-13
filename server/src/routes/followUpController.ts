import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import {
  getUserDefaultRules,
  replaceUserDefaultRules,
  getInvoiceRules,
  replaceInvoiceRules,
  cancelAllFollowUps,
} from "../services/followUpService";
import { isRedisConfigured } from "../config/redis";

const followUpRuleSchema = z.object({
  offsetDays: z.number().int().positive("offsetDays must be a positive integer"),
  enabled: z.boolean(),
});

const followUpRulesBodySchema = z.object({
  rules: z.array(followUpRuleSchema).min(0),
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
 * GET /settings/follow-up-defaults
 */
export const getFollowUpDefaults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const rules = await getUserDefaultRules(userId);

    res.json({ rules });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /settings/follow-up-defaults
 */
export const updateFollowUpDefaults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { rules } = followUpRulesBodySchema.parse(req.body);

    const updated = await replaceUserDefaultRules(userId, rules);

    res.json({ rules: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, error.issues[0]?.message ?? "Validation failed"));
    } else {
      next(error);
    }
  }
};

/**
 * GET /invoices/:id/follow-up-rules
 */
export const getInvoiceFollowUpRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const invoiceId = getRouteId(req);

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    const rules = await getInvoiceRules(userId, invoiceId);

    // If no invoice-level rules, return user defaults with a flag
    if (rules.length === 0) {
      const defaults = await getUserDefaultRules(userId);
      res.json({ rules: defaults, isDefault: true });
      return;
    }

    res.json({ rules, isDefault: false });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /invoices/:id/follow-up-rules
 */
export const updateInvoiceFollowUpRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const invoiceId = getRouteId(req);
    const { rules } = followUpRulesBodySchema.parse(req.body);

    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    const updated = await replaceInvoiceRules(userId, invoiceId, rules);

    res.json({ rules: updated, isDefault: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, error.issues[0]?.message ?? "Validation failed"));
    } else {
      next(error);
    }
  }
};

/**
 * POST /invoices/:id/cancel-follow-ups
 * Cancel all remaining follow-ups for an invoice.
 */
export const cancelInvoiceFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const invoiceId = getRouteId(req);

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    let removed = 0;

    if (isRedisConfigured()) {
      removed = await cancelAllFollowUps(invoiceId, userId);
    }

    res.json({ removed });
  } catch (error) {
    next(error);
  }
};
