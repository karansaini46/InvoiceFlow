import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getInvoices,
  createInvoice,
  getInvoice,
  downloadInvoicePdf,
  viewPublicInvoice,
  sendInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} from "./invoices";
import { scheduleInvoice, cancelSchedule } from "./scheduleController";
import {
  getInvoiceFollowUpRules,
  updateInvoiceFollowUpRules,
  cancelInvoiceFollowUps,
} from "./followUpController";

const router = Router();

// GET /invoices/:id/view - Public invoice view
router.get("/:id/view", viewPublicInvoice);

// Apply auth middleware to all routes below
router.use(authMiddleware);

// GET /invoices - Get all invoices for authenticated user
router.get("/", getInvoices);

// POST /invoices - Create new invoice
router.post("/", createInvoice);

// GET /invoices/:id/pdf - Download invoice PDF
router.get("/:id/pdf", downloadInvoicePdf);

// POST /invoices/:id/send - Email invoice to client
router.post("/:id/send", sendInvoice);

// PATCH /invoices/:id/schedule - Schedule an invoice for future sending
router.patch("/:id/schedule", scheduleInvoice);

// DELETE /invoices/:id/schedule - Cancel a scheduled send
router.delete("/:id/schedule", cancelSchedule);

// GET /invoices/:id/follow-up-rules - View follow-up rules for this invoice
router.get("/:id/follow-up-rules", getInvoiceFollowUpRules);

// PUT /invoices/:id/follow-up-rules - Override follow-up rules for this invoice
router.put("/:id/follow-up-rules", updateInvoiceFollowUpRules);

// POST /invoices/:id/cancel-follow-ups - Cancel all remaining follow-ups
router.post("/:id/cancel-follow-ups", cancelInvoiceFollowUps);

// GET /invoices/:id - Get single invoice
router.get("/:id", getInvoice);

// PATCH /invoices/:id - Update invoice
router.patch("/:id", updateInvoice);

// DELETE /invoices/:id - Delete invoice
router.delete("/:id", deleteInvoice);

// PATCH /invoices/:id/status - Update invoice status
router.patch("/:id/status", updateInvoiceStatus);

export { router as invoiceRouter };
