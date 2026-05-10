import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { invoicesApi } from "@/lib/api/invoices";
import { Page } from "@/pages/Page";
import type { Invoice } from "@/types/invoice";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invoice not found");
      setLoading(false);
      return;
    }

    loadInvoice(id);
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await invoicesApi.getById(invoiceId);
      setInvoice(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoice");
      console.error("Error loading invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(amount);
  };

  const handleDownloadPdf = async () => {
    if (!invoice) {
      return;
    }

    try {
      setDownloadLoading(true);
      const blob = await invoicesApi.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download invoice PDF");
      console.error("Error downloading invoice PDF:", err);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Invoice Detail" description="View invoice status and line items.">
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </Page>
    );
  }

  if (!invoice) {
    return (
      <Page title="Invoice Detail" description="View invoice status and line items.">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error ?? "Invoice not found"}
        </div>
        <Link to="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
          Back to invoices
        </Link>
      </Page>
    );
  }

  return (
    <Page title={invoice.number} description="View invoice status and line items.">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
          Back to invoices
        </Link>
        <div className="flex flex-wrap gap-3">
          <Link to={`/invoices/${invoice.id}/edit`}>
            <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300">Edit Invoice</Button>
          </Link>
          <Button onClick={handleDownloadPdf} disabled={downloadLoading}>
            {downloadLoading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{invoice.clientName}</h2>
              <p className="mt-1 text-sm text-gray-500">{invoice.clientEmail}</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                {invoice.clientAddress}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid gap-4 border-t border-gray-200 pt-6 sm:grid-cols-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Issue date
              </div>
              <div className="mt-1 font-medium text-gray-900">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Due date
              </div>
              <div className="mt-1 font-medium text-gray-900">{formatDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Currency
              </div>
              <div className="mt-1 font-medium text-gray-900">{invoice.currency}</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Total</h2>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
              <span className="font-medium">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="max-w-md px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {invoice.notes && (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Notes / Terms</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
            {invoice.notes}
          </p>
        </section>
      )}
    </Page>
  );
}
