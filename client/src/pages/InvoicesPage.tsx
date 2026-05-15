import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { invoicesApi } from "@/lib/api/invoices";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { PlanBadge } from "@/components/PlanBadge";
import { Toast } from "@/components/Toast";
import { Page } from "@/pages/Page";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import type { Invoice } from "@/types/invoice";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await invoicesApi.delete(id);
      setInvoices(invoices.filter(invoice => invoice.id !== id));
    } catch (err) {
      setError("Failed to delete invoice");
      console.error("Error deleting invoice:", err);
    }
  };

  const handleStatusUpdate = async (id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE") => {
    try {
      const updatedInvoice = await invoicesApi.updateStatus(id, status);
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? updatedInvoice : invoice
      ));
    } catch (err) {
      setError("Failed to update invoice status");
      console.error("Error updating status:", err);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      setSendingInvoiceId(invoice.id);
      const updatedInvoice = await invoicesApi.send(invoice.id);
      setInvoices(invoices.map((item) => (item.id === invoice.id ? updatedInvoice : item)));
      setToast(`Invoice sent to ${invoice.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send invoice"));
      console.error("Error sending invoice:", error);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Page title="Invoices" description="Manage your invoices.">
        <div className="flex justify-center items-center h-64">
          <div style={{ color: "var(--text-secondary)" }}>Loading invoices...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Invoices" description="Manage your invoices.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {user?.plan === "free" ? (
        <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] px-4 py-3 text-sm text-[#FCD34D]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>You've used {invoices.length}/3 free invoices. Upgrade to PRO for unlimited.</p>
            <PlanBadge plan={user.plan} />
          </div>
        </div>
      ) : null}

      <div className="my-6 flex justify-end">
        <Link to="/invoices/new">
          <Button>
            <span aria-hidden="true">+</span>
            Create New Invoice
          </Button>
        </Link>
      </div>

      {error && (
        <div className="error-banner mb-4 text-sm">{error}</div>
      )}

      {invoices.length === 0 ? (
        <div className="glass-card px-6 py-14 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "var(--accent)",
              fontFamily: "Syne, sans-serif",
            }}
          >
            IF
          </div>
          <h2 className="mt-5 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            No invoices yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
            Create your first invoice to start tracking receivables and payment status.
          </p>
          <Link to="/invoices/new">
            <Button className="mt-6">Create your first invoice</Button>
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="min-w-full">
            <thead style={{ background: "var(--bg-elevated)" }}>
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Invoice Number
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="table-row-dark">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[var(--text-primary)]">
                    {invoice.number}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--text-primary)]">
                    {invoice.clientName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--text-secondary)]">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className="action-pill" to={`/invoices/${invoice.id}`}>
                        View
                      </Link>
                      <Link className="action-pill" to={`/invoices/${invoice.id}/edit`}>
                        Edit
                      </Link>
                      <button
                        className="action-pill hover:border-[rgba(239,68,68,0.4)] hover:text-[#F87171]"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        Delete
                      </button>
                      {invoice.status === "DRAFT" && (
                        <button
                          className="glow-btn px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={sendingInvoiceId === invoice.id}
                          onClick={() => handleSendInvoice(invoice)}
                        >
                          {sendingInvoiceId === invoice.id ? "Sending..." : "Send"}
                        </button>
                      )}
                      {invoice.status === "SENT" && (
                        <button
                          className="glow-btn px-3 py-1.5 text-xs"
                          onClick={() => handleStatusUpdate(invoice.id, "PAID")}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
