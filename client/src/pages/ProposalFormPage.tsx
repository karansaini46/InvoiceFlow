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
        <div className="flex h-64 items-center justify-center text-gray-500">
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
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Proposal Title *
              </label>
              <input
                type="text"
                {...register("title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Client Name *
              </label>
              <input
                type="text"
                {...register("clientName")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Client Email *
              </label>
              <input
                type="email"
                {...register("clientEmail")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.clientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.clientEmail.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm" data-color-mode="light">
          <label className="mb-3 block text-sm font-medium text-gray-700">
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
            <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>
          )}
        </section>

        <div className="flex justify-end gap-4">
          <Link to="/proposals">
            <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
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
