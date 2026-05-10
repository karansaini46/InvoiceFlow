import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { generateInvoicePDF, getInvoicePdfFilename } from "../services/pdfService";
import { HttpError } from "../utils/httpError";

// Zod schemas
const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const createInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  issueDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

const updateInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required").optional(),
  clientEmail: z.string().email("Valid email is required").optional(),
  clientAddress: z.string().min(1, "Client address is required").optional(),
  issueDate: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
});

const getRouteId = (req: Request) => {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0];
  }

  if (!id) {
    throw new HttpError(400, "Invoice id is required");
  }

  return id;
};

const getZodMessage = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Validation failed";

// Helper function to generate invoice number
const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { number: "desc" },
  });

  if (!lastInvoice) {
    return "INV-001";
  }

  const lastNumber = parseInt(lastInvoice.number.split("-")[1]);
  const nextNumber = lastNumber + 1;
  return `INV-${nextNumber.toString().padStart(3, "0")}`;
};

// Helper function to calculate invoice totals
const calculateTotals = (
  lineItems: z.infer<typeof lineItemSchema>[],
  taxRate: number
) => {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
};

// GET /invoices - Get all invoices for authenticated user
export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { lineItems: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

// POST /invoices - Create new invoice
export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validatedData = createInvoiceSchema.parse(req.body);

    const invoiceNumber = await generateInvoiceNumber(userId);
    const { subtotal, taxAmount, total } = calculateTotals(
      validatedData.lineItems,
      validatedData.taxRate
    );

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        userId,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientAddress: validatedData.clientAddress,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        currency: validatedData.currency,
        notes: validatedData.notes || "",
        taxRate: validatedData.taxRate,
        subtotal,
        taxAmount,
        total,
        lineItems: {
          create: validatedData.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { lineItems: true },
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
    } else {
      next(error);
    }
  }
};

// GET /invoices/:id - Get single invoice
export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { lineItems: true },
    });

    if (!invoice) {
      throw new HttpError(404, "Invoice not found");
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// GET /invoices/:id/pdf - Download invoice PDF
export const downloadInvoicePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);
    const filename = await getInvoicePdfFilename(id, userId);
    const pdfBuffer = await generateInvoicePDF(id, userId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// PATCH /invoices/:id - Update invoice
export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);
    const validatedData = updateInvoiceSchema.parse(req.body);

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existingInvoice) {
      throw new HttpError(404, "Invoice not found");
    }

    // Calculate new totals if lineItems or taxRate is provided
    let subtotal = existingInvoice.subtotal;
    let taxAmount = existingInvoice.taxAmount;
    let total = existingInvoice.total;

    if (validatedData.lineItems || validatedData.taxRate !== undefined) {
      const lineItems = validatedData.lineItems || await prisma.lineItem.findMany({
        where: { invoiceId: id },
      });
      const taxRate = validatedData.taxRate !== undefined ? validatedData.taxRate : Number(existingInvoice.taxRate);
      const calculatedTotals = calculateTotals(
        lineItems.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
        taxRate
      );
      subtotal = calculatedTotals.subtotal;
      taxAmount = calculatedTotals.taxAmount;
      total = calculatedTotals.total;
    }

    // Update invoice with transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete old line items if new ones are provided
      if (validatedData.lineItems) {
        await tx.lineItem.deleteMany({
          where: { invoiceId: id },
        });
      }

      // Update invoice
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          ...(validatedData.clientName && { clientName: validatedData.clientName }),
          ...(validatedData.clientEmail && { clientEmail: validatedData.clientEmail }),
          ...(validatedData.clientAddress && { clientAddress: validatedData.clientAddress }),
          ...(validatedData.issueDate && { issueDate: validatedData.issueDate }),
          ...(validatedData.dueDate && { dueDate: validatedData.dueDate }),
          ...(validatedData.currency && { currency: validatedData.currency }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
          ...(validatedData.taxRate !== undefined && { taxRate: validatedData.taxRate }),
          subtotal,
          taxAmount,
          total,
          ...(validatedData.lineItems && {
            lineItems: {
              create: validatedData.lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })),
            },
          }),
        },
        include: { lineItems: true },
      });

      return updated;
    });

    res.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
    } else {
      next(error);
    }
  }
};

// DELETE /invoices/:id - Delete invoice
export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existingInvoice) {
      throw new HttpError(404, "Invoice not found");
    }

    // Delete invoice (cascade will delete line items)
    await prisma.invoice.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// PATCH /invoices/:id/status - Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = getRouteId(req);
    const { status } = updateStatusSchema.parse(req.body);

    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId },
    });

    if (!existingInvoice) {
      throw new HttpError(404, "Invoice not found");
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { lineItems: true },
    });

    res.json(updatedInvoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
    } else {
      next(error);
    }
  }
};
