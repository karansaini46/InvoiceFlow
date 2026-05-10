import nodemailer from "nodemailer";

import { prisma } from "../lib/prisma";
import {
  escapeHtml,
  formatInvoiceCurrency,
  formatInvoiceDate,
  generateInvoicePDF,
  getInvoicePdfFilename,
} from "./pdfService";
import { HttpError } from "../utils/httpError";

const getRequiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
};

const getSmtpPort = () => {
  const port = Number(getRequiredEnv("SMTP_PORT"));

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  return port;
};

const getTransporter = () => {
  const port = getSmtpPort();

  return nodemailer.createTransport({
    host: getRequiredEnv("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });
};

const getPublicInvoiceUrl = (invoiceId: string) => {
  const baseUrl =
    process.env.PUBLIC_INVOICE_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  return `${baseUrl.replace(/\/$/, "")}/invoices/${invoiceId}/view`;
};

const getInvoiceForEmail = async (invoiceId: string) =>
  prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: { orderBy: { id: "asc" } },
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

type InvoiceForEmail = NonNullable<Awaited<ReturnType<typeof getInvoiceForEmail>>>;

const renderEmailHtml = (invoice: InvoiceForEmail, publicUrl: string) => {
  const amountDue = formatInvoiceCurrency(invoice.total, invoice.currency);
  const dueDate = formatInvoiceDate(invoice.dueDate);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Invoice ${escapeHtml(invoice.number)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Invoice ${escapeHtml(invoice.number)}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
                  ${escapeHtml(invoice.user.name)} has sent you an invoice. A PDF copy is attached for your records.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Amount due</td>
                    <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(amountDue)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Due date</td>
                    <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(dueDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;color:#64748b;">Client</td>
                    <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(invoice.clientName)}</td>
                  </tr>
                </table>
                <a href="${escapeHtml(publicUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">
                  View invoice
                </a>
                <p style="margin:28px 0 0;font-size:13px;line-height:20px;color:#64748b;">
                  If the button does not work, open this link: <br>
                  <a href="${escapeHtml(publicUrl)}" style="color:#0f766e;">${escapeHtml(publicUrl)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const sendInvoiceEmail = async (invoiceId: string, userId: string) => {
  const invoice = await getInvoiceForEmail(invoiceId);

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  if (invoice.userId !== userId) {
    throw new HttpError(403, "Invoice does not belong to this user");
  }

  const publicUrl = getPublicInvoiceUrl(invoice.id);
  const amountDue = formatInvoiceCurrency(invoice.total, invoice.currency);
  const dueDate = formatInvoiceDate(invoice.dueDate);
  const [pdfBuffer, filename] = await Promise.all([
    generateInvoicePDF(invoice.id, userId),
    getInvoicePdfFilename(invoice.id, userId),
  ]);

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM ?? getRequiredEnv("SMTP_USER"),
    to: invoice.clientEmail,
    replyTo: invoice.user.email,
    subject: `Invoice ${invoice.number} from ${invoice.user.name}`,
    html: renderEmailHtml(invoice, publicUrl),
    text: [
      `Invoice ${invoice.number} from ${invoice.user.name}`,
      `Amount due: ${amountDue}`,
      `Due date: ${dueDate}`,
      `View invoice: ${publicUrl}`,
    ].join("\n"),
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return {
    clientEmail: invoice.clientEmail,
    publicUrl,
  };
};
