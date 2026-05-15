import Bottleneck from "bottleneck";
import { z } from "zod";

import { getLlamaClient, LLAMA_MODEL } from "../lib/llama";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

const invoiceAnalysisSchema = z.object({
  risk_level: z.enum(["low", "medium", "high"]),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  summary: z.string(),
});

const cashFlowInsightSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()).length(3),
  predicted_revenue_30d: z.number().finite().nonnegative(),
});

const paymentReminderSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type InvoiceAnalysis = z.infer<typeof invoiceAnalysisSchema>;
export type CashFlowInsight = z.infer<typeof cashFlowInsightSchema>;
export type PaymentReminder = z.infer<typeof paymentReminderSchema>;

type AiFeature = "invoice_analysis" | "cash_flow_insights" | "payment_reminder";

const aiLimiter = new Bottleneck({
  maxConcurrent: Number(process.env.AI_MAX_CONCURRENT_REQUESTS) || 4,
});

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const daysBetween = (later: Date, earlier: Date) =>
  Math.max(0, Math.ceil((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / 86_400_000));

const parseModelJson = (raw: string) => {
  const clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(clean) as unknown;
};

const writeUsageLog = async (data: {
  userId: string;
  invoiceId?: string;
  feature: AiFeature;
  success: boolean;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) => {
  try {
    await prisma.aiUsageLog.create({
      data: {
        ...data,
        model: LLAMA_MODEL,
      },
    });
  } catch (error) {
    console.error("[AI USAGE LOG ERROR]", error);
  }
};

const createStructuredCompletion = async <TSchema extends z.ZodTypeAny>(data: {
  feature: AiFeature;
  userId: string;
  invoiceId?: string;
  prompt: string;
  schema: TSchema;
  maxTokens: number;
  temperature: number;
}): Promise<z.infer<TSchema>> => {
  const startedAt = Date.now();

  try {
    const response = await aiLimiter.schedule(() =>
      getLlamaClient().chat.completions.create({
        model: LLAMA_MODEL,
        messages: [{ role: "user", content: data.prompt }],
        max_tokens: data.maxTokens,
        temperature: data.temperature,
      }),
    );

    const raw = response.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("AI response did not contain content.");
    }

    const parsed = data.schema.parse(parseModelJson(raw));

    await writeUsageLog({
      userId: data.userId,
      invoiceId: data.invoiceId,
      feature: data.feature,
      success: true,
      latencyMs: Date.now() - startedAt,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
    });

    return parsed;
  } catch (error) {
    await writeUsageLog({
      userId: data.userId,
      invoiceId: data.invoiceId,
      feature: data.feature,
      success: false,
      latencyMs: Date.now() - startedAt,
    });

    throw error;
  }
};

const isPaidOnTime = (invoice: {
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  updatedAt: Date;
}) => {
  if (invoice.status !== "PAID") {
    return false;
  }

  const paidDate = invoice.paidAt ?? invoice.updatedAt;
  return paidDate <= invoice.dueDate;
};

const getInvoiceWithHistory = async (userId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      lineItems: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!invoice) {
    throw new HttpError(404, "Invoice not found.");
  }

  const clientInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      clientEmail: invoice.clientEmail,
      id: { not: invoice.id },
    },
    select: {
      id: true,
      dueDate: true,
      paidAt: true,
      status: true,
      total: true,
      updatedAt: true,
    },
    orderBy: { dueDate: "desc" },
    take: 12,
  });

  return { invoice, clientInvoices };
};

export const analyzeInvoiceForUser = async (userId: string, invoiceId: string) => {
  const { invoice, clientInvoices } = await getInvoiceWithHistory(userId, invoiceId);
  const now = new Date();
  const clientPaymentHistory = clientInvoices.map((item) => ({
    invoiceId: item.id,
    paidOnTime: isPaidOnTime(item),
    status: item.status,
  }));
  const overdueInvoices = clientInvoices.filter(
    (item) => item.status === "OVERDUE" || (item.status !== "PAID" && item.dueDate < now),
  ).length;

  const prompt = `You are an expert invoice risk analyst. Analyze the following invoice and respond ONLY with a valid JSON object matching this exact schema:
{
  "risk_level": "low" | "medium" | "high",
  "issues": string[],
  "suggestions": string[],
  "summary": string
}

Invoice data:
${JSON.stringify(
  {
    amount: invoice.total,
    clientName: invoice.clientName,
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    dueDate: invoice.dueDate.toISOString(),
    clientPaymentHistory,
    overdueInvoices,
  },
  null,
  2,
)}

Rules:
- Use "high" risk if the client has more than 2 late payments or overdue invoices, or if the amount is over $10,000 with no history.
- Detect missing fields, suspicious amounts, repeated line-item descriptions, and duplicate-looking line items.
- Keep the summary under 2 sentences.
- Return only JSON.`;

  return createStructuredCompletion({
    userId,
    invoiceId,
    feature: "invoice_analysis",
    prompt,
    schema: invoiceAnalysisSchema,
    maxTokens: 512,
    temperature: 0.1,
  });
};

