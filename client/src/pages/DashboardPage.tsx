import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { useCashFlowInsights } from "@/hooks/useAI";
import { dashboardApi, type DashboardStats } from "@/lib/api/dashboard";
import { invoicesApi } from "@/lib/api/invoices";

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { currency, maximumFractionDigits: 0, style: "currency" }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));

export function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const { data: cashFlowInsights, fetch: fetchCashFlowInsights } = useCashFlowInsights();

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getStats();
        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Dashboard stats could not be loaded.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadStats();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    fetchCashFlowInsights().catch(console.error);
  }, [fetchCashFlowInsights]);

  const handleDownloadPdf = async (invoiceId: string, number: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingInvoiceId(invoiceId);
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const invoiceColumns: any[] = [
    { header: "Invoice", accessor: (row: any) => <span className="font-mono" style={{ color: 'var(--accent-selected)' }}>{row.number}</span> },
    { header: "Client", accessor: (row: any) => <span style={{ fontWeight: 500 }}>{row.client}</span> },
    { header: "Amount", accessor: (row: any) => <span className="font-mono">{formatCurrency(row.amount, row.currency)}</span> },
    { header: "Status", accessor: (row: any) => <StatusBadge status={row.status} /> },
    { header: "Date", accessor: (row: any) => <span className="font-mono text-small text-muted">{formatDate(row.date)}</span> },
    { 
      header: "", 
      accessor: (row: any) => (
        <button 
          className="btn btn-ghost btn-sm font-mono text-small" 
          disabled={downloadingInvoiceId === row.id}
          onClick={(e) => handleDownloadPdf(row.id, row.number, e)}
        >
          {downloadingInvoiceId === row.id ? "..." : "DL_PDF"}
        </button>
      ) 
    },
  ];

  return (
    <Layout title="System Overview">
      {error && (
        <div className="mb-6" style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(198, 80, 75, 0.2)' }}>
          {error}
        </div>
      )}

      {/* Action Row */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <div className="mono-label" style={{ color: 'var(--accent-primary)', marginBottom: '12px', fontSize: '11px' }}>FINANCIAL TELEMETRY</div>
           <h2 className="text-h1 font-display" style={{ fontSize: '36px', letterSpacing: '-0.02em', margin: 0 }}>Metrics</h2>
        </div>
        <div className="flex gap-4">
          <Link to="/proposals/new" className="btn btn-secondary font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 24px', height: '40px', fontSize: '12px' }}>New Proposal</Link>
          <Link to="/invoices/new" className="btn btn-primary font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 24px', height: '40px', fontSize: '12px' }}>Create Invoice</Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
        {[
          { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), color: 'var(--text-primary)' },
          { label: "Outstanding", value: formatCurrency(stats?.outstanding ?? 0), color: 'var(--accent-selected)' },
          { label: "Overdue", value: formatCurrency(stats?.overdue ?? 0), color: (stats?.overdue ?? 0) > 0 ? 'var(--error-text)' : 'var(--text-primary)' },
          { label: "Drafts", value: stats?.draftCount ?? 0, color: 'var(--text-primary)' }
        ].map((metric, i) => (
          <div key={i} className="technical-panel" style={{ padding: '32px', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '2px', background: i === 1 ? 'var(--accent-selected)' : i === 2 && (stats?.overdue ?? 0) > 0 ? 'var(--error-text)' : 'var(--border-strong)' }}></div>
            <div className="mono-label" style={{ marginBottom: '16px', fontSize: '11px' }}>{metric.label}</div>
            <div className="font-mono" style={{ fontSize: '36px', color: metric.color, fontWeight: 500, letterSpacing: '-0.02em', marginTop: '8px' }}>
              {loading ? "..." : metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div className="col-span-2">
          <Card style={{ height: '100%', padding: '40px' }}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-h2 font-display" style={{ fontSize: '24px', margin: 0 }}>Revenue Pipeline</h3>
              <span className="mono-label" style={{ fontSize: '11px' }}>T-Minus 6 Mo</span>
            </div>
            <div style={{ height: 320 }}>
              {loading ? (
                <div className="flex items-center justify-center h-full font-mono text-small text-muted">LOADING DATA_STREAM...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.monthlyRevenue ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-strong)" vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)' }} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(236, 233, 225, 0.05)' }} 
                      contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '12px' }} 
                      formatter={(value: any) => [formatCurrency(value as number), "Revenue"]}
                    />
                    <Bar dataKey="total" fill="var(--accent-selected)" radius={[2, 2, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
        
        <div className="col-span-1">
          <Card style={{ height: '100%', backgroundColor: 'rgba(23, 23, 21, 0.5)', padding: '40px', borderColor: 'var(--border-strong)' }}>
            <div className="flex items-center gap-8 mb-8">
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-selected)' }} className="animate-pulse-slow"></div>
               <h3 className="text-h2 font-display" style={{ margin: 0, fontSize: '24px' }}>AI Forecast</h3>
            </div>
            
            {cashFlowInsights ? (
              <div className="flex-col gap-4">
                <div style={{ padding: '32px', border: '1px solid var(--border-strong)', borderRadius: '6px', backgroundColor: 'var(--bg-base)', marginBottom: '32px' }}>
                  <div className="mono-label" style={{ marginBottom: '12px', fontSize: '11px' }}>Projected +30D Revenue</div>
                  <div className="font-mono" style={{ fontSize: '32px', color: 'var(--accent-primary)', fontWeight: 500, letterSpacing: '-0.02em' }}>{formatCurrency(cashFlowInsights.predicted_revenue_30d)}</div>
                </div>
                <div>
                  <p className="text-body mb-6" style={{ lineHeight: 1.6 }}>{cashFlowInsights.summary}</p>
                  <ul className="flex-col gap-4" style={{ display: 'flex' }}>
                    {cashFlowInsights.insights.map((insight, i) => (
                      <li key={i} className="text-small" style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--accent-selected)', marginTop: '2px' }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span> 
                        <span style={{ lineHeight: 1.5 }}>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="font-mono text-small text-muted flex items-center gap-8 mt-8">
                 <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>
                 Processing historical data...
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '32px 40px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-h2 font-display" style={{ fontSize: '24px', margin: 0 }}>Recent Invoices</h3>
          <Link to="/invoices" className="btn btn-ghost font-mono" style={{ textTransform: 'uppercase', fontSize: '12px', padding: '0 16px', height: '32px', letterSpacing: '0.05em' }}>View Ledger</Link>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
           <Table 
             data={stats?.recentInvoices ?? []} 
             columns={invoiceColumns} 
             onRowClick={(row) => navigate(`/invoices/${row.id}`)}
           />
        </div>
      </Card>
    </Layout>
  );
}
