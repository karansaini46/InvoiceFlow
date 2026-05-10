import puppeteer, { type Browser } from "puppeteer";

import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

let browserPromise: Promise<Browser> | null = null;

const getBrowser = () => {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
};

const getInvoiceForRender = async (invoiceId: string) =>
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

type InvoiceForRender = NonNullable<Awaited<ReturnType<typeof getInvoiceForRender>>>;

export const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatInvoiceDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const formatInvoiceCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(amount);

const renderNotes = (notes: string) =>
  notes
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join("<br>");

const renderInvoiceHtml = (invoice: InvoiceForRender) => {
  const currency = invoice.currency || "USD";
  const lineItems = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td class="description">${escapeHtml(item.description)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(formatInvoiceCurrency(item.unitPrice, currency))}</td>
          <td>${escapeHtml(formatInvoiceCurrency(item.amount, currency))}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Invoice ${escapeHtml(invoice.number)}</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f8fafc;
        color: #0f172a;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .page {
        min-height: 100vh;
        padding: 44px;
      }

      .invoice {
        width: 100%;
        min-height: 100%;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 44px;
      }

      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 32px;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 28px;
      }

      .brand {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .logo {
        display: grid;
        width: 64px;
        height: 64px;
        place-items: center;
        border-radius: 14px;
        background: #0f172a;
        color: #ffffff;
        font-size: 21px;
        font-weight: 800;
        letter-spacing: 0;
      }

      .company-name {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 0;
      }

      .company-email {
        margin-top: 4px;
        color: #64748b;
      }

      .invoice-meta {
        min-width: 220px;
        text-align: right;
      }

      .invoice-title {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: 0;
        margin: 0;
      }

      .invoice-number {
        margin-top: 6px;
        color: #475569;
        font-weight: 700;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 36px;
        margin-top: 34px;
      }

      .label {
        color: #64748b;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .client-name {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 4px;
      }

      .muted {
        color: #64748b;
      }

      .dates {
        display: grid;
        gap: 10px;
      }

      .date-row {
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 38px;
        table-layout: fixed;
      }

      th {
        background: #f1f5f9;
        color: #475569;
        font-size: 12px;
        letter-spacing: 0.06em;
        padding: 13px 12px;
        text-align: right;
        text-transform: uppercase;
      }

      th:first-child,
      td:first-child {
        text-align: left;
      }

      td {
        border-bottom: 1px solid #e2e8f0;
        padding: 16px 12px;
        text-align: right;
        vertical-align: top;
        word-break: break-word;
      }

      .description {
        width: 46%;
      }

      .totals-wrap {
        display: flex;
        justify-content: flex-end;
        margin-top: 28px;
      }

      .totals {
        width: 330px;
        border: 1px solid #e2e8f0;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 12px 16px;
      }

      .total-row + .total-row {
        border-top: 1px solid #e2e8f0;
      }

      .grand-total {
        background: #0f172a;
        color: #ffffff;
        font-size: 18px;
        font-weight: 800;
      }

      .footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-top: 44px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }

      .footer-box {
        color: #334155;
        overflow-wrap: anywhere;
      }

      @page {
        margin: 0;
        size: A4;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="invoice">
        <header class="header">
          <div class="brand">
            <div class="logo">IF</div>
            <div>
              <div class="company-name">${escapeHtml(invoice.user.name)}</div>
              <div class="company-email">${escapeHtml(invoice.user.email)}</div>
            </div>
          </div>
          <div class="invoice-meta">
            <h1 class="invoice-title">Invoice</h1>
            <div class="invoice-number">${escapeHtml(invoice.number)}</div>
          </div>
        </header>

        <section class="info-grid">
          <div>
            <div class="label">Bill to</div>
            <div class="client-name">${escapeHtml(invoice.clientName)}</div>
            <div class="muted">${escapeHtml(invoice.clientEmail)}</div>
            <div class="muted">${renderNotes(invoice.clientAddress)}</div>
          </div>
          <div class="dates">
            <div class="date-row">
              <span class="muted">Issue date</span>
              <strong>${escapeHtml(formatInvoiceDate(invoice.issueDate))}</strong>
            </div>
            <div class="date-row">
              <span class="muted">Due date</span>
              <strong>${escapeHtml(formatInvoiceDate(invoice.dueDate))}</strong>
            </div>
            <div class="date-row">
              <span class="muted">Status</span>
              <strong>${escapeHtml(invoice.status)}</strong>
            </div>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th class="description">Description</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${lineItems}</tbody>
        </table>

        <section class="totals-wrap">
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <strong>${escapeHtml(formatInvoiceCurrency(invoice.subtotal, currency))}</strong>
            </div>
            <div class="total-row">
              <span>Tax (${escapeHtml(invoice.taxRate)}%)</span>
              <strong>${escapeHtml(formatInvoiceCurrency(invoice.taxAmount, currency))}</strong>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>${escapeHtml(formatInvoiceCurrency(invoice.total, currency))}</span>
            </div>
          </div>
        </section>

        <footer class="footer">
          <div class="footer-box">
            <div class="label">Payment terms</div>
            <div>Payment is due by ${escapeHtml(formatInvoiceDate(invoice.dueDate))}.</div>
          </div>
          <div class="footer-box">
            <div class="label">Notes</div>
            <div>${invoice.notes ? renderNotes(invoice.notes) : "Thank you for your business."}</div>
          </div>
        </footer>
      </section>
    </main>
  </body>
</html>`;
};

export const getPublicInvoiceHtml = async (invoiceId: string) => {
  const invoice = await getInvoiceForRender(invoiceId);

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  return renderInvoiceHtml(invoice);
};

export const getInvoicePdfFilename = async (invoiceId: string, userId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      number: true,
      userId: true,
    },
  });

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  if (invoice.userId !== userId) {
    throw new HttpError(403, "Invoice does not belong to this user");
  }

  const safeNumber = invoice.number.replace(/[^a-z0-9_-]/gi, "-");

  return `invoice-${safeNumber}.pdf`;
};

export const generateInvoicePDF = async (invoiceId: string, userId: string) => {
  const invoice = await getInvoiceForRender(invoiceId);

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  if (invoice.userId !== userId) {
    throw new HttpError(403, "Invoice does not belong to this user");
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(renderInvoiceHtml(invoice), {
      waitUntil: "networkidle0",
    });

    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      }),
    );
  } finally {
    await page.close();
  }
};
