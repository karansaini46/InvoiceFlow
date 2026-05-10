import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { invoicesApi } from "@/lib/api/invoices";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { Page } from "@/pages/Page";
import type { Invoice } from "@/types/invoice";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error loading invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await invoicesApi.delete(id);
      setInvoices(invoices.filter(invoice => invoice.id !== id));
    } catch (err) {
      setError("Failed to delete invoice");
      console.error("Error deleting invoice:", err);
    }
  };

  const handleStatusUpdate = async (id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE") => {
    try {
      const updatedInvoice = await invoicesApi.updateStatus(id, status);
      setInvoices(invoices.map(invoice => 
        invoice.id === id ? updatedInvoice : invoice
      ));
    } catch (err) {
      setError("Failed to update invoice status");
      console.error("Error updating status:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Page title="Invoices" description="Review and manage invoice records.">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Invoices" description="Review and manage invoice records.">
      <div className="mb-6">
        <Link to="/invoices/new">
          <Button>Create New Invoice</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No invoices found</div>
          <Link to="/invoices/new">
            <Button>Create your first invoice</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </Link>
                    <Link
                      to={`/invoices/${invoice.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    {invoice.status === "DRAFT" && (
                      <button
                        onClick={() => handleStatusUpdate(invoice.id, "SENT")}
                        className="text-green-600 hover:text-green-900"
                      >
                        Send
                      </button>
                    )}
                    {invoice.status === "SENT" && (
                      <button
                        onClick={() => handleStatusUpdate(invoice.id, "PAID")}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
