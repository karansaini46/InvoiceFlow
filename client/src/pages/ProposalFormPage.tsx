import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/Button";
import { proposalsApi } from "@/lib/api/proposals";
import { Page } from "@/pages/Page";
import type { CreateProposalData, UpdateProposalData } from "@/types/invoice";

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  content: z.string().min(1, "Proposal content is required"),
});

type FormValues = z.infer<typeof proposalSchema>;

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
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      clientName: "",
      clientEmail: "",
      content: defaultContent,
    },
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
          title: proposal.title,
          clientName: proposal.clientName,
          clientEmail: proposal.clientEmail,
          content: proposal.content,
        });
        setError(null);
      } catch (err) {
        setError("Failed to load proposal");
        console.error("Error loading proposal:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProposal();
  }, [id, isEditing, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);

      if (isEditing && id) {
        await proposalsApi.update(id, data as UpdateProposalData);
      } else {
        await proposalsApi.create(data as CreateProposalData);
      }

      navigate("/proposals");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save proposal");
      console.error("Error saving proposal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndSend = () => {
    handleSubmit(async (data) => {
      try {
        setLoading(true);

        if (isEditing && id) {
          await proposalsApi.update(id, data as UpdateProposalData);
          await proposalsApi.send(id);
        } else {
          const proposal = await proposalsApi.create(data as CreateProposalData);
          await proposalsApi.send(proposal.id);
        }

        navigate("/proposals");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to save and send proposal");
        console.error("Error saving and sending proposal:", err);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading && isEditing) {
    return (
      <Page title="Edit Proposal" description="Update proposal details and terms.">
        <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-secondary)" }}>
          Loading proposal...
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={isEditing ? "Edit Proposal" : "Create Proposal"}
      description="Prepare project scope, pricing, and terms for a client."
    >
      {error && <div className="error-banner text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="glass-card p-6">
          <h2 className="section-heading">Proposal Details</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="field-label">
                Proposal Title *
              </label>
              <input
                type="text"
                {...register("title")}
                className="input-dark"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">
                Client Name *
              </label>
              <input
                type="text"
                {...register("clientName")}
                className="input-dark"
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.clientName.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">
                Client Email *
              </label>
              <input
                type="email"
                {...register("clientEmail")}
                className="input-dark"
              />
              {errors.clientEmail && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.clientEmail.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card p-6" data-color-mode="dark">
          <label className="section-heading block">
            Proposal Body *
          </label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <MDEditor
                height={500}
                preview="edit"
                value={field.value}
                onChange={(value) => field.onChange(value ?? "")}
              />
            )}
          />
          {errors.content && (
            <p className="mt-2 text-sm text-[#F87171]">{errors.content.message}</p>
          )}
        </section>

        <div className="flex flex-col justify-end gap-3 sm:flex-row">
          <Link to="/proposals">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} variant="secondary">
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button type="button" onClick={handleSaveAndSend} disabled={loading}>
            {loading ? "Saving..." : "Save and Send"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
