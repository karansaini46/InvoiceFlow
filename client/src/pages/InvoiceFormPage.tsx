import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { invoicesApi } from "@/lib/api/invoices";
import { Button } from "@/components/Button";
import { Page } from "@/pages/Page";
import type { CreateInvoiceData, UpdateInvoiceData, Invoice } from "@/types/invoice";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientAddress: z.string().min(1, "Client address is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().default("USD"),
  notes: z.string().default(""),
  taxRate: z.number().min(0).max(100).default(0),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type FormValues = z.input<typeof invoiceSchema>;

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
];

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "USD",
      notes: "",
      taxRate: 0,
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems = watch("lineItems");
  const watchedTaxRate = watch("taxRate");

  useEffect(() => {
    if (isEditing && id) {
      loadInvoice(id);
    }
  }, [isEditing, id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const invoice = await invoicesApi.getById(invoiceId);
      
      setValue("clientName", invoice.clientName);
      setValue("clientEmail", invoice.clientEmail);
      setValue("clientAddress", invoice.clientAddress);
      setValue("issueDate", new Date(invoice.issueDate).toISOString().split('T')[0]);
      setValue("dueDate", new Date(invoice.dueDate).toISOString().split('T')[0]);
      setValue("currency", invoice.currency);
      setValue("notes", invoice.notes);
      setValue("taxRate", Number(invoice.taxRate));
      
      const lineItems = invoice.lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));
      setValue("lineItems", lineItems.length > 0 ? lineItems : [{ description: "", quantity: 1, unitPrice: 0 }]);
      
      setError(null);
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = watchedLineItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    );
    const taxAmount = subtotal * ((watchedTaxRate ?? 0) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const formatCurrency = (amount: number) => {
    const currency = currencies.find(c => c.code === watch("currency")) || currencies[0];
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: watch("currency"),
    }).format(amount);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);
      
      if (isEditing && id) {
        await invoicesApi.update(id, data as UpdateInvoiceData);
      } else {
        await invoicesApi.create(data as CreateInvoiceData);
      }
      
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save invoice");
      console.error("Error saving invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = () => {
    handleSubmit(onSubmit)();
  };

  const handleSaveAndSend = () => {
    handleSubmit(async (data) => {
      try {
        setLoading(true);

        if (isEditing && id) {
          await invoicesApi.update(id, data as UpdateInvoiceData);
          await invoicesApi.send(id);
        } else {
          const invoice = await invoicesApi.create(data as CreateInvoiceData);
          await invoicesApi.send(invoice.id);
        }
        navigate("/invoices");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to save and send invoice");
        console.error("Error saving and sending invoice:", err);
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading && isEditing) {
    return (
      <Page title="Invoice" description={isEditing ? "Edit Invoice." : "Create Invoice."}>
        <div className="flex justify-center items-center h-64">
          <div style={{ color: "var(--text-secondary)" }}>Loading invoice...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Invoice" description={isEditing ? "Edit Invoice." : "Create Invoice."}>
      {error && <div className="error-banner mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Client Information */}
        <div className="glass-card p-6">
          <h2 className="section-heading">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="md:col-span-2">
              <label className="field-label">
                Client Address *
              </label>
              <textarea
                {...register("clientAddress")}
                rows={3}
                className="input-dark"
              />
              {errors.clientAddress && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.clientAddress.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="glass-card p-6">
          <h2 className="section-heading">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="field-label">
                Issue Date *
              </label>
              <input
                type="date"
                {...register("issueDate")}
                className="input-dark"
              />
              {errors.issueDate && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.issueDate.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">
                Due Date *
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="input-dark"
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-[#F87171]">{errors.dueDate.message}</p>
              )}
            </div>
            <div>
              <label className="field-label">
                Currency
              </label>
              <select
                {...register("currency")}
                className="input-dark appearance-none"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Line Items
            </h2>
            <Button
              type="button"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
              variant="secondary"
            >
              Add Line Item
            </Button>
          </div>
          
          {errors.lineItems && (
            <p className="mb-4 text-sm text-[#F87171]">{errors.lineItems.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
                <div className="md:col-span-6">
                  <input
                    type="text"
                    placeholder="Description"
                    {...register(`lineItems.${index}.description`)}
                    className="input-dark"
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="mt-1 text-sm text-[#F87171]">
                      {errors.lineItems[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                    className="input-dark"
                  />
                  {errors.lineItems?.[index]?.quantity && (
                    <p className="mt-1 text-sm text-[#F87171]">
                      {errors.lineItems[index]?.quantity?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                    className="input-dark"
                  />
                  {errors.lineItems?.[index]?.unitPrice && (
                    <p className="mt-1 text-sm text-[#F87171]">
                      {errors.lineItems[index]?.unitPrice?.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 md:col-span-2">
                  <span className="text-sm font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(watchedLineItems[index]?.quantity * watchedLineItems[index]?.unitPrice || 0)}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg border border-[rgba(239,68,68,0.3)] px-2 py-1 text-[#F87171] transition hover:bg-[rgba(239,68,68,0.15)]"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax and Notes */}
        <div className="glass-card p-6">
          <h2 className="section-heading">Additional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="field-label">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("taxRate", { valueAsNumber: true })}
                className="input-dark"
              />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">
                Notes / Terms
              </label>
              <textarea
                {...register("notes")}
                rows={4}
                placeholder="Payment terms, notes, or any additional information..."
                className="input-dark"
              />
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="glass-card p-5 text-right">
          <h2 className="section-heading text-left">Invoice Total</h2>
          <div className="ml-auto max-w-sm space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
              <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>Tax ({watchedTaxRate}%):</span>
              <span className="font-medium tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <span>Total:</span>
              <span className="stat-number text-[var(--accent)]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={() => navigate("/invoices")}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={loading}
            variant="secondary"
          >
            {loading ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndSend}
            disabled={loading}
            className="sm:min-w-44"
          >
            {loading ? "Saving..." : "Save and Send"}
          </Button>
        </div>
      </form>
    </Page>
  );
}
