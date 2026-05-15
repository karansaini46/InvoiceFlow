import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { TopLoadingBar, useLoadingBar } from "@/components/TopLoadingBar";
import { invoicesApi } from "@/lib/api/invoices";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  downloadBlobAsFile,
  getInvoicePdfFilename,
  openInvoiceInGmail,
} from "@/lib/gmail";
import { Page } from "@/pages/Page";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(amount);

function CopyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
      <path
        d="M9 9h10v10H9V9ZM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function Timeline({ status }: { status: InvoiceStatus }) {
  const steps = status === "OVERDUE" ? ["DRAFT", "SENT", "OVERDUE"] : ["DRAFT", "SENT", "PAID"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const overdue = current && step === "OVERDUE";

        return (
          <div className="flex flex-1 items-start" key={step}>
            <div className="flex flex-col items-center">
              <span
                className="mono flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: completed ? "var(--accent)" : current ? "var(--accent-dim)" : "var(--bg-2)",
                  border: current
                    ? `2px solid ${overdue ? "var(--red)" : "var(--accent)"}`
                    : "1px solid transparent",
                  color: completed ? "#fff" : overdue ? "var(--red)" : current ? "var(--accent)" : "var(--text-3)",
                }}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-wide text-[var(--text-3)]">
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? <span className="mt-2.5 h-px flex-1 bg-[var(--border)]" /> : null}
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
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const downloadedTimer = useRef<number | null>(null);
  const {
    active: loadingBarActive,
    complete: loadingBarComplete,
    done: finishLoadingBar,
    start: startLoadingBar,
  } = useLoadingBar();

  useEffect(() => {
    if (!id) {
      setError("Invoice not found");
      setLoading(false);
      return;
    }

    void loadInvoice(id);
  }, [id]);

  useEffect(
    () => () => {
      if (copiedTimer.current !== null) {
        window.clearTimeout(copiedTimer.current);
      }
      if (downloadedTimer.current !== null) {
        window.clearTimeout(downloadedTimer.current);
      }
    },
    [],
  );

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      startLoadingBar();
      const data = await invoicesApi.getById(invoiceId);
      setInvoice(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setLoading(false);
      finishLoadingBar();
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) {
      return;
    }

    try {
      setDownloadLoading(true);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
      setDownloaded(true);
      downloadedTimer.current = window.setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      setError("Failed to download invoice PDF");
      console.error("Error downloading invoice PDF:", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleOpenInGmail = async () => {
    if (!invoice) {
      return;
    }

    try {
      setGmailLoading(true);
      openInvoiceInGmail(invoice);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
      setToast("Gmail opened with the client email filled. Attach the downloaded PDF before sending.");
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to prepare invoice for Gmail"));
      console.error("Error preparing invoice for Gmail:", error);
    } finally {
      setGmailLoading(false);
    }
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;

      if (tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      if (event.key.toLowerCase() === "e" && invoice) {
        navigate(`/invoices/${invoice.id}/edit`);
      }

      if (event.key.toLowerCase() === "d") {
        void handleDownloadPdf();
      }

      if (event.key.toLowerCase() === "s" && invoice?.status === "DRAFT") {
        void handleOpenInGmail();
      }

      if (event.key === "Escape" || event.key === "Backspace") {
        navigate("/invoices");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const copyEmail = async () => {
    if (!invoice) {
      return;
    }

    await navigator.clipboard.writeText(invoice.clientEmail);
    setCopied(true);
    if (copiedTimer.current !== null) {
      window.clearTimeout(copiedTimer.current);
    }
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const pageTitle = useMemo(() => invoice?.number ?? "Invoice", [invoice]);

  if (loading) {
    return (
      <Page title="Invoice">
        <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
          <div className="card p-5">
            <SkeletonBlock className="h-40 w-full" />
          </div>
        </div>
      </Page>
    );
  }

  if (!invoice) {
    return (
      <Page title="Invoice">
        <div className="card error-state">⚠ {error ?? "Invoice not found"}</div>
        <Button onClick={() => navigate("/invoices")} size="sm" variant="ghost">
          ← Invoices
        </Button>
      </Page>
    );
  }

  return (
    <Page title={pageTitle}>
      <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}

      {error ? <div className="card error-state">⚠ {error}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => navigate("/invoices")} size="sm" variant="ghost">
          ← Invoices
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/invoices/${invoice.id}/edit`)} size="sm" variant="secondary">
            Edit
          </Button>
          {invoice.status === "DRAFT" ? (
            <Button loading={gmailLoading} onClick={() => void handleOpenInGmail()} size="sm">
              Open in Gmail
            </Button>
          ) : null}
          <Button loading={downloadLoading} onClick={() => void handleDownloadPdf()} size="sm" variant="secondary">
            {downloadLoading ? "Preparing..." : downloaded ? "✓ Downloaded" : "Download PDF"}
          </Button>
        </div>
      </div>

      <section className="card p-4">
        <Timeline status={invoice.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <section className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-1)]">{invoice.clientName}</h2>
              <div className="group mt-0.5 flex items-center gap-2">
                <p className="mono text-[12px] text-[var(--text-2)]">{invoice.clientEmail}</p>
                <button
                  aria-label="Copy client email"
                  className="relative text-[var(--text-3)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--text-2)]"
                  onClick={() => void copyEmail()}
                  type="button"
                >
                  <CopyIcon />
                  {copied ? <span className="tooltip !opacity-100">Copied!</span> : null}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[var(--text-2)]">
                {invoice.clientAddress}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <StatusBadge status={invoice.status} />
              <p className="mono mt-2 text-[12px] text-[var(--text-3)]">{invoice.number}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-3">
            {[
              ["Issue date", formatDate(invoice.issueDate)],
              ["Due date", formatDate(invoice.dueDate)],
              ["Currency", invoice.currency],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] uppercase text-[var(--text-3)]">{label}</p>
                <p className="mt-1 text-[13px] text-[var(--text-1)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-md border border-[var(--border)]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td className="mono text-right">{item.quantity}</td>
                    <td className="mono text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="mono text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.notes ? (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <p className="text-[11px] uppercase text-[var(--text-3)]">Notes</p>
              <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[var(--text-2)]">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="card self-start p-4 lg:sticky lg:top-24">
          <h2 className="mb-3 text-[11px] uppercase tracking-wide text-[var(--text-2)]">Summary</h2>
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[var(--text-2)]">Subtotal</span>
              <span className="mono">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-2)]">Tax ({invoice.taxRate}%)</span>
              <span className="mono">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="divider" />
            <div className="flex justify-between font-semibold">
              <span className="text-[var(--text-1)]">Total</span>
              <span className="mono text-[16px] text-[var(--accent)]">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}
