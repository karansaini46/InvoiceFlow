import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { proposalsApi } from "@/lib/api/proposals";
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
    } catch (err) {
      setError("Failed to send proposal");
      console.error("Error sending proposal:", err);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <Page title="Proposals" description="Create, send, and track project proposals.">
        <div className="flex h-64 items-center justify-center text-gray-500">
          Loading proposals...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Proposals" description="Create, send, and track project proposals.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
          Back to dashboard
        </Link>
        <Link to="/proposals/new">
          <Button>Create Proposal</Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="rounded-lg bg-white px-6 py-12 text-center shadow-sm">
          <div className="text-gray-500">No proposals found</div>
          <Link to="/proposals/new" className="mt-4 inline-flex">
            <Button>Create your first proposal</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Proposal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{proposal.clientName}</div>
                      <div className="text-sm text-gray-500">{proposal.clientEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={proposal.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/proposals/${proposal.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link
                          to={`/proposals/${proposal.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        {proposal.status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => handleSend(proposal)}
                            disabled={sendingId === proposal.id}
                            className="text-green-600 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sendingId === proposal.id ? "Sending..." : "Send"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(proposal)}
                          className="text-red-600 hover:text-red-900"
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
