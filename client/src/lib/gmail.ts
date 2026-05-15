import type { Invoice } from "@/types/invoice";

type GmailInvoice = Pick<Invoice, "clientEmail" | "clientName" | "number">;

const GMAIL_COMPOSE_URL = "https://mail.google.com/mail/";

const buildInvoiceEmailBody = (invoice: GmailInvoice) =>
  [
    `Hi ${invoice.clientName},`,
    "",
    `Please find invoice ${invoice.number} attached.`,
    "",
    "Thank you.",
  ].join("\n");

export const buildInvoiceGmailComposeUrl = (invoice: GmailInvoice) => {
  const url = new URL(GMAIL_COMPOSE_URL);

  url.searchParams.set("view", "cm");
  url.searchParams.set("fs", "1");
  url.searchParams.set("to", invoice.clientEmail);
  url.searchParams.set("su", `Invoice ${invoice.number}`);
  url.searchParams.set("body", buildInvoiceEmailBody(invoice));

  return url.toString();
};

export const openInvoiceInGmail = (invoice: GmailInvoice) => {
  window.open(buildInvoiceGmailComposeUrl(invoice), "_blank", "noopener,noreferrer");
};

export const getInvoicePdfFilename = (invoiceNumber: string) =>
  `invoice-${invoiceNumber}.pdf`;

export const downloadBlobAsFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
