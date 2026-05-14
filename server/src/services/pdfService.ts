import PDFDocument from "pdfkit";

import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

const getInvoiceForRender = async (invoiceId: string) =>
  prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: { orderBy: { id: "asc" } },
      user: {
        select: {
          email: true,
          name: true,
          businessName: true,
          businessAddress: true,
          businessPhone: true,
          businessWebsite: true,
          logoUrl: true,
        },
      },
    },
  }) as any;

type InvoiceForRender = any;

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
  const user = invoice.user;
  const businessName = user.businessName || user.name;
  const lineItems = invoice.lineItems
    .map(
      (item: any) => `
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
            ${user.logoUrl ? `<img src="${escapeHtml(user.logoUrl)}" alt="Logo" style="width: 64px; height: 64px; border-radius: 14px; object-fit: cover;">` : '<div class="logo">IF</div>'}
            <div>
              <div class="company-name">${escapeHtml(businessName)}</div>
              <div class="company-email">${escapeHtml(user.email)}</div>
              ${user.businessAddress ? `<div class="company-email">${escapeHtml(user.businessAddress)}</div>` : ''}
              ${user.businessPhone ? `<div class="company-email">${escapeHtml(user.businessPhone)}</div>` : ''}
              ${user.businessWebsite ? `<div class="company-email">${escapeHtml(user.businessWebsite)}</div>` : ''}
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

type PdfDoc = PDFKit.PDFDocument;

const pdfColors = {
  border: "#e2e8f0",
  header: "#f1f5f9",
  ink: "#0f172a",
  muted: "#64748b",
  subtle: "#334155",
  white: "#ffffff",
};

const toPdfText = (value: unknown) => String(value ?? "");

const formatQuantity = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);

const pageBottom = (doc: PdfDoc) => doc.page.height - doc.page.margins.bottom;

const ensureSpace = (doc: PdfDoc, height: number) => {
  if (doc.y + height <= pageBottom(doc)) {
    return;
  }

  doc.addPage();
  doc.y = doc.page.margins.top;
};

const drawLabel = (doc: PdfDoc, text: string, x: number, y: number, width: number) => {
  doc
    .fillColor(pdfColors.muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(text.toUpperCase(), x, y, { width });
};

const drawDivider = (doc: PdfDoc, x: number, y: number, width: number, color = pdfColors.border) => {
  doc.moveTo(x, y).lineTo(x + width, y).lineWidth(1).stroke(color);
};

const renderPdfHeader = (doc: PdfDoc, invoice: InvoiceForRender) => {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const user = invoice.user;
  const businessName = toPdfText(user.businessName || user.name || "InvoiceFlow");

  doc.rect(left, 44, 58, 58).fill(pdfColors.ink);
  doc.fillColor(pdfColors.white).font("Helvetica-Bold").fontSize(20).text("IF", left, 63, {
    align: "center",
    width: 58,
  });

  doc.fillColor(pdfColors.ink).font("Helvetica-Bold").fontSize(18).text(businessName, left + 74, 46, {
    width: 260,
  });
  doc.fillColor(pdfColors.muted).font("Helvetica").fontSize(10);
  doc.text(toPdfText(user.email), left + 74, doc.y + 4, { width: 260 });

  [user.businessAddress, user.businessPhone, user.businessWebsite].filter(Boolean).forEach((value) => {
    doc.text(toPdfText(value), left + 74, doc.y + 2, { width: 260 });
  });

  doc.fillColor(pdfColors.ink).font("Helvetica-Bold").fontSize(30).text("Invoice", right - 180, 46, {
    align: "right",
    width: 180,
  });
  doc.fillColor(pdfColors.subtle).font("Helvetica-Bold").fontSize(12).text(toPdfText(invoice.number), right - 180, 84, {
    align: "right",
    width: 180,
  });

  drawDivider(doc, left, 124, contentWidth, pdfColors.ink);
  doc.y = 150;
};

const renderPdfBillingDetails = (doc: PdfDoc, invoice: InvoiceForRender) => {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const dateX = left + 310;
  const dateLabelWidth = 78;
  const dateValueWidth = right - dateX - dateLabelWidth;
  const startY = doc.y;

  drawLabel(doc, "Bill to", left, startY, 220);
  doc.fillColor(pdfColors.ink).font("Helvetica-Bold").fontSize(15).text(toPdfText(invoice.clientName), left, startY + 18, {
    width: 240,
  });
  doc.fillColor(pdfColors.muted).font("Helvetica").fontSize(10);
  doc.text(toPdfText(invoice.clientEmail), left, doc.y + 4, { width: 240 });
  doc.text(toPdfText(invoice.clientAddress), left, doc.y + 8, {
    lineGap: 2,
    width: 240,
  });

  const rows = [
    ["Issue date", formatInvoiceDate(invoice.issueDate)],
    ["Due date", formatInvoiceDate(invoice.dueDate)],
    ["Status", toPdfText(invoice.status)],
    ["Currency", toPdfText(invoice.currency || "USD")],
  ];

  rows.forEach(([label, value], index) => {
    const y = startY + index * 22;

    doc.fillColor(pdfColors.muted).font("Helvetica").fontSize(10).text(label, dateX, y, {
      width: dateLabelWidth,
    });
    doc.fillColor(pdfColors.ink).font("Helvetica-Bold").fontSize(10).text(value, dateX + dateLabelWidth, y, {
      align: "right",
      width: dateValueWidth,
    });
  });

  doc.y = Math.max(doc.y, startY + 104);
};

const renderPdfLineItems = (doc: PdfDoc, invoice: InvoiceForRender) => {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const currency = invoice.currency || "USD";
  const columns = {
    amount: { width: 92, x: right - 92 },
    description: { width: contentWidth - 262, x: left },
    quantity: { width: 52, x: left + contentWidth - 262 },
    unitPrice: { width: 92, x: right - 184 },
  };

  const drawTableHeader = () => {
    ensureSpace(doc, 52);
    const headerY = doc.y;

    doc.rect(left, headerY, contentWidth, 28).fill(pdfColors.header);
    doc.fillColor(pdfColors.muted).font("Helvetica-Bold").fontSize(8);
    doc.text("DESCRIPTION", columns.description.x + 8, headerY + 10, {
      width: columns.description.width - 16,
    });
    doc.text("QTY", columns.quantity.x, headerY + 10, {
      align: "right",
      width: columns.quantity.width - 10,
    });
    doc.text("UNIT PRICE", columns.unitPrice.x, headerY + 10, {
      align: "right",
      width: columns.unitPrice.width - 10,
    });
    doc.text("AMOUNT", columns.amount.x, headerY + 10, {
      align: "right",
      width: columns.amount.width,
    });
    doc.y = headerY + 28;
  };

  doc.y += 20;
  drawTableHeader();

  invoice.lineItems.forEach((item: any) => {
    const description = toPdfText(item.description);
    const descriptionHeight = doc
      .font("Helvetica")
      .fontSize(10)
      .heightOfString(description, { width: columns.description.width - 16 });
    const rowHeight = Math.max(40, descriptionHeight + 22);

    if (doc.y + rowHeight > pageBottom(doc)) {
      doc.addPage();
      doc.y = doc.page.margins.top;
      drawTableHeader();
    }

    const rowY = doc.y;

    doc.fillColor(pdfColors.ink).font("Helvetica").fontSize(10);
    doc.text(description, columns.description.x + 8, rowY + 11, {
      lineGap: 2,
      width: columns.description.width - 16,
    });
    doc.text(formatQuantity(item.quantity), columns.quantity.x, rowY + 11, {
      align: "right",
      width: columns.quantity.width - 10,
    });
    doc.text(formatInvoiceCurrency(item.unitPrice, currency), columns.unitPrice.x, rowY + 11, {
      align: "right",
      width: columns.unitPrice.width - 10,
    });
    doc.text(formatInvoiceCurrency(item.amount, currency), columns.amount.x, rowY + 11, {
      align: "right",
      width: columns.amount.width,
    });

    drawDivider(doc, left, rowY + rowHeight, contentWidth);
    doc.y = rowY + rowHeight;
  });
};

const renderPdfTotals = (doc: PdfDoc, invoice: InvoiceForRender) => {
  const right = doc.page.width - doc.page.margins.right;
  const currency = invoice.currency || "USD";
  const rowWidth = 232;
  const rowX = right - rowWidth;
  const labelX = rowX + 14;
  const amountX = rowX + 112;

  ensureSpace(doc, 126);
  let y = doc.y + 28;

  const drawTotalRow = (label: string, value: string, isGrandTotal = false) => {
    if (isGrandTotal) {
      doc.rect(rowX, y, rowWidth, 36).fill(pdfColors.ink);
      doc.fillColor(pdfColors.white);
    } else {
      doc.rect(rowX, y, rowWidth, 32).stroke(pdfColors.border);
      doc.fillColor(pdfColors.ink);
    }

    doc.font(isGrandTotal ? "Helvetica-Bold" : "Helvetica").fontSize(isGrandTotal ? 12 : 10);
    doc.text(label, labelX, y + (isGrandTotal ? 11 : 10), { width: 90 });
    doc.font("Helvetica-Bold").text(value, amountX, y + (isGrandTotal ? 11 : 10), {
      align: "right",
      width: rowWidth - 126,
    });

    y += isGrandTotal ? 36 : 32;
  };

  drawTotalRow("Subtotal", formatInvoiceCurrency(invoice.subtotal, currency));
  drawTotalRow(`Tax (${formatQuantity(invoice.taxRate)}%)`, formatInvoiceCurrency(invoice.taxAmount, currency));
  drawTotalRow("Total", formatInvoiceCurrency(invoice.total, currency), true);

  doc.y = y;
};

const renderPdfFooter = (doc: PdfDoc, invoice: InvoiceForRender) => {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const columnWidth = (contentWidth - 28) / 2;

  ensureSpace(doc, 110);
  doc.y += 34;
  drawDivider(doc, left, doc.y, contentWidth);
  doc.y += 22;

  const startY = doc.y;

  drawLabel(doc, "Payment terms", left, startY, columnWidth);
  doc
    .fillColor(pdfColors.subtle)
    .font("Helvetica")
    .fontSize(10)
    .text(`Payment is due by ${formatInvoiceDate(invoice.dueDate)}.`, left, startY + 18, {
      lineGap: 2,
      width: columnWidth,
    });

  const notesX = left + columnWidth + 28;
  drawLabel(doc, "Notes", notesX, startY, columnWidth);
  doc
    .fillColor(pdfColors.subtle)
    .font("Helvetica")
    .fontSize(10)
    .text(toPdfText(invoice.notes || "Thank you for your business."), notesX, startY + 18, {
      lineGap: 2,
      width: columnWidth,
    });
};

const renderPdfDocument = (doc: PdfDoc, invoice: InvoiceForRender) => {
  renderPdfHeader(doc, invoice);
  renderPdfBillingDetails(doc, invoice);
  renderPdfLineItems(doc, invoice);
  renderPdfTotals(doc, invoice);
  renderPdfFooter(doc, invoice);
};

const createPdfBuffer = (invoice: InvoiceForRender) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 48,
      size: "A4",
      info: {
        Title: `Invoice ${toPdfText(invoice.number)}`,
      },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    });
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    renderPdfDocument(doc, invoice);
    doc.end();
  });

export const generateInvoicePDF = async (invoiceId: string, userId: string) => {
  const invoice = await getInvoiceForRender(invoiceId);

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  if (invoice.userId !== userId) {
    throw new HttpError(403, "Invoice does not belong to this user");
  }

  return createPdfBuffer(invoice);
};
