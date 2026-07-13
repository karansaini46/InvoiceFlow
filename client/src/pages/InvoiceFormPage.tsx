import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/Button";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { invoicesApi } from "@/lib/api/invoices";
import { downloadBlobAsFile, getInvoicePdfFilename, openInvoiceInGmail } from "@/lib/gmail";
import { StyledDateTimePicker } from "@/components/DateTimePicker";
import type { CreateInvoiceData, Invoice, UpdateInvoiceData } from "@/types/invoice";

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.number().positive("Must be > 0"),
  unitPrice: z.number().positive("Must be > 0"),
});

const invoiceSchema = z.object({
  clientAddress: z.string().min(1, "Required"),
  clientEmail: z.string().email("Valid email required"),
  clientName: z.string().min(1, "Required"),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Required"),
  issueDate: z.string().min(1, "Required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one item required"),
  notes: z.string().default(""),
  taxRate: z.number().min(0).max(100).default(0),
  scheduleSend: z.boolean().default(false),
  scheduledSendAt: z.string().optional(),
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
      scheduleSend: false,
      scheduledSendAt: "",
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
    if (!isEditing || !id) return;
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const invoice = await invoicesApi.getById(id);
        setValue("clientName", invoice.clientName);
        setValue("clientEmail", invoice.clientEmail);
        setValue("clientAddress", invoice.clientAddress);
        setValue("issueDate", toDateInput(new Date(invoice.issueDate)));
        setValue("dueDate", toDateInput(new Date(invoice.dueDate)));
        setValue("currency", invoice.currency);
        setValue("notes", invoice.notes);
        setValue("taxRate", Number(invoice.taxRate));
        setValue("scheduleSend", Boolean(invoice.scheduledSendAt));
        setValue("scheduledSendAt", invoice.scheduledSendAt ? toDateInput(new Date(invoice.scheduledSendAt)) + "T" + new Date(invoice.scheduledSendAt).toTimeString().slice(0,5) : "");
        setValue(
          "lineItems",
          invoice.lineItems.length
            ? invoice.lineItems.map((item) => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
              }))
            : [{ description: "", quantity: 1, unitPrice: 0 }]
        );
        isDueDateTouched.current = true;
      } catch (err) {
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    void loadInvoice();
  }, [id, isEditing, setValue]);

  useEffect(() => {
    if (!issueDate || isDueDateTouched.current) return;
    setValue("dueDate", addDays(issueDate, 30));
  }, [issueDate, setValue]);

  const subtotal = watchedLineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = subtotal * ((watchedTaxRate ?? 0) / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { currency: values.currency, style: "currency" }).format(amount);

  const showTransientState = (state: SaveState) => {
    setSaveState(state);
    if (saveStateTimer.current) window.clearTimeout(saveStateTimer.current);
    saveStateTimer.current = window.setTimeout(() => setSaveState("idle"), 2000);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      setLoading(true);
      setSaveState("loading");
      let invoice: Invoice;
      if (isEditing && id) {
        invoice = await invoicesApi.update(id, data as UpdateInvoiceData);
      } else {
        invoice = await invoicesApi.create(data as CreateInvoiceData);
      }

      if (data.scheduleSend && data.scheduledSendAt) {
        await invoicesApi.schedule(invoice.id, new Date(data.scheduledSendAt).toISOString());
      } else if (!data.scheduleSend && invoice.scheduledSendAt) {
        await invoicesApi.cancelSchedule(invoice.id);
      }
      showTransientState("success");
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save invoice");
      showTransientState("error");
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
        if (data.scheduleSend && data.scheduledSendAt) {
          await invoicesApi.schedule(invoice.id, new Date(data.scheduledSendAt).toISOString());
        }
        openInvoiceInGmail(invoice);
        const blob = await invoicesApi.downloadPdf(invoice.id);
        downloadBlobAsFile(blob, getInvoicePdfFilename(invoice.number));
        showTransientState("success");
        navigate("/invoices");
      } catch (err: any) {
        setError("Failed to save and prepare invoice for Gmail");
        showTransientState("error");
      } finally {
        setLoading(false);
      }
    })();
  };

  const appendItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0 });
  };

  const applySchedulePreset = (preset: '1h' | 'tomorrow' | 'monday' | 'issueDate') => {
    const d = new Date();
    if (preset === '1h') {
      d.setHours(d.getHours() + 1);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'monday') {
      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'issueDate') {
      const [year, month, day] = issueDate.split('-');
      const iDate = new Date(Number(year), Number(month) - 1, Number(day));
      iDate.setHours(9, 0, 0, 0);
      d.setTime(iDate.getTime());
    }
    
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setValue("scheduledSendAt", localStr, { shouldValidate: true });
  };

  return (
    <Layout title={isEditing ? "Edit Invoice" : "New Invoice"}>
      {error && <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>{error}</div>}

      <form className="flex gap-8" style={{ alignItems: 'flex-start' }} onSubmit={handleSubmit(onSubmit)}>
        
        <div className="flex-col gap-6" style={{ flex: 1 }}>
          <Card style={{ padding: '32px' }}>
            <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Client</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Name" placeholder="Client Name" error={errors.clientName?.message} {...register("clientName")} />
              <Input label="Email" type="email" placeholder="client@example.com" error={errors.clientEmail?.message} {...register("clientEmail")} />
            </div>
            <div className="mb-2">
               <label className="text-small font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Address</label>
               <textarea 
                  className="w-full"
                  style={{ minHeight: '80px', padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none', transition: 'border-color 0.15s ease' }}
                  {...register("clientAddress")}
                />
               {errors.clientAddress && <span style={{ color: 'var(--error-text)', fontSize: '13px', marginTop: '4px' }}>{errors.clientAddress.message}</span>}
            </div>
          </Card>

          <Card style={{ padding: '32px' }}>
            <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Details</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Input label="Issue Date" type="date" error={errors.issueDate?.message} {...register("issueDate")} />
              <div>
                <Input label="Due Date" type="date" error={errors.dueDate?.message} {...dueDateField} onChange={(e) => { isDueDateTouched.current = true; dueDateField.onChange(e); }} />
                <div className="flex gap-2 mt-2">
                  {[15, 30, 60].map(days => (
                    <button key={days} type="button" className="text-small text-muted hover:text-primary" onClick={() => { isDueDateTouched.current = true; setValue("dueDate", addDays(issueDate, days)); }}>Net {days}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-small font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Currency</label>
                <select 
                  style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }}
                  {...register("currency")}
                >
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card style={{ padding: '32px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-h2 font-display" style={{ fontSize: '24px', margin: 0 }}>Line Items</h3>
              <Button type="button" variant="secondary" className="font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px', height: '32px', padding: '0 16px' }} onClick={appendItem}>Add Item</Button>
            </div>
            
            <div className="flex-col gap-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <div style={{ flex: 1 }}>
                     <Input placeholder="Description" error={errors.lineItems?.[index]?.description?.message} {...register(`lineItems.${index}.description`)} />
                  </div>
                  <div style={{ width: '100px' }}>
                    <Input type="number" step="1" placeholder="Qty" error={errors.lineItems?.[index]?.quantity?.message} {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div style={{ width: '120px' }}>
                     <Input type="number" step="0.01" placeholder="Price" error={errors.lineItems?.[index]?.unitPrice?.message} {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                  <div className="font-mono text-small" style={{ width: '100px', textAlign: 'right', paddingTop: '10px', color: 'var(--text-secondary)' }}>
                    {formatCurrency((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.unitPrice || 0))}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm text-error" disabled={fields.length === 1} onClick={() => remove(index)} style={{ padding: '0 8px', marginTop: '4px' }}>×</button>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: '32px' }}>
            <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Additional</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Tax Rate (%)" type="number" step="0.01" error={errors.taxRate?.message} {...register("taxRate", { valueAsNumber: true })} />
            </div>
            <div>
               <label className="text-small font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Notes / Terms</label>
               <textarea 
                  className="w-full"
                  placeholder="Payment terms, notes, or additional information..."
                  style={{ minHeight: '80px', padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }}
                  {...register("notes")}
                />
            </div>
          </Card>

          <Card style={{ padding: '32px' }}>
            <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Automation</h3>
            <div className="flex items-center mb-4">
              <input type="checkbox" id="scheduleSend" {...register("scheduleSend")} style={{ width: '16px', height: '16px', marginRight: '10px' }} />
              <label htmlFor="scheduleSend" className="text-small font-medium cursor-pointer">Schedule invoice to be sent automatically</label>
            </div>
            {watch("scheduleSend") && (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-small font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Date</label>
                    <StyledDateTimePicker 
                      type="date"
                      value={watch("scheduledSendAt") ? watch("scheduledSendAt")!.split("T")[0] : ""} 
                      onChange={(newDate) => {
                        const current = watch("scheduledSendAt") || "";
                        const time = current.includes("T") ? current.split("T")[1] : "09:00";
                        setValue("scheduledSendAt", `${newDate}T${time}`, { shouldValidate: true });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="text-small font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Time</label>
                    <StyledDateTimePicker
                      type="time"
                      value={watch("scheduledSendAt") ? watch("scheduledSendAt")!.split("T")[1] : "09:00"}
                      onChange={(newTime) => {
                        const current = watch("scheduledSendAt") || "";
                        const date = current.includes("T") ? current.split("T")[0] : toDateInput(new Date());
                        setValue("scheduledSendAt", `${date}T${newTime}`, { shouldValidate: true });
                      }}
                    />
                  </div>
                </div>
                {errors.scheduledSendAt && <div style={{ color: 'var(--error-text)', fontSize: '13px', marginTop: '4px' }}>{errors.scheduledSendAt.message}</div>}
                
                <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                  <Button type="button" variant="secondary" onClick={() => applySchedulePreset('1h')} className="font-mono" style={{ textTransform: 'uppercase', fontSize: '11px', padding: '0 12px', height: '28px' }}>In 1 Hour</Button>
                  <Button type="button" variant="secondary" onClick={() => applySchedulePreset('tomorrow')} className="font-mono" style={{ textTransform: 'uppercase', fontSize: '11px', padding: '0 12px', height: '28px' }}>Tomorrow 9 AM</Button>
                  <Button type="button" variant="secondary" onClick={() => applySchedulePreset('monday')} className="font-mono" style={{ textTransform: 'uppercase', fontSize: '11px', padding: '0 12px', height: '28px' }}>Next Monday 9 AM</Button>
                  <Button type="button" variant="secondary" onClick={() => applySchedulePreset('issueDate')} className="font-mono" style={{ textTransform: 'uppercase', fontSize: '11px', padding: '0 12px', height: '28px' }}>On Issue Date</Button>
                </div>

                <p className="text-small text-muted mt-3">The invoice will be emailed to the client automatically at this time.</p>
              </div>
            )}
          </Card>

        </div>

        <div style={{ width: '380px' }}>
          <Card style={{ position: 'sticky', top: '88px', padding: '32px' }}>
            <h3 className="text-h2 font-display mb-6 flex items-center justify-between" style={{ fontSize: '20px' }}>
              Preview
              <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-primary)', borderRadius: '50%' }} />
            </h3>
            
            <div className="mb-6">
              <div className="font-medium">{values.clientName || "—"}</div>
              <div className="text-small text-muted">{values.clientEmail || "No email"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-small pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="text-muted mb-1">Issue Date</div>
                <div>{values.issueDate || "—"}</div>
              </div>
              <div>
                <div className="text-muted mb-1">Due Date</div>
                <div>{values.dueDate || "—"}</div>
              </div>
            </div>

            <div className="flex-col gap-3 mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {watchedLineItems.map((item, index) => (
                <div key={index} className="flex justify-between text-small">
                  <span className="text-muted" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description || "Untitled item"}</span>
                  <span className="font-mono">{formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}</span>
                </div>
              ))}
            </div>

            <div className="flex-col gap-2 text-small mb-8">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Tax</span>
                <span className="font-mono">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 text-body">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex-col gap-3 mt-4">
              <Button loading={saveState === "loading"} className="w-full font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} type="submit" variant="primary">
                {saveState === "success" ? "Saved" : saveState === "error" ? "Error" : watch("scheduleSend") ? "Save & Schedule" : "Save as draft"}
              </Button>
              {!watch("scheduleSend") && (
                <Button loading={saveState === "loading"} className="w-full font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} type="button" variant="secondary" onClick={handleSaveAndOpenGmail}>
                  Save & Open Gmail
                </Button>
              )}
              <Button type="button" variant="ghost" className="w-full font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/invoices")}>Cancel</Button>
            </div>
          </Card>
        </div>

      </form>
    </Layout>
  );
}
