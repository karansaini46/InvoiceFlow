import { type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { PlanBadge } from "@/components/PlanBadge";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

type PageProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

const nav = [
  {
    href: "/dashboard",
    icon: "M4 19V5M4 19H20M8 16V11M12 16V8M16 16V13",
    label: "Dashboard",
  },
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
  {
    href: "/settings",
    icon: "M10.3 5A7 7 0 1019 13.7M12 8v4l2 2",
    label: "Settings",
  },
  {
    href: "/upgrade",
    icon: "M5 10l7-7 7 7M12 3v14",
    label: "Upgrade",
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" fill="none" height="15" viewBox="0 0 24 24" width="15">
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

export function Page({ title, description, children }: PageProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const initials = getInitials(user?.name || user?.email);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col border-r border-[var(--border)] bg-[var(--bg-1)] lg:flex">
        <Link className="flex items-center gap-3 px-4 py-5" to="/dashboard">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-xs font-bold text-white">
            IF
          </span>
          <span className="text-[15px] font-semibold text-[var(--text-1)]">InvoiceFlow</span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {nav.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              key={item.href}
              to={item.href}
            >
              <NavIcon d={item.icon} />
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
          <div className="flex min-w-0 items-center gap-2 text-[12px]">
            <span className="text-[var(--text-3)]">InvoiceFlow</span>
            <span className="text-[var(--text-3)]">/</span>
            <span className="truncate text-[var(--text-2)]">{title}</span>
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
            {description ? (
              <div>
                <h1 className="text-[18px] font-semibold text-[var(--text-1)]">{title}</h1>
                <p className="mt-1 text-[12px] text-[var(--text-2)]">{description}</p>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
