import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { proposalsApi } from "@/lib/api/proposals";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { Page } from "@/pages/Page";
import type { Proposal, ProposalStatus } from "@/types/invoice";

function Timeline({ status }: { status: ProposalStatus }) {
  const steps = status === "DECLINED" ? ["DRAFT", "SENT", "DECLINED"] : ["DRAFT", "SENT", "ACCEPTED"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const declined = current && step === "DECLINED";

        return (
          <div className="flex flex-1 items-start" key={step}>
            <div className="flex flex-col items-center">
              <span
                className="mono flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                style={{
                  background: completed ? "var(--accent)" : current ? "var(--accent-dim)" : "var(--bg-2)",
                  border: current
                    ? `2px solid ${declined ? "var(--red)" : "var(--accent)"}`
                    : "1px solid transparent",
                  color: completed ? "#fff" : declined ? "var(--red)" : current ? "var(--accent)" : "var(--text-3)",
                }}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-wide text-[var(--text-3)]">
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? <span className="mt-2.5 h-px flex-1 bg-[var(--border)]" /> : null}
          </div>
        );
      })}
    </div>
  );
}

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

    void loadProposal(id);
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
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send proposal"));
      console.error("Error sending proposal:", error);
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
      <Page title="Proposal">
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-5 w-48" />
          </div>
          <div className="card p-5">
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </Page>
    );
  }

  if (!proposal) {
    return (
      <Page title="Proposal">
        <div className="card error-state">⚠ {error ?? "Proposal not found"}</div>
        <Button onClick={() => navigate("/proposals")} size="sm" variant="ghost">
          ← Proposals
        </Button>
      </Page>
    );
  }

  return (
    <Page title={proposal.title}>
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
      {error ? <div className="card error-state">⚠ {error}</div> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => navigate("/proposals")} size="sm" variant="ghost">
          ← Proposals
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/proposals/${proposal.id}/edit`)} size="sm" variant="secondary">
            Edit
          </Button>
          {proposal.status === "DRAFT" ? (
            <Button loading={sendLoading} onClick={() => void handleSend()} size="sm">
              Send Proposal
            </Button>
          ) : null}
          <Button
            disabled={proposal.status !== "ACCEPTED"}
            loading={convertLoading}
            onClick={() => void handleConvert()}
            size="sm"
            variant="secondary"
          >
            Convert to Invoice
          </Button>
        </div>
      </div>

      <section className="card p-4">
        <Timeline status={proposal.status} />
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] uppercase text-[var(--text-3)]">Client</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[var(--text-1)]">{proposal.clientName}</h2>
            <p className="mono mt-1 text-[12px] text-[var(--text-2)]">{proposal.clientEmail}</p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        <div className="mt-5" data-color-mode="dark">
          <MDEditor.Markdown source={proposal.content} />
        </div>
      </section>
    </Page>
  );
}
