import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { proposalsApi } from "@/lib/api/proposals";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { Page } from "@/pages/Page";
import type { Proposal } from "@/types/invoice";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export function ProposalsListPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
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
    if (!confirm(`Delete proposal "${proposal.title}"?`)) {
      return;
    }

    try {
      await proposalsApi.delete(proposal.id);
      setProposals((items) => items.filter((item) => item.id !== proposal.id));
      setError(null);
    } catch (err) {
      setError("Failed to delete proposal");
      console.error("Error deleting proposal:", err);
    }
  };

  const handleSend = async (proposal: Proposal) => {
    try {
      setSendingId(proposal.id);
      const updatedProposal = await proposalsApi.send(proposal.id);
      setProposals((items) =>
        items.map((item) => (item.id === proposal.id ? updatedProposal : item)),
      );
      setToast(`Proposal sent to ${proposal.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send proposal"));
      console.error("Error sending proposal:", error);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <Page title="Proposals" description="Create, send, and track project proposals.">
        <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-secondary)" }}>
          Loading proposals...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Proposals" description="Create, send, and track project proposals.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/dashboard" className="text-sm font-medium text-[var(--accent)] hover:text-[#818CF8]">
          Back to dashboard
        </Link>
        <Link to="/proposals/new">
          <Button>Create Proposal</Button>
        </Link>
      </div>

      {error && <div className="error-banner text-sm">{error}</div>}

      {proposals.length === 0 ? (
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
            No proposals yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--text-secondary)" }}>
            Create a proposal to package scope, pricing, and terms for your next client.
          </p>
          <Link to="/proposals/new" className="mt-4 inline-flex">
            <Button>Create your first proposal</Button>
          </Link>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--bg-elevated)" }}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Proposal
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Client
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="table-row-dark">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{proposal.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="text-sm text-[var(--text-primary)]">{proposal.clientName}</div>
                      <div className="text-sm text-[var(--text-secondary)]">{proposal.clientEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={proposal.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-[var(--text-secondary)]">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/proposals/${proposal.id}`}
                          className="action-pill"
                        >
                          View
                        </Link>
                        <Link
                          to={`/proposals/${proposal.id}/edit`}
                          className="action-pill"
                        >
                          Edit
                        </Link>
                        {proposal.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => handleSend(proposal)}
                            disabled={sendingId === proposal.id}
                            className="glow-btn px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sendingId === proposal.id ? "Sending..." : "Send"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(proposal)}
                          className="action-pill hover:border-[rgba(239,68,68,0.4)] hover:text-[#F87171]"
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
    </Page>
  );
}
