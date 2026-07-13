import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ConfirmModal } from "@/components/ConfirmModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { Input } from "@/components/Input";
import { proposalsApi } from "@/lib/api/proposals";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { Proposal, ProposalStatus } from "@/types/invoice";

type StatusFilter = "ALL" | ProposalStatus;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export function ProposalsListPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);

  useEffect(() => {
    void loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalsApi.getAll();
      setProposals(data);
      setError(null);
    } catch (err) {
      setError("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (proposal: Proposal) => {
    const snapshot = proposals;
    setProposals((items) => items.filter((item) => item.id !== proposal.id));
    setDeleteTarget(null);

    try {
      await proposalsApi.delete(proposal.id);
      setError(null);
    } catch (err) {
      setProposals(snapshot);
      setError("Failed to delete proposal");
    }
  };

  const handleSend = async (proposal: Proposal) => {
    try {
      setSendingId(proposal.id);
      const updatedProposal = await proposalsApi.send(proposal.id);
      setProposals((items) => items.map((item) => (item.id === proposal.id ? updatedProposal : item)));
      setToast(`Proposal sent to ${proposal.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send proposal"));
    } finally {
      setSendingId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return proposals.filter((proposal) => {
      const matchStatus = statusFilter === "ALL" || proposal.status === statusFilter;
      const matchSearch =
        !query ||
        proposal.title.toLowerCase().includes(query) ||
        proposal.clientName.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [proposals, search, statusFilter]);

  const filters: StatusFilter[] = ["ALL", "DRAFT", "SENT", "ACCEPTED", "DECLINED"];

  const columns: any[] = [
    { header: "Title", accessor: (row: any) => <span className="font-medium">{row.title}</span> },
    { header: "Client", accessor: "clientName" },
    { header: "Status", accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: "Date", accessor: (row: any) => <span className="text-small text-muted">{formatDate(row.createdAt)}</span> },
    {
      header: "",
      accessor: (row: any) => (
        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/proposals/${row.id}`)}>View</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/proposals/${row.id}/edit`)}>Edit</button>
          {row.status === "DRAFT" && (
            <button className="btn btn-secondary btn-sm" disabled={sendingId === row.id} onClick={() => handleSend(row)}>
              {sendingId === row.id ? "Sending..." : "Send"}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error-text)' }} onClick={() => setDeleteTarget(row)}>Delete</button>
        </div>
      )
    }
  ];

  return (
    <Layout title="Proposals">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      
      <div className="flex-col gap-6" style={{ display: 'flex' }}>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <Input 
              placeholder="Search proposals..." 
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
          <Link to="/proposals/new" className="btn btn-primary font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 24px', height: '40px', fontSize: '13px' }}>New Proposal</Link>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <Card className="flex justify-center items-center" style={{ minHeight: '300px' }}>
            <span className="text-muted">Loading proposals...</span>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table 
              data={filtered} 
              columns={columns} 
              onRowClick={(row) => navigate(`/proposals/${row.id}`)}
              emptyMessage={search ? `No results found for "${search}"` : "No proposals found. Create one to get started."}
            />
          </Card>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete proposal"
        message={`Delete proposal "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </Layout>
  );
}
