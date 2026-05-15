import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { invoicesApi } from "@/lib/api/invoices";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { Page } from "@/pages/Page";
import type { Invoice } from "@/types/invoice";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invoice not found");
      setLoading(false);
      return;
    }

    loadInvoice(id);
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoicesApi.getById(invoiceId);
      setInvoice(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(amount);
  };

  const handleDownloadPdf = async () => {
    if (!invoice) {
      return;
    }

    try {
      setDownloadLoading(true);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download invoice PDF");
      console.error("Error downloading invoice PDF:", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) {
      return;
    }

    try {
      setSendLoading(true);
      const updatedInvoice = await invoicesApi.send(invoice.id);
      setInvoice(updatedInvoice);
      setToast(`Invoice sent to ${invoice.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send invoice"));
      console.error("Error sending invoice:", error);
    } finally {
      setSendLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Invoice" description="Invoice Details.">
        <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-secondary)" }}>
          Loading invoice...
        </div>
      </Page>
    );
  }

  if (!invoice) {
    return (
      <Page title="Invoice" description="Invoice Details.">
        <div className="error-banner">{error ?? "Invoice not found"}</div>
        <Link className="text-sm font-medium text-[var(--accent)] hover:text-[#818CF8]" to="/invoices">
          Back to invoices
        </Link>
      </Page>
    );
  }

  return (
    <Page title="Invoice" description="Invoice Details.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {error && <div className="error-banner text-sm">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[var(--accent)] hover:text-[#818CF8]" to="/invoices">
          Back to invoices
        </Link>
        <div className="flex flex-wrap gap-3">
          <Link to={`/invoices/${invoice.id}/edit`}>
            <Button variant="secondary">Edit Invoice</Button>
          </Link>
          {invoice.status === "DRAFT" && (
            <Button disabled={sendLoading} onClick={handleSendInvoice} variant="secondary">
              {sendLoading ? "Sending..." : "Send Invoice"}
            </Button>
          )}
          <Button disabled={downloadLoading} onClick={handleDownloadPdf}>
            {downloadLoading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <section className="glass-card p-5 sm:p-8">
        <div
          className="flex flex-col gap-6 border-b pb-6 sm:flex-row sm:items-start sm:justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: "var(--accent)", boxShadow: "0 0 24px var(--accent-glow)" }}
            >
              IF
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Invoice
              </p>
              <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {invoice.number}
              </h2>
            </div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="field-label">Client</p>
            <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {invoice.clientName}
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {invoice.clientEmail}
            </p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {invoice.clientAddress}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            <div>
              <div className="field-label">Issue date</div>
              <div className="mt-1 font-medium text-[var(--text-primary)]">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="field-label">Due date</div>
              <div className="mt-1 font-medium text-[var(--text-primary)]">{formatDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="field-label">Currency</div>
              <div className="mt-1 font-medium text-[var(--text-primary)]">{invoice.currency}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Line Items
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--bg-elevated)" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr className="table-row-dark" key={item.id}>
                    <td className="max-w-md px-6 py-4 text-sm text-[var(--text-primary)]">
                      {item.description}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-[var(--text-secondary)]">
                      {item.quantity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-[var(--text-secondary)]">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ml-auto mt-8 max-w-sm space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Tax ({invoice.taxRate}%)</span>
            <span className="font-medium tabular-nums">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <span>Total</span>
            <span className="stat-number text-[var(--accent)]">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </section>

      {invoice.notes && (
        <section className="glass-card p-6">
          <h2 className="section-heading">Notes / Terms</h2>
          <p className="whitespace-pre-line text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {invoice.notes}
          </p>
        </section>
      )}
    </Page>
  );
}
