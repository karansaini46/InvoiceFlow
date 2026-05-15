import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import { PlanBadge } from "@/components/PlanBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { TopLoadingBar, useLoadingBar } from "@/components/TopLoadingBar";
import { dashboardApi, type DashboardStats } from "@/lib/api/dashboard";
import { invoicesApi } from "@/lib/api/invoices";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

type IconProps = {
  className?: string;
};

const navigation = [
  { href: "/dashboard", icon: "M4 19V5M4 19H20M8 16V11M12 16V8M16 16V13", label: "Dashboard" },
  {
    href: "/invoices",
    icon: "M7 3H15L19 7V21H7a2 2 0 01-2-2V5a2 2 0 012-2zm7 0v5h5M9 13h6M9 17h4",
    label: "Invoices",
  },
  {
    href: "/proposals",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    label: "Proposals",
  },
  { href: "/settings", icon: "M10.3 5A7 7 0 1019 13.7M12 8v4l2 2", label: "Settings" },
  { href: "/upgrade", icon: "M5 10l7-7 7 7M12 3v14", label: "Upgrade" },
];

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d={d}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function RevenueIcon({ className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3V21M17 7.5C16.089 6.561 14.717 6 13 6H10.5C8.567 6 7 7.343 7 9C7 10.657 8.567 12 10.5 12H13.5C15.433 12 17 13.343 17 15C17 16.657 15.433 18 13.5 18H11C9.283 18 7.911 17.439 7 16.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 6V12L16 14M21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 8V12M12 16H12.01M10.29 3.86L2.82 17C2.06 18.333 3.023 20 4.557 20H19.443C20.977 20 21.94 18.333 21.18 17L13.71 3.86C12.943 2.511 11.057 2.511 10.29 3.86Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DraftIcon({ className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M5 4H19V20H5V4ZM8 8H16M8 12H16M8 16H12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DownloadIcon({ className = "" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4V14M8 10L12 14L16 10M5 20H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }

    let start: number | undefined;
    let frame = 0;

    const tick = (timestamp: number) => {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - progress, 3)) * target));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

function getInitials(value?: string) {
  return (
    value
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function Skeleton({ height, width }: { height: number; width: string }) {
  return <div className="skeleton" style={{ height, width }} />;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const {
    active: loadingBarActive,
    complete: loadingBarComplete,
    done: finishLoadingBar,
    start: startLoadingBar,
  } = useLoadingBar();

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        startLoadingBar();
        const data = await dashboardApi.getStats();

        if (mounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Dashboard stats could not be loaded.");
        }
        console.error("Error loading dashboard stats:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          finishLoadingBar();
        }
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, [finishLoadingBar, startLoadingBar]);

  const initials = useMemo(() => getInitials(user?.name || user?.email), [user]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const revenue = useCountUp(stats?.totalRevenue ?? 0);
  const outstanding = useCountUp(stats?.outstanding ?? 0);
  const overdue = useCountUp(stats?.overdue ?? 0);
  const drafts = useCountUp(stats?.draftCount ?? 0);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const handleDownloadPdf = async (invoiceId: string, number: string) => {
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

  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      <TopLoadingBar active={loadingBarActive} complete={loadingBarComplete} />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col border-r border-[var(--border)] bg-[var(--bg-1)] lg:flex">
        <Link className="flex items-center gap-3 px-4 py-5" to="/dashboard">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
            IF
          </span>
          <span className="text-[15px] font-semibold text-[var(--text-1)]">InvoiceFlow</span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              key={item.href}
              to={item.href}
            >
              <Icon className="h-[15px] w-[15px]" d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="mono flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-3)] text-xs text-[var(--text-2)]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[var(--text-1)]">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-[var(--text-2)]">{user?.email}</p>
            </div>
          </div>
          <button
            className="mt-3 text-[12px] text-[var(--text-3)] transition-colors hover:text-[var(--red)]"
            onClick={handleLogout}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-10 hidden h-[52px] items-center justify-between border-b border-[var(--border)] bg-[rgba(8,9,12,0.9)] px-6 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-[var(--text-3)]">InvoiceFlow</span>
            <span className="text-[var(--text-3)]">/</span>
            <span className="text-[var(--text-2)]">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-3)] text-xs text-[var(--text-2)]">
              {initials}
            </span>
            {user ? <PlanBadge plan={user.plan} /> : null}
          </div>
        </header>

        <div className="flex h-[52px] items-center justify-between border-b border-[var(--border)] px-4 lg:hidden">
          <Link className="flex items-center gap-2" to="/dashboard">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
              IF
            </span>
            <span className="text-sm font-semibold">InvoiceFlow</span>
          </Link>
          <button aria-label="Open menu" className="btn btn-ghost btn-sm" type="button">
            <span aria-hidden="true">☰</span>
          </button>
        </div>

        <main className="p-4 sm:p-6">
          <div className="page-enter space-y-5" key={location.pathname}>
            <div>
              <h1 className="text-[18px] font-semibold text-[var(--text-1)]">
                {greeting}, {firstName}
              </h1>
              <p className="mt-1 text-xs text-[var(--text-2)]">Here&apos;s your overview for today.</p>
            </div>

            {error ? (
              <div className="card error-state flex items-center justify-between gap-3">
                <span>⚠ {error}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()} type="button">
                  Try again
                </button>
              </div>
            ) : null}

            {!loading && (stats?.overdue ?? 0) > 0 ? (
              <div className="flex items-center justify-between rounded-md border border-[rgba(239,68,68,0.2)] bg-[var(--red-dim)] px-3 py-2 text-[12px] text-[var(--red)]">
                <span>⚠ {formatCurrency(stats?.overdue ?? 0)} in overdue invoices</span>
                <Link className="text-[11px]" to="/invoices">
                  Review →
                </Link>
              </div>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div className="card p-4" key={index}>
                    <Skeleton height={12} width="45%" />
                    <Skeleton height={28} width="58%" />
                  </div>
                ))
              ) : (
                <>
                  <article className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-2)]">Total Revenue</p>
                      <RevenueIcon className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    </div>
                    <p className="mono mt-2.5 text-[22px] font-medium text-[var(--text-1)]">
                      {formatCurrency(revenue)}
                    </p>
                  </article>
                  <article className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-2)]">Outstanding</p>
                      <ClockIcon className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    </div>
                    <p className="mono mt-2.5 text-[22px] font-medium text-[var(--text-1)]">
                      {formatCurrency(outstanding)}
                    </p>
                  </article>
                  <article className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-2)]">Overdue</p>
                      <AlertIcon className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    </div>
                    <p
                      className="mono mt-2.5 text-[22px] font-medium"
                      style={{ color: overdue > 0 ? "var(--red)" : "var(--text-1)" }}
                    >
                      {formatCurrency(overdue)}
                    </p>
                  </article>
                  <article className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--text-2)]">Drafts</p>
                      <DraftIcon className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    </div>
                    <p className="mono mt-2.5 text-[22px] font-medium text-[var(--text-1)]">{drafts}</p>
                  </article>
                </>
              )}
            </section>

            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-secondary btn-sm" to="/invoices/new">
                + New Invoice
              </Link>
              <Link className="btn btn-secondary btn-sm" to="/proposals/new">
                + New Proposal
              </Link>
              <Link className="btn btn-secondary btn-sm" to="/invoices">
                View All Invoices
              </Link>
            </div>

            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-medium text-[var(--text-1)]">Revenue</h2>
                <span className="text-[11px] text-[var(--text-3)]">Last 6 months</span>
              </div>
              <div className="mt-4 h-72 overflow-x-auto">
                {loading ? (
                  <Skeleton height={288} width="100%" />
                ) : (
                  <BarChart
                    data={stats?.monthlyRevenue ?? []}
                    height={288}
                    margin={{ bottom: 8, left: 0, right: 16, top: 8 }}
                    width={760}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="month"
                      tick={{ fill: "var(--text-3)" }}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: "var(--text-3)" }}
                      tickFormatter={(value) => `$${Number(value) / 1000}k`}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-2)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      cursor={{ fill: "var(--bg-2)" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                    />
                    <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </div>
            </section>

            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <h2 className="text-[13px] font-medium text-[var(--text-1)]">Recent invoices</h2>
                <Link className="btn btn-ghost btn-sm" to="/invoices">
                  View all →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th aria-label="Download" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td>
                              <Skeleton height={12} width="56px" />
                            </td>
                            <td>
                              <Skeleton height={12} width="120px" />
                            </td>
                            <td>
                              <Skeleton height={12} width="72px" />
                            </td>
                            <td>
                              <Skeleton height={18} width="64px" />
                            </td>
                            <td>
                              <Skeleton height={12} width="82px" />
                            </td>
                            <td>
                              <Skeleton height={24} width="24px" />
                            </td>
                          </tr>
                        ))
                      : stats?.recentInvoices.map((invoice) => (
                          <tr
                            data-clickable="true"
                            key={invoice.id}
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <td className="mono">{invoice.number}</td>
                            <td>{invoice.client}</td>
                            <td className="mono">{formatCurrency(invoice.amount, invoice.currency)}</td>
                            <td>
                              <StatusBadge status={invoice.status} />
                            </td>
                            <td className="text-[var(--text-2)]">{formatDate(invoice.date)}</td>
                            <td className="text-right">
                              <button
                                aria-label={`Download ${invoice.number}`}
                                className="btn btn-ghost btn-sm"
                                disabled={downloadingInvoiceId === invoice.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void handleDownloadPdf(invoice.id, invoice.number);
                                }}
                                type="button"
                              >
                                <DownloadIcon className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
