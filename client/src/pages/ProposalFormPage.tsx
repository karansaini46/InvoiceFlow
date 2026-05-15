import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { proposalsApi } from "@/lib/api/proposals";
import { Page } from "@/pages/Page";
import type { CreateProposalData, UpdateProposalData } from "@/types/invoice";

const proposalSchema = z.object({
  clientEmail: z.string().email("Valid client email is required"),
  clientName: z.string().min(1, "Client name is required"),
  content: z.string().min(1, "Proposal content is required"),
  title: z.string().min(1, "Title is required"),
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
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      clientEmail: "",
      clientName: "",
      content: defaultContent,
      title: "",
    },
    resolver: zodResolver(proposalSchema),
  });

  useEffect(() => {
    if (!isEditing || !id) {
      return;
    }

    const loadProposal = async () => {
      try {
        setLoading(true);
        const proposal = await proposalsApi.getById(id);
        reset({
          clientEmail: proposal.clientEmail,
          clientName: proposal.clientName,
          content: proposal.content,
          title: proposal.title,
        });
        setError(null);
      } catch (err) {
        setError("Failed to load proposal");
        console.error("Error loading proposal:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadProposal();
  }, [id, isEditing, reset]);

  useEffect(
    () => () => {
      if (saveStateTimer.current !== null) {
        window.clearTimeout(saveStateTimer.current);
      }
    },
    [],
  );

  const showTransientState = (state: SaveState) => {
    setSaveState(state);
    if (saveStateTimer.current !== null) {
      window.clearTimeout(saveStateTimer.current);
    }
    saveStateTimer.current = window.setTimeout(() => setSaveState("idle"), 2000);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);
      setSaveState("loading");

      if (isEditing && id) {
        await proposalsApi.update(id, data as UpdateProposalData);
      } else {
        await proposalsApi.create(data as CreateProposalData);
      }

      showTransientState("success");
      navigate("/proposals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save proposal");
      showTransientState("error");
      console.error("Error saving proposal:", err);
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
        console.error("Error saving and sending proposal:", err);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading && isEditing) {
    return (
      <Page title="Edit Proposal">
        <div className="card space-y-4 p-5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      </Page>
    );
  }

  return (
    <Page title={isEditing ? "Edit Proposal" : "New Proposal"}>
      {error ? <div className="card error-state">⚠ {error}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <section className="card space-y-4 p-5">
          <h2 className="text-[14px] font-medium text-[var(--text-1)]">Proposal</h2>
          <div>
            <label className="label">Title</label>
            <input className="input" type="text" {...register("title")} />
            {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Client Name</label>
              <input className="input" type="text" {...register("clientName")} />
              {errors.clientName ? <p className="field-error">{errors.clientName.message}</p> : null}
            </div>
            <div>
              <label className="label">Client Email</label>
              <input className="input" type="email" {...register("clientEmail")} />
              {errors.clientEmail ? <p className="field-error">{errors.clientEmail.message}</p> : null}
            </div>
          </div>
        </section>

        <section className="card p-5" data-color-mode="dark">
          <label className="label">Content</label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <MDEditor
                height={320}
                preview="edit"
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
              />
            )}
          />
          {errors.content ? <p className="field-error">{errors.content.message}</p> : null}
        </section>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-0)] py-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => navigate("/proposals")} variant="ghost">
            Cancel
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button loading={saveState === "loading"} onClick={() => void handleSubmit(onSubmit)()} variant="secondary">
              {saveState === "success" ? "✓ Saved" : saveState === "error" ? "Failed" : "Save as draft"}
            </Button>
            <Button loading={saveState === "loading"} onClick={handleSaveAndSend}>
              {saveState === "success" ? "✓ Saved" : saveState === "error" ? "Failed" : "Save & Send"}
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
