import {
  escapeHtml,
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "../pdfService";

/**
 * Shared types for template rendering — no req/res dependencies.
 */
interface InvoiceEmailData {
  invoiceNumber: string;
  freelancerName: string;
  clientName: string;
  clientEmail: string;
  total: number;
  currency: string;
  dueDate: Date;
  paymentUrl: string;
}

interface PaymentConfirmationData {
  invoiceNumber: string;
  freelancerName: string;
  freelancerEmail: string;
  clientName: string;
  clientEmail: string;
  total: number;
  currency: string;
  paidAt: Date;
}

interface FollowUpReminderData {
  invoiceNumber: string;
  freelancerName: string;
  clientName: string;
  total: number;
  currency: string;
  dueDate: Date;
  offsetDays: number;
  paymentUrl: string;
}

// ──────────────────────────────────────────────────────────────
// Shared email wrapper
// ──────────────────────────────────────────────────────────────

const wrapEmail = (title: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:32px;">
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

// ──────────────────────────────────────────────────────────────
// Invoice Send Email
// ──────────────────────────────────────────────────────────────

export const renderInvoiceSendEmail = (data: InvoiceEmailData): { html: string; text: string; subject: string } => {
  const amountDue = formatInvoiceCurrency(data.total, data.currency);
  const dueDate = formatInvoiceDate(data.dueDate);

  const body = `
    <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Invoice ${escapeHtml(data.invoiceNumber)}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
      ${escapeHtml(data.freelancerName)} has sent you an invoice. A PDF copy is attached for your records.
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
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(data.clientName)}</td>
      </tr>
    </table>
    <a href="${escapeHtml(data.paymentUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">
      Pay Now
    </a>
    <p style="margin:28px 0 0;font-size:13px;line-height:20px;color:#64748b;">
      If the button does not work, open this link: <br>
      <a href="${escapeHtml(data.paymentUrl)}" style="color:#0f766e;">${escapeHtml(data.paymentUrl)}</a>
    </p>`;

  return {
    html: wrapEmail(`Invoice ${data.invoiceNumber}`, body),
    text: [
      `Invoice ${data.invoiceNumber} from ${data.freelancerName}`,
      `Amount due: ${amountDue}`,
      `Due date: ${dueDate}`,
      `Pay now: ${data.paymentUrl}`,
    ].join("\n"),
    subject: `Invoice ${data.invoiceNumber} from ${data.freelancerName}`,
  };
};

// ──────────────────────────────────────────────────────────────
// Payment Confirmation Email (two variants)
// ──────────────────────────────────────────────────────────────

export const renderPaymentConfirmationForFreelancer = (data: PaymentConfirmationData): { html: string; text: string; subject: string } => {
  const amount = formatInvoiceCurrency(data.total, data.currency);
  const paidDate = formatInvoiceDate(data.paidAt);

  const body = `
    <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">You got paid! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
      ${escapeHtml(data.clientName)} has paid invoice ${escapeHtml(data.invoiceNumber)}.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Amount</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#22c55e;">${escapeHtml(amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;color:#64748b;">Paid on</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(paidDate)}</td>
      </tr>
    </table>`;

  return {
    html: wrapEmail("Payment received", body),
    text: `Payment received for Invoice ${data.invoiceNumber}\nAmount: ${amount}\nPaid by: ${data.clientName}\nPaid on: ${paidDate}`,
    subject: `Payment received – Invoice ${data.invoiceNumber}`,
  };
};

export const renderPaymentConfirmationForClient = (data: PaymentConfirmationData): { html: string; text: string; subject: string } => {
  const amount = formatInvoiceCurrency(data.total, data.currency);
  const paidDate = formatInvoiceDate(data.paidAt);

  const body = `
    <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">Payment received, thank you!</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
      Your payment of ${escapeHtml(amount)} for invoice ${escapeHtml(data.invoiceNumber)} has been received.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Invoice</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(data.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Amount</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;color:#64748b;">Paid on</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(paidDate)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
      Thank you for your prompt payment, ${escapeHtml(data.clientName)}.
    </p>`;

  return {
    html: wrapEmail("Payment confirmation", body),
    text: `Payment confirmation for Invoice ${data.invoiceNumber}\nAmount: ${amount}\nPaid on: ${paidDate}\nThank you, ${data.clientName}.`,
    subject: `Payment confirmation – Invoice ${data.invoiceNumber}`,
  };
};

// ──────────────────────────────────────────────────────────────
// Follow-up Reminder (escalating tone by offsetDays)
// ──────────────────────────────────────────────────────────────

const getFollowUpTone = (offsetDays: number): { heading: string; paragraph: string; subjectPrefix: string } => {
  if (offsetDays <= 3) {
    return {
      heading: "Friendly reminder",
      paragraph: "Just a gentle reminder that the following invoice is coming up on its due date. We'd appreciate your attention at your earliest convenience.",
      subjectPrefix: "Reminder",
    };
  }

  if (offsetDays <= 7) {
    return {
      heading: "Payment reminder",
      paragraph: "This is a follow-up regarding an outstanding invoice. The due date has passed and we would appreciate your prompt attention to this matter.",
      subjectPrefix: "Payment overdue",
    };
  }

  return {
    heading: "Final notice",
    paragraph: "This is a final reminder regarding the invoice below, which is now significantly past due. Please arrange payment immediately to avoid any further action.",
    subjectPrefix: "Final notice",
  };
};

export const renderFollowUpReminderEmail = (data: FollowUpReminderData): { html: string; text: string; subject: string } => {
  const amount = formatInvoiceCurrency(data.total, data.currency);
  const dueDate = formatInvoiceDate(data.dueDate);
  const tone = getFollowUpTone(data.offsetDays);

  const body = `
    <h1 style="margin:0 0 12px;font-size:24px;line-height:32px;color:#0f172a;">${escapeHtml(tone.heading)}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:24px;color:#334155;">
      ${escapeHtml(tone.paragraph)}
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;">
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Invoice</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(data.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;color:#64748b;">Amount due</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${escapeHtml(amount)}</td>
      </tr>
      <tr>
        <td style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;color:#64748b;">Due date</td>
        <td align="right" style="padding:12px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#ef4444;">${escapeHtml(dueDate)}</td>
      </tr>
    </table>
    <a href="${escapeHtml(data.paymentUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">
      Pay Now
    </a>
    <p style="margin:28px 0 0;font-size:13px;line-height:20px;color:#64748b;">
      If the button does not work, open this link: <br>
      <a href="${escapeHtml(data.paymentUrl)}" style="color:#0f766e;">${escapeHtml(data.paymentUrl)}</a>
    </p>`;

  const subject = `${tone.subjectPrefix}: Invoice ${data.invoiceNumber} from ${data.freelancerName}`;

  return {
    html: wrapEmail(subject, body),
    text: [
      `${tone.heading} – Invoice ${data.invoiceNumber}`,
      tone.paragraph,
      `Amount due: ${amount}`,
      `Due date: ${dueDate}`,
      `Pay now: ${data.paymentUrl}`,
    ].join("\n"),
    subject,
  };
};

export type {
  InvoiceEmailData,
  PaymentConfirmationData,
  FollowUpReminderData,
};
