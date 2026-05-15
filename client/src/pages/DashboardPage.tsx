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
import { PlanBadge } from "@/components/PlanBadge";
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
  { label: "Upgrade", href: "/upgrade", icon: UpgradeIcon },
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

function UpgradeIcon({ className = "" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 7L12 2L17 7M12 2V12M12 12V22M12 22H8M12 22H16"
        stroke="currentColor"
        strokeWidth="2"
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
  return <div className={`animate-pulse rounded-md bg-[var(--bg-elevated)] ${className}`} />;
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
        accent: "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.12)] text-[#34D399]",
        icon: RevenueIcon,
      },
      {
        label: "Outstanding",
        value: formatCurrency(stats?.outstanding ?? 0),
        accent: "border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.12)] text-[#67E8F9]",
        icon: ClockIcon,
      },
      {
        label: "Overdue",
        value: formatCurrency(stats?.overdue ?? 0),
        accent: "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] text-[#F87171]",
        icon: AlertIcon,
      },
      {
        label: "Drafts",
        value: String(stats?.draftCount ?? 0),
        accent: "border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] text-[#FCD34D]",
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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r lg:flex"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <Link className="flex items-center gap-3 px-5 pb-6 pt-7" to="/dashboard">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}
          >
            IF
          </span>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}
          >
            InvoiceFlow
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                key={item.href}
                to={item.href}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t px-4 pb-6 pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-cyan))" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mb-3">{user ? <PlanBadge plan={user.plan} /> : null}</div>
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:text-[#F87171]"
            onClick={handleLogout}
            style={{ color: "var(--text-secondary)" }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header
          className="sticky top-0 z-10 border-b px-4 py-5 sm:px-6"
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(10,10,15,0.85)",
            borderColor: "var(--border)",
          }}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Dashboard
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}
            >
              Financial snapshot
            </h1>
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    className={({ isActive }) => `nav-item whitespace-nowrap ${isActive ? "active" : ""}`}
                    key={item.href}
                    to={item.href}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="animate-fade-in-up p-4 sm:p-6">
          {error && <div className="error-banner mb-6 text-sm">{error}</div>}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div className="glass-card p-5" key={index}>
                    <SkeletonBlock className="h-10 w-10" />
                    <SkeletonBlock className="mt-5 h-4 w-28" />
                    <SkeletonBlock className="mt-3 h-8 w-36" />
                  </div>
                ))
              : statCards.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <article
                      className={`glass-card glass-card-hover animate-fade-in-up p-5 stagger-${index + 1}`}
                      key={card.label}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border ${card.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-5 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                        {card.label}
                      </p>
                      <p className="stat-number mt-2">{card.value}</p>
                    </article>
                  );
                })}
          </section>

          <section className="glass-card mt-6 p-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Monthly revenue
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Paid invoices over the last 6 months
              </p>
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
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tick={{ fill: "var(--text-muted)" }}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: "var(--text-muted)" }}
                    tickFormatter={(value) => `$${Number(value) / 1000}k`}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      color: "var(--text-primary)",
                    }}
                    cursor={{ fill: "rgba(99,102,241,0.08)" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Bar dataKey="total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </div>
          </section>

          <section className="glass-card mt-6 overflow-hidden">
            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Recent invoices
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  The 5 most recent invoice records
                </p>
              </div>
              <Link className="action-pill w-fit" to="/invoices">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock className="h-12 w-full" key={index} />
                ))}
              </div>
            ) : stats && stats.recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: "var(--bg-elevated)" }}>
                    <tr>
                      {["Invoice", "Client", "Amount", "Status", "Date", "Actions"].map((label) => (
                        <th
                          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${
                            label === "Actions" ? "text-right" : "text-left"
                          }`}
                          key={label}
                          style={{ color: "var(--text-muted)" }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInvoices.map((invoice) => (
                      <tr className="table-row-dark" key={invoice.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {invoice.number}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm" style={{ color: "var(--text-primary)" }}>
                          {invoice.client}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(invoice.date)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              aria-label={`View invoice ${invoice.number}`}
                              className="icon-action"
                              title="View invoice"
                              to={`/invoices/${invoice.id}`}
                            >
                              <ViewIcon className="h-4 w-4" />
                            </Link>
                            <button
                              aria-label={`Download PDF for invoice ${invoice.number}`}
                              className="icon-action disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={downloadingInvoiceId === invoice.id}
                              onClick={() => handleDownloadPdf(invoice.id, invoice.number)}
                              title="Download PDF"
                              type="button"
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
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  No invoices yet
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
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
