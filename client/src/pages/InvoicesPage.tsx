import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { ConfirmModal } from "@/components/ConfirmModal";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { invoicesApi } from "@/lib/api/invoices";
import { downloadBlobAsFile, getInvoicePdfFilename, openInvoiceInGmail } from "@/lib/gmail";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

type StatusFilter = "ALL" | InvoiceStatus;

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d="M2.5 12C4.5 7.5 7.667 5.25 12 5.25C16.333 5.25 19.5 7.5 21.5 12C19.5 16.5 16.333 18.75 12 18.75C7.667 18.75 4.5 16.5 2.5 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M12 15A3 3 0 1012 9a3 3 0 000 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
      <path d="M5 7h14M10 11v6M14 11v6M9 7l1-2h4l1 2M7 7l1 14h8l1-14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
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

  useEffect(() => {
    void loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
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
    }
  };

  const handleStatusUpdate = async (id: string, status: InvoiceStatus) => {
    try {
      const updatedInvoice = await invoicesApi.updateStatus(id, status);
      setInvoices((items) => items.map((invoice) => (invoice.id === id ? updatedInvoice : invoice)));
    } catch (err) {
      setError("Failed to update invoice status");
    }
  };

  const handleOpenInGmail = async (invoice: Invoice) => {
    try {
      setSendingInvoiceId(invoice.id);
      openInvoiceInGmail(invoice);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
      setToast("Gmail opened with the client email filled. Attach the downloaded PDF before sending.");
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to prepare invoice for Gmail"));
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return invoices.filter((invoice) => {
      const matchStatus = statusFilter === "ALL" || invoice.status === statusFilter;
      const matchSearch = !query || invoice.clientName.toLowerCase().includes(query) || invoice.number.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  const filters: StatusFilter[] = ["ALL", "DRAFT", "SCHEDULED", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"];

  const columns: any[] = [
    { header: "Invoice", accessor: (row: any) => <span className="font-mono text-small">{row.number}</span> },
    { header: "Client", accessor: "clientName" },
    { header: "Amount", accessor: (row: any) => <span className="font-mono">{formatCurrency(Number(row.total), row.currency)}</span> },
    { header: "Status", accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: "Due", accessor: (row: any) => <span className="text-muted text-small">{formatDate(row.dueDate)}</span> },
    {
      header: "",
      accessor: (row: any) => (
        <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${row.id}`)}><EyeIcon /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${row.id}/edit`)}><PencilIcon /></button>
          {row.status === "DRAFT" && (
            <button className="btn btn-secondary btn-sm" disabled={sendingInvoiceId === row.id} onClick={() => handleOpenInGmail(row)}>
              {sendingInvoiceId === row.id ? "..." : "Send"}
            </button>
          )}
          {row.status === "SENT" && (
            <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(row.id, "PAID")}>Mark Paid</button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error-text)' }} onClick={() => setDeleteTarget(row)}><TrashIcon /></button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Invoices">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      
      <div className="page-enter flex-col gap-6" style={{ display: 'flex' }} key={location.pathname}>
        
        {user?.plan === "free" && (
          <Card style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="text-small" style={{ color: 'var(--warning-text)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge" style={{ backgroundColor: 'var(--warning-text)', color: 'var(--bg-base)' }}>Free</span>
              <span>3 invoice limit · Upgrade for unlimited access</span>
            </div>
            <Link to="/upgrade" className="btn btn-secondary btn-sm">Upgrade</Link>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Input 
              placeholder="Search invoices..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '280px', marginBottom: 0 }}
            />
            <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '4px' }}>
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`btn btn-sm ${statusFilter === filter ? "btn-secondary" : "btn-ghost"}`}
                  onClick={() => setStatusFilter(filter)}
                  style={statusFilter === filter ? { borderColor: 'var(--border-focus)' } : {}}
                >
                  {filter === "ALL" ? "All" : filter[0] + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <Link to="/invoices/new" className="btn btn-primary font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 24px', height: '40px', fontSize: '13px' }}>New Invoice</Link>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <Card className="flex justify-center items-center" style={{ minHeight: '300px' }}>
            <span className="text-muted">Loading invoices...</span>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table 
              data={filtered} 
              columns={columns} 
              onRowClick={(row) => navigate(`/invoices/${row.id}`)}
              emptyMessage={search ? `No results found for "${search}"` : "No invoices found. Create one to get started."}
            />
          </Card>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete invoice"
        message={`Delete invoice ${deleteTarget?.number}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </Layout>
  );
}
