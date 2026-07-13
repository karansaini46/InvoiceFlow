import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { proposalsApi } from "@/lib/api/proposals";
import type { CreateProposalData, UpdateProposalData } from "@/types/invoice";

const proposalSchema = z.object({
  clientEmail: z.string().email("Valid email required"),
  clientName: z.string().min(1, "Required"),
  content: z.string().min(1, "Content required"),
  title: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof proposalSchema>;
type SaveState = "idle" | "loading" | "success" | "error";

const defaultContent = [
  "## Scope of Work",
  "",
  "- Describe the project goals",
  "- List key deliverables",
  "- Define timelines and milestones",
  "",
  "## Pricing",
  "",
  "Add project pricing, payment milestones, and any assumptions.",
  "",
  "## Terms",
  "",
  "Add acceptance criteria, payment terms, and project conditions.",
].join("\n");

export function ProposalFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const saveStateTimer = useRef<number | null>(null);
  
  const { control, formState: { errors }, handleSubmit, register, reset } = useForm<FormValues>({
    defaultValues: { clientEmail: "", clientName: "", content: defaultContent, title: "" },
    resolver: zodResolver(proposalSchema),
  });

  useEffect(() => {
    if (!isEditing || !id) return;
    const loadProposal = async () => {
      try {
        setLoading(true);
        const proposal = await proposalsApi.getById(id);
        reset({ clientEmail: proposal.clientEmail, clientName: proposal.clientName, content: proposal.content, title: proposal.title });
        setError(null);
      } catch (err) {
        setError("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    };
    void loadProposal();
  }, [id, isEditing, reset]);

  const showTransientState = (state: SaveState) => {
    setSaveState(state);
    if (saveStateTimer.current) window.clearTimeout(saveStateTimer.current);
    saveStateTimer.current = window.setTimeout(() => setSaveState("idle"), 2000);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);
      setSaveState("loading");
      if (isEditing && id) await proposalsApi.update(id, data as UpdateProposalData);
      else await proposalsApi.create(data as CreateProposalData);
      showTransientState("success");
      navigate("/proposals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save proposal");
      showTransientState("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndSend = () => {
    handleSubmit(async (data) => {
      try {
        setLoading(true);
        setSaveState("loading");
        if (isEditing && id) {
          await proposalsApi.update(id, data as UpdateProposalData);
          await proposalsApi.send(id);
        } else {
          const proposal = await proposalsApi.create(data as CreateProposalData);
          await proposalsApi.send(proposal.id);
        }
        showTransientState("success");
        navigate("/proposals");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to save and send proposal");
        showTransientState("error");
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading && isEditing) {
    return (
      <Layout title="Edit Proposal">
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
          <Card style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>Loading...</Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditing ? "Edit Proposal" : "New Proposal"}>
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>{error}</div>}

      <form className="flex-col gap-6" style={{ display: 'flex' }} onSubmit={handleSubmit(onSubmit)}>
        
        <Card>
          <h3 className="text-h3 mb-4">Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Title" placeholder="Project Name" error={errors.title?.message} {...register("title")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" placeholder="Client Name" error={errors.clientName?.message} {...register("clientName")} />
            <Input label="Client Email" type="email" placeholder="client@example.com" error={errors.clientEmail?.message} {...register("clientEmail")} />
          </div>
        </Card>

        <Card data-color-mode="light" style={{ padding: '24px' }}>
          <div className="text-small font-medium text-muted uppercase tracking-wider mb-2">Content</div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <MDEditor
                  height={400}
                  preview="edit"
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? "")}
                  style={{ boxShadow: 'none', border: 'none', borderRadius: 0 }}
                />
              )}
            />
          </div>
          {errors.content && <span style={{ color: 'var(--error-text)', fontSize: '13px', marginTop: '4px' }}>{errors.content.message}</span>}
        </Card>

        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="button" variant="ghost" onClick={() => navigate("/proposals")}>Cancel</Button>
          <div className="flex gap-2">
            <Button type="submit" loading={saveState === "loading"} variant="secondary">
              {saveState === "success" ? "Saved" : saveState === "error" ? "Error" : "Save as draft"}
            </Button>
            <Button type="button" loading={saveState === "loading"} variant="primary" onClick={handleSaveAndSend}>
              {saveState === "success" ? "Saved" : saveState === "error" ? "Error" : "Save & Send"}
            </Button>
          </div>
        </Card>

      </form>
    </Layout>
  );
}