export const generateCashFlowInsightsForUser = async (userId: string) => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const [paidInvoices, billedInvoices, pendingInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId,
        status: "PAID",
        OR: [
          { paidAt: { gte: ninetyDaysAgo } },
          { paidAt: null, updatedAt: { gte: ninetyDaysAgo } },
        ],
      },
      select: {
        clientName: true,
        dueDate: true,
        paidAt: true,
        total: true,
        updatedAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        issueDate: { gte: ninetyDaysAgo },
      },
      select: {
        clientName: true,
        dueDate: true,
        paidAt: true,
        status: true,
        total: true,
        updatedAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ["SENT", "OVERDUE"] },
      },
      select: {
        dueDate: true,
        status: true,
        total: true,
      },
    }),
  ]);

  const totalReceived90d = paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPending = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const overdueCount = pendingInvoices.filter(
    (invoice) => invoice.status === "OVERDUE" || invoice.dueDate < now,
  ).length;
  const paymentDelays = paidInvoices.map((invoice) =>
    daysBetween(invoice.paidAt ?? invoice.updatedAt, invoice.dueDate),
  );
  const avgPaymentDelay =
    paymentDelays.length === 0
      ? 0
      : Math.round(paymentDelays.reduce((sum, delay) => sum + delay, 0) / paymentDelays.length);

  const clients = new Map<
    string,
    {
      name: string;
      totalBilled: number;
      paidOnTime: boolean;
    }
  >();

  billedInvoices.forEach((invoice) => {
    const current = clients.get(invoice.clientName) ?? {
      name: invoice.clientName,
      totalBilled: 0,
      paidOnTime: true,
    };

    current.totalBilled += invoice.total;
    current.paidOnTime &&= invoice.status !== "PAID" || isPaidOnTime(invoice);
    clients.set(invoice.clientName, current);
  });

  const topClients = [...clients.values()]
    .sort((left, right) => right.totalBilled - left.totalBilled)
    .slice(0, 3);
  const pendingDueSoon = pendingInvoices
    .filter((invoice) => invoice.status === "SENT" && invoice.dueDate >= now && invoice.dueDate <= thirtyDaysFromNow)
    .map((invoice) => ({
      amount: invoice.total,
      dueDate: invoice.dueDate.toISOString(),
    }));
  const predictedRevenue30d = Math.round(
    pendingDueSoon.reduce((sum, invoice) => sum + invoice.amount, 0),
  );

  const prompt = `You are a financial advisor for small businesses. Analyze this cash-flow data and respond ONLY with valid JSON:
{
  "summary": string,
  "insights": string[],
  "predicted_revenue_30d": number
}

Data:
${JSON.stringify(
  {
    totalReceived90d,
    totalPending,
    overdueCount,
    avgPaymentDelay,
    topClients,
    pendingInvoices: pendingDueSoon,
    predictedRevenue30d,
  },
  null,
  2,
)}

Rules:
- The summary should be 3 to 4 concise sentences in a conversational tone.
- Return exactly 3 actionable insights.
- predicted_revenue_30d must exactly equal ${predictedRevenue30d}; this figure is precomputed from pending invoices due in the next 30 days.
- Return only JSON.`;

  const insight = await createStructuredCompletion({
    userId,
    feature: "cash_flow_insights",
    prompt,
    schema: cashFlowInsightSchema,
    maxTokens: 600,
    temperature: 0.3,
  });

  return {
    ...insight,
    predicted_revenue_30d: predictedRevenue30d,
  };
};

export const generatePaymentReminderForUser = async (userId: string, invoiceId: string) => {
  const { invoice, clientInvoices } = await getInvoiceWithHistory(userId, invoiceId);
  const today = new Date();
  const isOverdue = invoice.status === "OVERDUE" || (invoice.status !== "PAID" && invoice.dueDate < today);

  if (!isOverdue) {
    throw new HttpError(400, "Payment reminders are only available for overdue invoices.");
  }

  const [user, previousReminders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        name: true,
      },
    }),
    prisma.aiUsageLog.count({
      where: {
        invoiceId,
        feature: "payment_reminder",
        success: true,
      },
    }),
  ]);

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  const paymentHistory = clientInvoices.map((item) => ({
    status: item.status,
    paidOnTime: isPaidOnTime(item),
  }));
  const daysOverdue = daysBetween(today, invoice.dueDate);
  const tone =
    previousReminders === 0
      ? "friendly and polite"
      : previousReminders === 1
        ? "firm but professional"
        : "direct and urgent";

  const prompt = `Write a ${tone} payment reminder email for an overdue invoice.
Respond ONLY with valid JSON:
{
  "subject": string,
  "body": string
}

Details:
${JSON.stringify(
  {
    clientName: invoice.clientName,
    invoiceNumber: invoice.number,
    amount: invoice.total,
    currency: invoice.currency,
    daysOverdue,
    businessName: user.businessName ?? user.name,
    previousReminders,
    previousPaymentHistory: paymentHistory,
  },
  null,
  2,
)}

Rules:
- Stay under 150 words.
- Include the invoice number and amount.
- Include a clear call to action.
- Do not sound aggressive, threatening, or robotic.
- Return only JSON.`;

  return createStructuredCompletion({
    userId,
    invoiceId,
    feature: "payment_reminder",
    prompt,
    schema: paymentReminderSchema,
    maxTokens: 400,
    temperature: 0.5,
  });
};
