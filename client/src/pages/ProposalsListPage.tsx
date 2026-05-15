import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ConfirmModal } from "@/components/ConfirmModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { proposalsApi } from "@/lib/api/proposals";
import { Page } from "@/pages/Page";
import type { Proposal, ProposalStatus } from "@/types/invoice";

type StatusFilter = "ALL" | ProposalStatus;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

function EmptyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="32" viewBox="0 0 24 24" width="32">
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

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
      console.error("Error loading proposals:", err);
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
      console.error("Error deleting proposal:", err);
    }
  };

  const handleSend = async (proposal: Proposal) => {
    try {
      setSendingId(proposal.id);
      const updatedProposal = await proposalsApi.send(proposal.id);
      setProposals((items) => items.map((item) => (item.id === proposal.id ? updatedProposal : item)));
      setToast(`Proposal sent to ${proposal.clientEmail}`);
      setError(null);
    } catch (err) {
      setError("Failed to send proposal");
      console.error("Error sending proposal:", err);
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

  return (
    <Page description="Create, send, and track project proposals" title="Proposals">
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="input w-full sm:w-[240px]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search proposals..."
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
          <Link className="btn btn-primary btn-sm" to="/proposals/new">
            New Proposal
          </Link>
        </div>

        <p className="text-[11px] text-[var(--text-3)]">
          Showing {filtered.length} of {proposals.length}
        </p>

        {error ? (
          <div className="card error-state flex items-center justify-between gap-3">
            <span>⚠ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => void loadProposals()} type="button">
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td>
                      <div className="skeleton h-3 w-28" />
                    </td>
                    <td>
                      <div className="skeleton h-3 w-24" />
                    </td>
                    <td>
                      <div className="skeleton h-4 w-16" />
                    </td>
                    <td>
                      <div className="skeleton h-3 w-20" />
                    </td>
                    <td>
                      <div className="skeleton h-6 w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : proposals.length === 0 ? (
          <div className="card empty-state">
            <span className="text-[var(--text-3)]">
              <EmptyIcon />
            </span>
            <h2 className="mt-3 text-sm font-medium text-[var(--text-2)]">No proposals yet</h2>
            <p className="mt-1 text-xs text-[var(--text-3)]">Create your first proposal to get started.</p>
            <Link className="btn btn-primary btn-sm mt-4" to="/proposals/new">
              New Proposal
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
                    <th>Title</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((proposal) => (
                    <tr
                      data-clickable="true"
                      key={proposal.id}
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                    >
                      <td>{proposal.title}</td>
                      <td>{proposal.clientName}</td>
                      <td>
                        <StatusBadge status={proposal.status} />
                      </td>
                      <td className="text-[var(--text-2)]">{formatDate(proposal.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/proposals/${proposal.id}`);
                            }}
                            type="button"
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/proposals/${proposal.id}/edit`);
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                          {proposal.status === "DRAFT" ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={sendingId === proposal.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleSend(proposal);
                              }}
                              type="button"
                            >
                              {sendingId === proposal.id ? "Sending..." : "Send"}
                            </button>
                          ) : null}
                          <button
                            className="btn btn-ghost btn-sm text-[var(--red)]"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(proposal);
                            }}
                            type="button"
                          >
                            Delete
                          </button>
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
        message={`Delete ${deleteTarget?.title ?? "this proposal"}? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Delete proposal"
      />
    </Page>
  );
}
