import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { TopLoadingBar, useLoadingBar } from "@/components/TopLoadingBar";
import { invoicesApi } from "@/lib/api/invoices";
import {
  downloadBlobAsFile,
  getInvoicePdfFilename,
  openInvoiceInGmail,
} from "@/lib/gmail";
import { Page } from "@/pages/Page";
import type { CreateInvoiceData, Invoice, UpdateInvoiceData } from "@/types/invoice";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

const invoiceSchema = z.object({
  clientAddress: z.string().min(1, "Client address is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientName: z.string().min(1, "Client name is required"),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().default(""),
  taxRate: z.number().min(0).max(100).default(0),
});

type FormValues = z.input<typeof invoiceSchema>;
type SaveState = "idle" | "loading" | "success" | "error";

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
];

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const addDays = (dateString: string, days: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

export function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const isDueDateTouched = useRef(false);
  const saveStateTimer = useRef<number | null>(null);
  const {
    active: loadingBarActive,
    complete: loadingBarComplete,
    done: finishLoadingBar,
    start: startLoadingBar,
  } = useLoadingBar();

  const {
    formState: { errors },
    handleSubmit,
    register,
    control,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      clientAddress: "",
      clientEmail: "",
      clientName: "",
      currency: "USD",
      dueDate: toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      issueDate: toDateInput(new Date()),
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "",
      taxRate: 0,
    },
    resolver: zodResolver(invoiceSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const values = watch();
  const issueDate = values.issueDate;
  const watchedLineItems = values.lineItems;
  const watchedTaxRate = values.taxRate;
  const dueDateField = register("dueDate");

  useEffect(() => {
    if (!isEditing || !id) {
      return;
    }

    const loadInvoice = async () => {
      try {
        setLoading(true);
        startLoadingBar();
        const invoice = await invoicesApi.getById(id);

        setValue("clientName", invoice.clientName);
        setValue("clientEmail", invoice.clientEmail);
        setValue("clientAddress", invoice.clientAddress);
        setValue("issueDate", toDateInput(new Date(invoice.issueDate)));
        setValue("dueDate", toDateInput(new Date(invoice.dueDate)));
        setValue("currency", invoice.currency);
        setValue("notes", invoice.notes);
        setValue("taxRate", Number(invoice.taxRate));
        setValue(
          "lineItems",
          invoice.lineItems.length
            ? invoice.lineItems.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
              }))
            : [{ description: "", quantity: 1, unitPrice: 0 }],
        );
        isDueDateTouched.current = true;
        setError(null);
      } catch (err) {
        setError("Failed to load invoice");
        console.error("Error loading invoice:", err);
      } finally {
        setLoading(false);
        finishLoadingBar();
      }
    };

    void loadInvoice();
  }, [finishLoadingBar, id, isEditing, setValue, startLoadingBar]);

  useEffect(() => {
    if (!issueDate || isDueDateTouched.current) {
      return;
    }

    setValue("dueDate", addDays(issueDate, 30));
  }, [issueDate, setValue]);

  useEffect(
    () => () => {
      if (saveStateTimer.current !== null) {
        window.clearTimeout(saveStateTimer.current);
      }
    },
    [],
  );

  const subtotal = watchedLineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const taxAmount = subtotal * ((watchedTaxRate ?? 0) / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      currency: values.currency,
      style: "currency",
    }).format(amount);

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
        await invoicesApi.update(id, data as UpdateInvoiceData);
      } else {
        await invoicesApi.create(data as CreateInvoiceData);
      }

      showTransientState("success");
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save invoice");
      showTransientState("error");
      console.error("Error saving invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndOpenGmail = () => {
    handleSubmit(async (data) => {
      try {
        setLoading(true);
        setSaveState("loading");

        let invoice: Invoice;

        if (isEditing && id) {
          invoice = await invoicesApi.update(id, data as UpdateInvoiceData);
        } else {
          invoice = await invoicesApi.create(data as CreateInvoiceData);
        }

        openInvoiceInGmail(invoice);
        const blob = await invoicesApi.downloadPdf(invoice.id);
        downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
        showTransientState("success");
        navigate("/invoices");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to save and prepare invoice for Gmail");
        showTransientState("error");
        console.error("Error saving and preparing invoice for Gmail:", err);
      } finally {
        setLoading(false);
      }
    })();
  };

  const appendItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0 });
    window.requestAnimationFrame(() => {
      document.getElementById(`line-item-description-${fields.length}`)?.focus();
    });
  };

  if (loading && isEditing) {
    return (
      <Page title="Edit Invoice">
        <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />
        <div className="card space-y-4 p-5">
          <div className="skeleton h-4 w-24" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="skeleton h-9 w-full" />
            <div className="skeleton h-9 w-full" />
          </div>
          <div className="skeleton h-24 w-full" />
        </div>
      </Page>
    );
  }

  return (
    <Page title={isEditing ? "Edit Invoice" : "New Invoice"}>
      <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />

      {error ? <div className="card error-state">⚠ {error}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <section className="card space-y-4 p-5">
              <h2 className="text-[14px] font-medium text-[var(--text-1)]">Client</h2>
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
              <div>
                <label className="label">Client Address</label>
                <textarea className="input" rows={3} {...register("clientAddress")} />
                {errors.clientAddress ? <p className="field-error">{errors.clientAddress.message}</p> : null}
              </div>
            </section>

            <section className="card space-y-4 p-5">
              <h2 className="text-[14px] font-medium text-[var(--text-1)]">Invoice</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="label">Issue Date</label>
                  <input className="input" type="date" {...register("issueDate")} />
                  {errors.issueDate ? <p className="field-error">{errors.issueDate.message}</p> : null}
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input
                    className="input"
                    type="date"
                    {...dueDateField}
                    onChange={(event) => {
                      isDueDateTouched.current = true;
                      void dueDateField.onChange(event);
                    }}
                  />
                  {errors.dueDate ? <p className="field-error">{errors.dueDate.message}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {[15, 30, 60].map((days) => (
                      <button
                        className="btn btn-ghost btn-sm"
                        key={days}
                        onClick={() => {
                          isDueDateTouched.current = true;
                          setValue("dueDate", addDays(issueDate, days));
                        }}
                        type="button"
                      >
                        Net {days}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" {...register("currency")}>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="card space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-medium text-[var(--text-1)]">Items</h2>
                <button className="btn btn-secondary btn-sm" onClick={appendItem} type="button">
                  Add item
                </button>
              </div>

              {errors.lineItems ? <p className="field-error">{errors.lineItems.message}</p> : null}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    className="grid gap-2 md:grid-cols-[1fr_80px_100px_80px_32px] md:items-start"
                    key={field.id}
                  >
                    <div>
                      <input
                        className="input"
                        id={`line-item-description-${index}`}
                        placeholder="Description"
                        type="text"
                        {...register(`lineItems.${index}.description`)}
                      />
                      {errors.lineItems?.[index]?.description ? (
                        <p className="field-error">{errors.lineItems[index]?.description?.message}</p>
                      ) : null}
                    </div>
                    <div>
                      <input
                        className="input"
                        placeholder="Qty"
                        step="0.01"
                        type="number"
                        {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                      />
                      {errors.lineItems?.[index]?.quantity ? (
                        <p className="field-error">{errors.lineItems[index]?.quantity?.message}</p>
                      ) : null}
                    </div>
                    <div>
                      <input
                        className="input"
                        onKeyDown={(event) => {
                          if (event.key === "Tab" && !event.shiftKey && index === fields.length - 1) {
                            event.preventDefault();
                            appendItem();
                          }
                        }}
                        placeholder="Unit price"
                        step="0.01"
                        type="number"
                        {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                      {errors.lineItems?.[index]?.unitPrice ? (
                        <p className="field-error">{errors.lineItems[index]?.unitPrice?.message}</p>
                      ) : null}
                    </div>
                    <div className="mono flex h-9 items-center justify-end text-right text-[var(--accent)]">
                      {formatCurrency(
                        (watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.unitPrice || 0),
                      )}
                    </div>
                    <button
                      aria-label="Remove item"
                      className="btn btn-ghost btn-sm h-9 px-0 text-[var(--red)]"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="card space-y-4 p-5">
              <h2 className="text-[14px] font-medium text-[var(--text-1)]">Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input
                    className="input"
                    max="100"
                    min="0"
                    step="0.01"
                    type="number"
                    {...register("taxRate", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Notes / Terms</label>
                <textarea
                  className="input"
                  placeholder="Payment terms, notes, or additional information..."
                  rows={4}
                  {...register("notes")}
                />
              </div>
            </section>
          </div>

          <aside className="card self-start p-5 xl:sticky xl:top-24">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-3)]">Preview</span>
              <span
                className="inline-block h-[5px] w-[5px] rounded-full bg-[var(--accent)]"
                style={{ animation: "pulse 2s ease infinite" }}
              />
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-2)]">{values.clientName || "—"}</p>
                <p className="mt-1 text-xs text-[var(--text-3)]">{values.clientEmail || "No email yet"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[var(--text-3)]">Issue</p>
                  <p className="mt-1 text-[var(--text-2)]">{values.issueDate || "—"}</p>
                </div>
                <div>
                  <p className="text-[var(--text-3)]">Due</p>
                  <p className="mt-1 text-[var(--text-2)]">{values.dueDate || "—"}</p>
                </div>
              </div>

              <div className="space-y-2">
                {watchedLineItems.map((item, index) => (
                  <div className="flex items-center justify-between gap-3 text-xs" key={fields[index]?.id ?? index}>
                    <span className="truncate text-[var(--text-2)]">{item.description || "Untitled item"}</span>
                    <span className="mono text-[var(--text-1)]">
                      {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-2)]">Subtotal</span>
                  <span className="mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-2)]">Tax</span>
                  <span className="mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[var(--text-1)]">
                  <span>Total</span>
                  <span className="mono">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--bg-0)] py-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => navigate("/invoices")} variant="ghost">
            Cancel
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              loading={saveState === "loading"}
              onClick={() => void handleSubmit(onSubmit)()}
              variant="secondary"
            >
              {saveState === "success" ? "✓ Saved" : saveState === "error" ? "Failed" : "Save as draft"}
            </Button>
            <Button loading={saveState === "loading"} onClick={handleSaveAndOpenGmail}>
              {saveState === "success" ? "✓ Saved" : saveState === "error" ? "Failed" : "Save & Open Gmail"}
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
