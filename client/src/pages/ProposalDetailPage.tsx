import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { proposalsApi } from "@/lib/api/proposals";
import { Page } from "@/pages/Page";
import type { Proposal } from "@/types/invoice";

export function ProposalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Proposal not found");
      setLoading(false);
      return;
    }

    loadProposal(id);
  }, [id]);

  const loadProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      const data = await proposalsApi.getById(proposalId);
      setProposal(data);
      setError(null);
    } catch (err) {
      setError("Failed to load proposal");
      console.error("Error loading proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!proposal) {
      return;
    }

    try {
      setSendLoading(true);
      const updatedProposal = await proposalsApi.send(proposal.id);
      setProposal(updatedProposal);
      setToast(`Proposal sent to ${proposal.clientEmail}`);
      setError(null);
    } catch (err) {
      setError("Failed to send proposal");
      console.error("Error sending proposal:", err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!proposal) {
      return;
    }

    try {
      setConvertLoading(true);
      const { invoiceId } = await proposalsApi.convert(proposal.id);
      navigate(`/invoices/${invoiceId}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to convert proposal");
      console.error("Error converting proposal:", err);
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Proposal Detail" description="Review proposal scope, pricing, and terms.">
        <div className="flex h-64 items-center justify-center text-gray-500">
          Loading proposal...
        </div>
      </Page>
    );
  }

  if (!proposal) {
    return (
      <Page title="Proposal Detail" description="Review proposal scope, pricing, and terms.">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error ?? "Proposal not found"}
        </div>
        <Link to="/proposals" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
          Back to proposals
        </Link>
      </Page>
    );
  }

  return (
    <Page title={proposal.title} description="Review proposal scope, pricing, and terms.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/proposals" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
          Back to proposals
        </Link>
        <div className="flex flex-wrap gap-3">
          <Link to={`/proposals/${proposal.id}/edit`}>
            <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300">Edit Proposal</Button>
          </Link>
          {proposal.status === "DRAFT" && (
            <Button onClick={handleSend} disabled={sendLoading}>
              {sendLoading ? "Sending..." : "Send Proposal"}
            </Button>
          )}
          <Button
            onClick={handleConvert}
            disabled={proposal.status !== "ACCEPTED" || convertLoading}
          >
            {convertLoading ? "Converting..." : "Convert to Invoice"}
          </Button>
        </div>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{proposal.clientName}</h2>
            <p className="mt-1 text-sm text-gray-500">{proposal.clientEmail}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm" data-color-mode="light">
        <MDEditor.Markdown source={proposal.content} />
      </section>
    </Page>
  );
}
