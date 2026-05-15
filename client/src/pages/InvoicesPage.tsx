import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ConfirmModal } from "@/components/ConfirmModal";
import { PlanBadge } from "@/components/PlanBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { TopLoadingBar, useLoadingBar } from "@/components/TopLoadingBar";
import { invoicesApi } from "@/lib/api/invoices";
import { Page } from "@/pages/Page";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

type StatusFilter = "ALL" | InvoiceStatus;

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M2.5 12C4.5 7.5 7.667 5.25 12 5.25C16.333 5.25 19.5 7.5 21.5 12C19.5 16.5 16.333 18.75 12 18.75C7.667 18.75 4.5 16.5 2.5 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M12 15A3 3 0 1012 9a3 3 0 000 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path
        d="M5 7h14M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 14h8l1-14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="32" viewBox="0 0 24 24" width="32">
      <path
        d="M7 3h8l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2Zm7 0v5h5M9 13h6M9 17h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SkeletonCell({ width }: { width: string }) {
  return <div className="skeleton" style={{ height: 12, width }} />;
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(amount);

export function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const user = useAuthStore((state) => state.user);
  const {
    active: loadingBarActive,
    complete: loadingBarComplete,
    done: finishLoadingBar,
    start: startLoadingBar,
  } = useLoadingBar();

  useEffect(() => {
    void loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      startLoadingBar();
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
      finishLoadingBar();
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    const snapshot = invoices;
    setInvoices((items) => items.filter((item) => item.id !== invoice.id));
    setDeleteTarget(null);

    try {
      await invoicesApi.delete(invoice.id);
      setError(null);
    } catch (err) {
      setInvoices(snapshot);
      setError("Failed to delete invoice");
      console.error("Error deleting invoice:", err);
    }
  };

  const handleStatusUpdate = async (id: string, status: InvoiceStatus) => {
    try {
      const updatedInvoice = await invoicesApi.updateStatus(id, status);
      setInvoices((items) => items.map((invoice) => (invoice.id === id ? updatedInvoice : invoice)));
    } catch (err) {
      setError("Failed to update invoice status");
      console.error("Error updating status:", err);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      setSendingInvoiceId(invoice.id);
      const updatedInvoice = await invoicesApi.send(invoice.id);
      setInvoices((items) => items.map((item) => (item.id === invoice.id ? updatedInvoice : item)));
      setToast(`Invoice sent to ${invoice.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send invoice"));
      console.error("Error sending invoice:", error);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return invoices.filter((invoice) => {
      const matchStatus = statusFilter === "ALL" || invoice.status === statusFilter;
      const matchSearch =
        !query ||
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.number.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "ALL";
  const filters: StatusFilter[] = ["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"];

  return (
    <Page description="Manage invoices" title="Invoices">
      <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}

      <div className="page-enter space-y-4" key={location.pathname}>
        {user?.plan === "free" ? (
          <div className="card flex flex-col gap-3 border-[rgba(245,158,11,0.2)] bg-[var(--amber-dim)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--amber)]">
              <PlanBadge plan={user.plan} />
              <span>3 invoice limit · Upgrade for unlimited</span>
            </div>
            <Link className="btn btn-secondary btn-sm" to="/upgrade">
              Upgrade →
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="input w-full sm:w-[240px]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices..."
              value={search}
            />
            <div className="flex flex-wrap gap-1">
              {filters.map((filter) => (
                <button
                  className={`btn btn-sm ${statusFilter === filter ? "btn-secondary border-[var(--accent)]" : "btn-ghost"}`}
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  type="button"
                >
                  {filter === "ALL" ? "All" : filter[0] + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <Link className="btn btn-primary btn-sm" to="/invoices/new">
            New Invoice
          </Link>
        </div>

        <p className="text-[11px] text-[var(--text-3)]">
          Showing {filtered.length} of {invoices.length}
        </p>

        {error ? (
          <div className="card error-state flex items-center justify-between gap-3">
            <span>⚠ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => void loadInvoices()} type="button">
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td>
                      <SkeletonCell width="56px" />
                    </td>
                    <td>
                      <SkeletonCell width="120px" />
                    </td>
                    <td>
                      <SkeletonCell width="72px" />
                    </td>
                    <td>
                      <SkeletonCell width="64px" />
                    </td>
                    <td>
                      <SkeletonCell width="82px" />
                    </td>
                    <td>
                      <SkeletonCell width="120px" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card empty-state">
            <span className="text-[var(--text-3)]">
              <EmptyIcon />
            </span>
            <h2 className="mt-3 text-sm font-medium text-[var(--text-2)]">No invoices yet</h2>
            <p className="mt-1 text-xs text-[var(--text-3)]">Create your first invoice to get started.</p>
            <Link className="btn btn-primary btn-sm mt-4" to="/invoices/new">
              New Invoice
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <span className="text-[var(--text-3)]">
              <EmptyIcon />
            </span>
            <h2 className="mt-3 text-sm font-medium text-[var(--text-2)]">
              No results for &quot;{search}&quot;
            </h2>
            <button
              className="btn btn-ghost btn-sm mt-3"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((invoice) => (
                    <tr
                      data-clickable="true"
                      key={invoice.id}
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <td className="mono">{invoice.number}</td>
                      <td>{invoice.clientName}</td>
                      <td className="mono">{formatCurrency(Number(invoice.total), invoice.currency)}</td>
                      <td>
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="text-[var(--text-2)]">{formatDate(invoice.dueDate)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <span className="tooltip-wrap">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/invoices/${invoice.id}`);
                              }}
                              type="button"
                            >
                              <EyeIcon />
                            </button>
                            <span className="tooltip">View</span>
                          </span>
                          <span className="tooltip-wrap">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/invoices/${invoice.id}/edit`);
                              }}
                              type="button"
                            >
                              <PencilIcon />
                            </button>
                            <span className="tooltip">Edit</span>
                          </span>
                          {invoice.status === "DRAFT" ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={sendingInvoiceId === invoice.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleSendInvoice(invoice);
                              }}
                              type="button"
                            >
                              {sendingInvoiceId === invoice.id ? "Sending..." : "Send"}
                            </button>
                          ) : null}
                          {invoice.status === "SENT" ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleStatusUpdate(invoice.id, "PAID");
                              }}
                              type="button"
                            >
                              Mark paid
                            </button>
                          ) : null}
                          <span className="tooltip-wrap">
                            <button
                              className="btn btn-ghost btn-sm text-[var(--red)]"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(invoice);
                              }}
                              type="button"
                            >
                              <TrashIcon />
                            </button>
                            <span className="tooltip">Delete</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        confirmLabel="Delete"
        destructive
        message={`Delete ${deleteTarget?.number ?? "this invoice"}? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Delete invoice"
      />
    </Page>
  );
}
