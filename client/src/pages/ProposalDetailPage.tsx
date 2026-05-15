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
        <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-secondary)" }}>
          Loading proposal...
        </div>
      </Page>
    );
  }

  if (!proposal) {
    return (
      <Page title="Proposal Detail" description="Review proposal scope, pricing, and terms.">
        <div className="error-banner">{error ?? "Proposal not found"}</div>
        <Link to="/proposals" className="text-sm font-medium text-[var(--accent)] hover:text-[#818CF8]">
          Back to proposals
        </Link>
      </Page>
    );
  }

  return (
    <Page title={proposal.title} description="Review proposal scope, pricing, and terms.">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {error && <div className="error-banner text-sm">{error}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/proposals" className="text-sm font-medium text-[var(--accent)] hover:text-[#818CF8]">
          Back to proposals
        </Link>
        <div className="flex flex-wrap gap-3">
          <Link to={`/proposals/${proposal.id}/edit`}>
            <Button variant="secondary">Edit Proposal</Button>
          </Link>
          {proposal.status === "DRAFT" && (
            <Button onClick={handleSend} disabled={sendLoading} variant="secondary">
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

      <section className="glass-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="field-label">Client</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{proposal.clientName}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{proposal.clientEmail}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </section>

      <section className="glass-card p-6" data-color-mode="dark">
        <MDEditor.Markdown source={proposal.content} />
      </section>
    </Page>
  );
}
