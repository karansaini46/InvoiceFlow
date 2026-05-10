import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getInvoices,
  createInvoice,
  getInvoice,
  downloadInvoicePdf,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} from "./invoices";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /invoices - Get all invoices for authenticated user
router.get("/", getInvoices);

// POST /invoices - Create new invoice
router.post("/", createInvoice);

// GET /invoices/:id/pdf - Download invoice PDF
router.get("/:id/pdf", downloadInvoicePdf);

// GET /invoices/:id - Get single invoice
router.get("/:id", getInvoice);

// PATCH /invoices/:id - Update invoice
router.patch("/:id", updateInvoice);

// DELETE /invoices/:id - Delete invoice
router.delete("/:id", deleteInvoice);

// PATCH /invoices/:id/status - Update invoice status
router.patch("/:id/status", updateInvoiceStatus);

export { router as invoiceRouter };
