import { Router } from "express";

import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

type RecentInvoice = {
  id: string;
  number: string;
  clientName: string;
  total: number;
  currency: string;
  status: string;
  createdAt: Date;
};

type PaidInvoiceForChart = {
  issueDate: Date;
  total: number;
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short" });

router.use(authMiddleware);

router.get("/stats", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

      return {
        key: getMonthKey(date),
        month: getMonthLabel(date),
        total: 0,
      };
    });
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalRevenue,
      outstanding,
      overdue,
      draftCount,
      recentInvoices,
      paidInvoicesForChart,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, status: "PAID" },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: "SENT" },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: "OVERDUE" },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: { userId, status: "DRAFT" },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          number: true,
          clientName: true,
          total: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          userId,
          status: "PAID",
          issueDate: { gte: firstMonth },
        },
        select: {
          issueDate: true,
          total: true,
        },
      }),
    ]);

    const monthlyTotals = new Map(
      monthlyBuckets.map((bucket) => [bucket.key, bucket.total]),
    );

    (paidInvoicesForChart as PaidInvoiceForChart[]).forEach((invoice) => {
      const key = getMonthKey(invoice.issueDate);
      const currentTotal = monthlyTotals.get(key) ?? 0;
      monthlyTotals.set(key, currentTotal + invoice.total);
    });

    res.json({
      totalRevenue: totalRevenue._sum.total ?? 0,
      outstanding: outstanding._sum.total ?? 0,
      overdue: overdue._sum.total ?? 0,
      draftCount,
      recentInvoices: (recentInvoices as RecentInvoice[]).map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        client: invoice.clientName,
        amount: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        date: invoice.createdAt,
      })),
      monthlyRevenue: monthlyBuckets.map((bucket) => ({
        month: bucket.month,
        total: monthlyTotals.get(bucket.key) ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRouter };
