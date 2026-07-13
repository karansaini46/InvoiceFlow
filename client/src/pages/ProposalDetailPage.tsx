import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Toast } from "@/components/Toast";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { proposalsApi } from "@/lib/api/proposals";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { Proposal, ProposalStatus } from "@/types/invoice";

function Timeline({ status }: { status: ProposalStatus }) {
  const steps = status === "DECLINED" ? ["DRAFT", "SENT", "DECLINED"] : ["DRAFT", "SENT", "ACCEPTED"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex" style={{ width: '100%' }}>
      {steps.map((step, index) => {
        const completed = index < currentIndex;
        const current = index === currentIndex;
        const declined = current && step === "DECLINED";

        return (
          <div key={step} className="flex" style={{ flex: 1, alignItems: 'center' }}>
            <div className="flex-col items-center" style={{ display: 'flex' }}>
              <span
                style={{
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  fontSize: '12px', fontWeight: 600,
                  backgroundColor: completed ? 'var(--accent-primary)' : current ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  border: current ? `2px solid ${declined ? 'var(--error-text)' : 'var(--accent-primary)'}` : '1px solid var(--border-strong)',
                  color: completed ? 'var(--accent-primary-text)' : declined ? 'var(--error-text)' : current ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-small uppercase tracking-wider" style={{ color: current || completed ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: '10px' }}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: completed ? 'var(--accent-primary)' : 'var(--border-subtle)', margin: '0 16px', position: 'relative', top: '-10px' }} />
            )}
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
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!proposal) return;
    try {
      setSendLoading(true);
      const updatedProposal = await proposalsApi.send(proposal.id);
      setProposal(updatedProposal);
      setToast(`Proposal sent to ${proposal.clientEmail}`);
      setError(null);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to send proposal"));
    } finally {
      setSendLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!proposal) return;
    try {
      setConvertLoading(true);
      const { invoiceId } = await proposalsApi.convert(proposal.id);
      navigate(`/invoices/${invoiceId}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to convert proposal");
    } finally {
      setConvertLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Proposal">
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
          <Card style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading...</Card>
        </div>
      </Layout>
    );
  }

  if (!proposal) {
    return (
      <Layout title="Proposal">
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)' }}>
          {error ?? "Proposal not found"}
        </div>
        <Button onClick={() => navigate("/proposals")} variant="ghost" className="mt-4">← Proposals</Button>
      </Layout>
    );
  }

  return (
    <Layout title={proposal.title}>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>{error}</div>}

      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => navigate("/proposals")} variant="ghost" size="sm">← Proposals</Button>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/proposals/${proposal.id}/edit`)} variant="secondary" size="sm">Edit</Button>
          {proposal.status === "DRAFT" && (
            <Button loading={sendLoading} onClick={handleSend} size="sm" variant="primary">Send Proposal</Button>
          )}
          <Button disabled={proposal.status !== "ACCEPTED"} loading={convertLoading} onClick={handleConvert} size="sm" variant="secondary">
            Convert to Invoice
          </Button>
        </div>
      </div>

      <div className="flex-col gap-6" style={{ display: 'flex' }}>
        <Card>
          <Timeline status={proposal.status} />
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="text-small font-medium text-muted uppercase tracking-wider mb-2">Client</div>
              <h2 className="text-h3 mb-1">{proposal.clientName}</h2>
              <p className="font-mono text-small text-muted">{proposal.clientEmail}</p>
            </div>
            <div>
              <StatusBadge status={proposal.status} />
            </div>
          </div>

          <div data-color-mode="light" style={{ padding: '24px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <MDEditor.Markdown source={proposal.content} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }} />
          </div>
        </Card>
      </div>
    </Layout>
  );
}
