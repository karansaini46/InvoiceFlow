import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatusBadge } from "@/components/StatusBadge";
import { dashboardApi, type DashboardStats } from "@/lib/api/dashboard";
import { invoicesApi } from "@/lib/api/invoices";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

type IconProps = {
  className?: string;
};

type StatCard = {
  label: string;
  value: string;
  accent: string;
  icon: (props: IconProps) => JSX.Element;
};

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: ChartIcon },
  { label: "Invoices", href: "/invoices", icon: InvoiceIcon },
  { label: "Proposals", href: "/proposals", icon: ProposalIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

function ChartIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 19V5M4 19H20M8 16V11M12 16V8M16 16V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvoiceIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3H15L19 7V21H7C5.895 21 5 20.105 5 19V5C5 3.895 5.895 3 7 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 3V8H19M9 13H15M9 17H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProposalIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4H18C19.105 4 20 4.895 20 6V18C20 19.105 19.105 20 18 20H6C4.895 20 4 19.105 4 18V6C4 4.895 4.895 4 6 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 9H16M8 13H16M8 17H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14.08 20.83V21A2 2 0 1 1 10.08 21V20.91A1.65 1.65 0 0 0 9 19.4A1.65 1.65 0 0 0 7.18 19.73L7.12 19.79A2 2 0 1 1 4.29 16.96L4.35 16.9A1.65 1.65 0 0 0 4.68 15.08A1.65 1.65 0 0 0 3.17 14.08H3A2 2 0 1 1 3 10.08H3.09A1.65 1.65 0 0 0 4.6 9A1.65 1.65 0 0 0 4.27 7.18L4.21 7.12A2 2 0 1 1 7.04 4.29L7.1 4.35A1.65 1.65 0 0 0 8.92 4.68H9A1.65 1.65 0 0 0 10 3.17V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15 4.6A1.65 1.65 0 0 0 16.82 4.27L16.88 4.21A2 2 0 1 1 19.71 7.04L19.65 7.1A1.65 1.65 0 0 0 19.32 8.92V9A1.65 1.65 0 0 0 20.83 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RevenueIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3V21M17 7.5C16.089 6.561 14.717 6 13 6H10.5C8.567 6 7 7.343 7 9C7 10.657 8.567 12 10.5 12H13.5C15.433 12 17 13.343 17 15C17 16.657 15.433 18 13.5 18H11C9.283 18 7.911 17.439 7 16.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 6V12L16 14M21 12C21 16.971 16.971 21 12 21C7.029 21 3 16.971 3 12C3 7.029 7.029 3 12 3C16.971 3 21 7.029 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8V12M12 16H12.01M10.29 3.86L2.82 17C2.06 18.333 3.023 20 4.557 20H19.443C20.977 20 21.94 18.333 21.18 17L13.71 3.86C12.943 2.511 11.057 2.511 10.29 3.86Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DraftIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4H19V20H5V4ZM8 8H16M8 12H16M8 16H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4V14M8 10L12 14L16 10M5 20H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ViewIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.5 7.5 7.667 5.25 12 5.25C16.333 5.25 19.5 7.5 21.5 12C19.5 16.5 16.333 18.75 12 18.75C7.667 18.75 4.5 16.5 2.5 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14.75C13.519 14.75 14.75 13.519 14.75 12C14.75 10.481 13.519 9.25 12 9.25C10.481 9.25 9.25 10.481 9.25 12C9.25 13.519 10.481 14.75 12 14.75Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

const formatCurrency = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

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
        console.error("Error loading dashboard stats:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(stats?.totalRevenue ?? 0),
        accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: RevenueIcon,
      },
      {
        label: "Outstanding",
        value: formatCurrency(stats?.outstanding ?? 0),
        accent: "border-sky-200 bg-sky-50 text-sky-700",
        icon: ClockIcon,
      },
      {
        label: "Overdue",
        value: formatCurrency(stats?.overdue ?? 0),
        accent: "border-rose-200 bg-rose-50 text-rose-700",
        icon: AlertIcon,
      },
      {
        label: "Drafts",
        value: String(stats?.draftCount ?? 0),
        accent: "border-amber-200 bg-amber-50 text-amber-700",
        icon: DraftIcon,
      },
    ],
    [stats],
  );

  const initials = useMemo(() => {
    const source = user?.name || user?.email || "User";
    const parts = source.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
  }, [user]);

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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <Link to="/dashboard" className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
            IF
          </span>
          <span className="text-lg font-semibold text-slate-950">InvoiceFlow</span>
        </Link>

        <nav className="mt-10 flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                Financial snapshot
              </h1>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {user?.name ?? "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <SkeletonBlock className="h-10 w-10" />
                    <SkeletonBlock className="mt-5 h-4 w-28" />
                    <SkeletonBlock className="mt-3 h-8 w-36" />
                  </div>
                ))
              : statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      key={card.label}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md border ${card.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-5 text-sm font-medium text-slate-500">
                        {card.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
                        {card.value}
                      </p>
                    </article>
                  );
                })}
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-slate-950">
                  Monthly revenue
                </h2>
                <p className="text-sm text-slate-500">Paid invoices over the last 6 months</p>
              </div>
            </div>

            <div className="mt-5 h-72 overflow-x-auto">
              {loading ? (
                <SkeletonBlock className="h-full w-full" />
              ) : (
                <BarChart
                  data={stats?.monthlyRevenue ?? []}
                  height={288}
                  margin={{ bottom: 8, left: 0, right: 16, top: 8 }}
                  width={760}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${Number(value) / 1000}k`}
                    width={48}
                  />
                  <Tooltip
                    cursor={{ fill: "#F1F5F9" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Bar dataKey="total" fill="#0F172A" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-slate-950">
                  Recent invoices
                </h2>
                <p className="text-sm text-slate-500">The 5 most recent invoice records</p>
              </div>
              <Link
                to="/invoices"
                className="inline-flex w-fit items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : stats && stats.recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Invoice
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Client
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {stats.recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-950">
                          {invoice.number}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {invoice.client}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/invoices/${invoice.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                              title="View invoice"
                              aria-label={`View invoice ${invoice.number}`}
                            >
                              <ViewIcon className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(invoice.id, invoice.number)}
                              disabled={downloadingInvoiceId === invoice.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Download PDF"
                              aria-label={`Download PDF for invoice ${invoice.number}`}
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">No invoices yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Revenue, outstanding totals, and invoice activity will appear here.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
