import { prisma } from "../lib/prisma";
import { enqueueFollowUp, removeFollowUpsForInvoice } from "../queues/followUpQueue";

interface FollowUpRuleData {
  offsetDays: number;
  enabled: boolean;
}

interface FollowUpRuleResult {
  id: string;
  invoiceId: string | null;
  userId: string;
  offsetDays: number;
  enabled: boolean;
  createdAt: Date;
}

const DEFAULT_OFFSETS = [3, 7, 14];

/**
 * Seed default follow-up rules for a user if they have none.
 * Called on first invoice send.
 */
export const seedDefaultRulesIfNeeded = async (userId: string): Promise<FollowUpRuleResult[]> => {
  const existingCount = await prisma.followUpRule.count({
    where: { userId, invoiceId: null },
  });

  if (existingCount > 0) {
    return prisma.followUpRule.findMany({
      where: { userId, invoiceId: null },
      orderBy: { offsetDays: "asc" },
    });
  }

  const rules = await prisma.$transaction(
    DEFAULT_OFFSETS.map((offsetDays) =>
      prisma.followUpRule.create({
        data: {
          userId,
          invoiceId: null,
          offsetDays,
          enabled: true,
        },
      }),
    ),
  );

  console.log(`[FOLLOW-UP] Seeded ${rules.length} default rules for user ${userId}`);
  return rules;
};

/**
 * Get follow-up rules for a specific invoice.
 * Falls back to user-level defaults if no invoice-level overrides exist.
 */
export const getApplicableRules = async (
  userId: string,
  invoiceId: string,
): Promise<FollowUpRuleResult[]> => {
  // Check for invoice-level overrides first
  const invoiceRules = await prisma.followUpRule.findMany({
    where: { invoiceId, userId },
    orderBy: { offsetDays: "asc" },
  });

  if (invoiceRules.length > 0) {
    return invoiceRules;
  }

  // Fall back to user-level defaults
  return prisma.followUpRule.findMany({
    where: { userId, invoiceId: null },
    orderBy: { offsetDays: "asc" },
  });
};

/**
 * Get user-level default rules.
 */
export const getUserDefaultRules = async (userId: string): Promise<FollowUpRuleResult[]> => {
  return prisma.followUpRule.findMany({
    where: { userId, invoiceId: null },
    orderBy: { offsetDays: "asc" },
  });
};

/**
 * Get invoice-level rule overrides.
 */
export const getInvoiceRules = async (
  userId: string,
  invoiceId: string,
): Promise<FollowUpRuleResult[]> => {
  return prisma.followUpRule.findMany({
    where: { invoiceId, userId },
    orderBy: { offsetDays: "asc" },
  });
};

/**
 * Replace user-level default rules entirely.
 */
export const replaceUserDefaultRules = async (
  userId: string,
  rules: FollowUpRuleData[],
): Promise<FollowUpRuleResult[]> => {
  // Delete existing user-level defaults
  await prisma.followUpRule.deleteMany({
    where: { userId, invoiceId: null },
  });

  // Create new rules
  const created = await prisma.$transaction(
    rules.map((rule) =>
      prisma.followUpRule.create({
        data: {
          userId,
          invoiceId: null,
          offsetDays: rule.offsetDays,
          enabled: rule.enabled,
        },
      }),
    ),
  );

  return created;
};

/**
 * Replace invoice-level rule overrides.
 */
export const replaceInvoiceRules = async (
  userId: string,
  invoiceId: string,
  rules: FollowUpRuleData[],
): Promise<FollowUpRuleResult[]> => {
  // Delete existing invoice-level rules
  await prisma.followUpRule.deleteMany({
    where: { invoiceId, userId },
  });

  // Create new rules
  const created = await prisma.$transaction(
    rules.map((rule) =>
      prisma.followUpRule.create({
        data: {
          userId,
          invoiceId,
          offsetDays: rule.offsetDays,
          enabled: rule.enabled,
        },
      }),
    ),
  );

  return created;
};

/**
 * Schedule follow-up jobs for an invoice based on applicable rules.
 * Skips any that are already in the past.
 */
export const scheduleFollowUps = async (
  invoiceId: string,
  userId: string,
  dueDate: Date,
): Promise<number> => {
  const rules = await getApplicableRules(userId, invoiceId);
  const enabledRules = rules.filter((r) => r.enabled);
  let scheduled = 0;

  for (const rule of enabledRules) {
    const sendAt = new Date(dueDate.getTime() + rule.offsetDays * 24 * 60 * 60 * 1000);
    const delayMs = sendAt.getTime() - Date.now();

    if (delayMs <= 0) {
      console.log(`[FOLLOW-UP] Skipping rule ${rule.id} (offsetDays=${rule.offsetDays}): send date already past`);
      continue;
    }

    await enqueueFollowUp(invoiceId, rule.id, delayMs);
    scheduled++;
  }

  console.log(`[FOLLOW-UP] Scheduled ${scheduled}/${enabledRules.length} follow-ups for invoice ${invoiceId}`);
  return scheduled;
};

/**
 * Cancel all follow-up jobs for an invoice (e.g. on payment or cancellation).
 */
export const cancelAllFollowUps = async (
  invoiceId: string,
  userId: string,
): Promise<number> => {
  const rules = await getApplicableRules(userId, invoiceId);
  const ruleIds = rules.map((r) => r.id);

  if (ruleIds.length === 0) {
    return 0;
  }

  const removed = await removeFollowUpsForInvoice(invoiceId, ruleIds);
  console.log(`[FOLLOW-UP] Removed ${removed} pending follow-up jobs for invoice ${invoiceId}`);
  return removed;
};

export type { FollowUpRuleData, FollowUpRuleResult };
