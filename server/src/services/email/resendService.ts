import { Resend } from "resend";

import { loadEnv } from "../../config/env";
import type {
  InvoiceEmailData,
  PaymentConfirmationData,
  FollowUpReminderData,
} from "./templates";
import {
  renderInvoiceSendEmail,
  renderPaymentConfirmationForFreelancer,
  renderPaymentConfirmationForClient,
  renderFollowUpReminderEmail,
} from "./templates";

loadEnv();

interface SendEmailResult {
  messageId: string;
}

interface InvoiceEmailParams extends InvoiceEmailData {
  pdfBuffer: Buffer;
  pdfFilename: string;
  replyTo: string;
}

let resendClient: Resend | null = null;

const getResend = (): Resend => {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required for email sending.");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
};

const getFromEmail = (): string => {
  const from = process.env.RESEND_FROM_EMAIL;

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is required for email sending.");
  }

  return from;
};

/**
 * Whether Resend is configured (API key and from email are set).
 */
export const isResendConfigured = (): boolean => {
  return Boolean(process.env.RESEND_API_KEY) && Boolean(process.env.RESEND_FROM_EMAIL);
};

/**
 * Send an invoice email with PDF attachment and Stripe payment link.
 */
export const sendInvoiceEmailViaResend = async (
  params: InvoiceEmailParams,
): Promise<SendEmailResult> => {
  const resend = getResend();
  const from = getFromEmail();
  const { html, text, subject } = renderInvoiceSendEmail(params);

  const result = await resend.emails.send({
    from: `InvoiceFlow <${from}>`,
    to: params.clientEmail,
    replyTo: params.replyTo,
    subject,
    html,
    text,
    attachments: [
      {
        filename: params.pdfFilename,
        content: params.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (result.error) {
    console.error("[RESEND ERROR] Failed to send invoice email:", result.error);
    throw new Error(`Resend email failed: ${result.error.message}`);
  }

  if (!result.data) {
    throw new Error("Resend returned no data and no error.");
  }

  return { messageId: result.data.id };
};

/**
 * Send payment confirmation to both freelancer and client.
 */
export const sendPaymentConfirmationEmails = async (
  params: PaymentConfirmationData,
): Promise<{ freelancerMessageId: string; clientMessageId: string }> => {
  const resend = getResend();
  const from = getFromEmail();

  // Send to freelancer
  const freelancerEmail = renderPaymentConfirmationForFreelancer(params);
  const freelancerResult = await resend.emails.send({
    from: `InvoiceFlow <${from}>`,
    to: params.freelancerEmail,
    subject: freelancerEmail.subject,
    html: freelancerEmail.html,
    text: freelancerEmail.text,
  });

  if (freelancerResult.error) {
    console.error("[RESEND ERROR] Freelancer confirmation failed:", freelancerResult.error);
    throw new Error(`Resend email failed: ${freelancerResult.error.message}`);
  }

  // Send to client
  const clientEmail = renderPaymentConfirmationForClient(params);
  const clientResult = await resend.emails.send({
    from: `InvoiceFlow <${from}>`,
    to: params.clientEmail,
    subject: clientEmail.subject,
    html: clientEmail.html,
    text: clientEmail.text,
  });

  if (clientResult.error) {
    console.error("[RESEND ERROR] Client confirmation failed:", clientResult.error);
    throw new Error(`Resend email failed: ${clientResult.error.message}`);
  }

  return {
    freelancerMessageId: freelancerResult.data?.id ?? "unknown",
    clientMessageId: clientResult.data?.id ?? "unknown",
  };
};

/**
 * Send a follow-up reminder email. Returns the Resend message ID.
 */
export const sendFollowUpReminderEmail = async (
  params: FollowUpReminderData & { clientEmail: string; replyTo: string },
): Promise<SendEmailResult> => {
  const resend = getResend();
  const from = getFromEmail();
  const { html, text, subject } = renderFollowUpReminderEmail(params);

  const result = await resend.emails.send({
    from: `InvoiceFlow <${from}>`,
    to: params.clientEmail,
    replyTo: params.replyTo,
    subject,
    html,
    text,
  });

  if (result.error) {
    console.error("[RESEND ERROR] Follow-up email failed:", result.error);
    throw new Error(`Resend email failed: ${result.error.message}`);
  }

  if (!result.data) {
    throw new Error("Resend returned no data and no error.");
  }

  return { messageId: result.data.id };
};

export type { SendEmailResult, InvoiceEmailParams };
