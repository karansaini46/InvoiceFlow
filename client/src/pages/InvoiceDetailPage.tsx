import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { useInvoiceAnalysis, usePaymentReminder } from "@/hooks/useAI";
import { invoicesApi } from "@/lib/api/invoices";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { downloadBlobAsFile, getInvoicePdfFilename, openInvoiceInGmail } from "@/lib/gmail";
import type { Invoice, InvoiceStatus, FollowUpRule } from "@/types/invoice";

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", { currency, style: "currency" }).format(amount);

function CopyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <path d="M9 9h10v10H9V9ZM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Timeline({ status }: { status: InvoiceStatus }) {
  const steps = status === "CANCELLED" ? ["DRAFT", "CANCELLED"] 
              : status === "OVERDUE" ? ["DRAFT", "SENT", "OVERDUE"] 
              : status === "SCHEDULED" ? ["DRAFT", "SCHEDULED", "SENT", "PAID"] 
              : status === "VIEWED" ? ["DRAFT", "SENT", "VIEWED", "PAID"] 
              : ["DRAFT", "SENT", "PAID"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex" style={{ width: '100%' }}>
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const overdue = current && step === "OVERDUE";

        return (
          <div key={step} className="flex" style={{ flex: 1, alignItems: 'center' }}>
            <div className="flex-col items-center" style={{ display: 'flex' }}>
              <span
                style={{
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  fontSize: '12px', fontWeight: 600,
                  backgroundColor: completed ? 'var(--accent-primary)' : current ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  border: current ? `2px solid ${overdue ? 'var(--error-text)' : 'var(--accent-primary)'}` : '1px solid var(--border-strong)',
                  color: completed ? 'var(--accent-primary-text)' : overdue ? 'var(--error-text)' : current ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-small uppercase tracking-wider" style={{ color: current || completed ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '10px' }}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: completed ? 'var(--accent-primary)' : 'var(--border-subtle)', margin: '0 16px', position: 'relative', top: '-10px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function InvoiceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<InvoiceStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [followUpRules, setFollowUpRules] = useState<FollowUpRule[]>([]);
  const [followUpIsDefault, setFollowUpIsDefault] = useState(true);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const copiedTimer = useRef<number | null>(null);
  const downloadedTimer = useRef<number | null>(null);
  const { analyze, error: analysisError, loading: analysisLoading, result: analysis } = useInvoiceAnalysis();
  const { error: reminderError, generate: generateReminder, loading: reminderLoading, reminder } = usePaymentReminder();

  useEffect(() => {
    if (!id) {
      setError("Invoice not found");
      setLoading(false);
      return;
    }
    void loadInvoice(id);
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    void analyze(invoice.id).catch(console.error);
  }, [analyze, invoice]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoicesApi.getById(invoiceId);
      setInvoice(data);
      const followUpData = await invoicesApi.getFollowUpRules(invoiceId);
      setFollowUpRules(followUpData.rules);
      setFollowUpIsDefault(followUpData.isDefault);
      setError(null);
    } catch (err) {
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadLoading(true);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
      setDownloaded(true);
      downloadedTimer.current = window.setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      setError("Failed to download invoice PDF");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleOpenInGmail = async () => {
    if (!invoice) return;
    try {
      setGmailLoading(true);
      openInvoiceInGmail(invoice);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
      setToast("Gmail opened with the client email filled. Attach the downloaded PDF before sending.");
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to prepare invoice for Gmail"));
    } finally {
      setGmailLoading(false);
    }
  };

  const handleStatusUpdate = async (status: Extract<InvoiceStatus, "SENT" | "PAID">) => {
    if (!invoice) return;
    try {
      setStatusLoading(status);
      const updatedInvoice = await invoicesApi.updateStatus(invoice.id, status);
      setInvoice(updatedInvoice);
      setToast(status === "SENT" ? "Invoice marked as sent." : "Invoice marked as paid.");
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, `Failed to mark invoice as ${status.toLowerCase()}`));
    } finally {
      setStatusLoading(null);
    }
  };

  const copyEmail = async () => {
    if (!invoice) return;
    await navigator.clipboard.writeText(invoice.clientEmail);
    setCopied(true);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerateReminder = async () => {
    if (!invoice) return;
    try {
      await generateReminder(invoice.id);
      setToast("Reminder drafted.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFollowUpRule = async (index: number, field: keyof FollowUpRule, value: any) => {
    if (!invoice) return;
    try {
      setFollowUpLoading(true);
      const newRules = [...followUpRules];
      newRules[index] = { ...newRules[index], [field]: value };
      const payload = newRules.map(r => ({ offsetDays: r.offsetDays, enabled: r.enabled }));
      const response = await invoicesApi.updateFollowUpRules(invoice.id, payload);
      setFollowUpRules(response.rules);
      setFollowUpIsDefault(response.isDefault);
      setToast("Follow-up rules updated.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update follow-up rules"));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCancelFollowUps = async () => {
    if (!invoice) return;
    try {
      setFollowUpLoading(true);
      await invoicesApi.cancelFollowUps(invoice.id);
      const followUpData = await invoicesApi.getFollowUpRules(invoice.id);
      setFollowUpRules(followUpData.rules);
      setFollowUpIsDefault(followUpData.isDefault);
      setToast("All pending follow-ups cancelled.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to cancel follow-ups"));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const pageTitle = useMemo(() => invoice?.number ?? "Invoice", [invoice]);
  const isReminderAvailable = invoice?.status === "OVERDUE" || (invoice?.status !== "PAID" && invoice ? new Date(invoice.dueDate) < new Date() : false);

  if (loading) {
    return (
      <Layout title="Invoice">
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
          <Card style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading...</Card>
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout title="Invoice">
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)' }}>
          {error ?? "Invoice not found"}
        </div>
        <Button onClick={() => navigate("/invoices")} variant="ghost" className="mt-4">← Invoices</Button>
      </Layout>
    );
  }

  return (
    <Layout title={pageTitle}>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>{error}</div>}

      <div className="flex justify-between items-center mb-8">
        <Button onClick={() => navigate("/invoices")} variant="ghost" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>← Invoices</Button>
        <div className="flex gap-4">
          <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)} variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit</Button>
          {invoice.status === "DRAFT" && <Button loading={gmailLoading} onClick={handleOpenInGmail} variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open in Gmail</Button>}
          {invoice.status === "DRAFT" && <Button loading={statusLoading === "SENT"} onClick={() => handleStatusUpdate("SENT")} variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mark as sent</Button>}
          {invoice.status === "SCHEDULED" && <Button loading={statusLoading === "DRAFT"} onClick={() => handleStatusUpdate("DRAFT")} variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancel Schedule</Button>}
          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && <Button loading={statusLoading === "PAID"} onClick={() => handleStatusUpdate("PAID")} variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mark as paid</Button>}
          <Button loading={downloadLoading} onClick={handleDownloadPdf} variant="primary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {downloadLoading ? "Preparing..." : downloaded ? "Downloaded" : "Download PDF"}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <Timeline status={invoice.status} />
      </Card>

      <div className="flex gap-6 mb-8" style={{ alignItems: 'flex-start' }}>
        <Card style={{ flex: 1, padding: '40px' }}>
          <div className="flex justify-between items-start mb-8 pb-8" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h2 className="text-h2 font-display mb-2" style={{ fontSize: '28px' }}>{invoice.clientName}</h2>
              <div className="flex items-center gap-2 text-small text-muted mb-2">
                <span className="font-mono">{invoice.clientEmail}</span>
                <button onClick={copyEmail} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}><CopyIcon /></button>
                {copied && <span style={{ color: 'var(--success-text)', fontSize: '11px' }}>Copied!</span>}
              </div>
              <p className="text-small whitespace-pre-line text-muted">{invoice.clientAddress}</p>
            </div>
            <div className="text-right">
              <div className="mb-2"><StatusBadge status={invoice.status} /></div>
              <p className="font-mono text-small text-muted">{invoice.number}</p>
            </div>
          </div>

          <div className={`grid ${invoice.status === "SCHEDULED" && invoice.scheduledSendAt ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mb-6 pb-6`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="text-small font-medium text-muted uppercase tracking-wider mb-1">Issue Date</div>
              <div className="text-body">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="text-small font-medium text-muted uppercase tracking-wider mb-1">Due Date</div>
              <div className="text-body">{formatDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="text-small font-medium text-muted uppercase tracking-wider mb-1">Currency</div>
              <div className="text-body">{invoice.currency}</div>
            </div>
            {invoice.status === "SCHEDULED" && invoice.scheduledSendAt && (
              <div>
                <div className="text-small font-medium text-muted uppercase tracking-wider mb-1">Scheduled For</div>
                <div className="text-body font-mono text-accent-primary" style={{ color: 'var(--accent-primary)' }}>{new Date(invoice.scheduledSendAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr className="text-small font-medium text-muted uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border-strong)' }}>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Price</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="py-4 text-small">{item.description}</td>
                  <td className="py-4 text-right font-mono text-small">{item.quantity}</td>
                  <td className="py-4 text-right font-mono text-small">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="py-4 text-right font-mono text-small font-medium">{formatCurrency(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoice.notes && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <h4 className="text-small font-medium text-muted uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-small whitespace-pre-line text-muted leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </Card>

        <Card style={{ width: '380px', position: 'sticky', top: '88px', padding: '32px' }}>
          <h3 className="text-h2 font-display mb-6" style={{ fontSize: '20px' }}>Summary</h3>
          <div className="flex-col gap-4 text-small">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax ({invoice.taxRate}%)</span>
              <span className="font-mono">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="my-2 border-b border-[var(--border-subtle)]" />
            <div className="flex justify-between text-body font-medium">
              <span>Total</span>
              <span className="font-mono text-h3">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <Card style={{ padding: '32px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h2 font-display" style={{ fontSize: '20px', margin: 0 }}>AI Analysis</h3>
            {analysis && (
               <span className="badge" style={{ backgroundColor: analysis.risk_level === 'high' ? 'var(--error-bg)' : analysis.risk_level === 'medium' ? 'var(--warning-bg)' : 'var(--success-bg)', color: analysis.risk_level === 'high' ? 'var(--error-text)' : analysis.risk_level === 'medium' ? 'var(--warning-text)' : 'var(--success-text)' }}>
                 {analysis.risk_level} risk
               </span>
            )}
          </div>
          {analysisLoading ? (
            <div className="text-small text-muted">Analyzing invoice...</div>
          ) : analysis ? (
            <div>
              <p className="text-small leading-relaxed mb-4">{analysis.summary}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Issues</h4>
                  <ul className="text-small text-muted flex-col gap-1" style={{ display: 'flex' }}>
                    {(analysis.issues.length ? analysis.issues : ["No issues detected."]).map((issue, i) => <li key={i}>• {issue}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Suggestions</h4>
                  <ul className="text-small text-muted flex-col gap-1" style={{ display: 'flex' }}>
                    {(analysis.suggestions.length ? analysis.suggestions : ["No action needed."]).map((suggestion, i) => <li key={i}>• {suggestion}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-small text-muted">{analysisError ?? "Analysis unavailable."}</div>
          )}
        </Card>

        <Card style={{ padding: '32px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h2 font-display" style={{ fontSize: '20px', margin: 0 }}>Payment Reminder</h3>
            {isReminderAvailable && (
              <Button loading={reminderLoading} onClick={handleGenerateReminder} size="sm" variant="secondary">Generate Draft</Button>
            )}
          </div>
          {!isReminderAvailable ? (
            <p className="text-small text-muted mt-2">Available once this invoice becomes overdue.</p>
          ) : reminder ? (
            <div className="flex-col gap-4">
              <div>
                <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Subject</h4>
                <p className="text-small font-medium">{reminder.subject}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-1">Body</h4>
                <p className="text-small whitespace-pre-line leading-relaxed text-muted bg-[var(--bg-surface-elevated)] p-3 rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
                  {reminder.body}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-small text-muted mt-2">{reminderError ?? "Generate a tailored reminder to follow up."}</p>
          )}
        </Card>
      </div>

    </Layout>
  );
}
