import { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { PlanBadge } from "@/components/PlanBadge";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

type PageProps = {
  title: string;
  description: string;
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
    icon: "M7 3H15L19 7V21H7C5.895 21 5 20.105 5 19V5C5 3.895 5.895 3 7 3ZM14 3V8H19M9 13H15M9 17H13",
    label: "Invoices",
  },
  {
    href: "/proposals",
    icon: "M6 4H18C19.105 4 20 4.895 20 6V18C20 19.105 19.105 20 18 20H6C4.895 20 4 19.105 4 18V6C4 4.895 4.895 4 6 4ZM8 9H16M8 13H16M8 17H12",
    label: "Proposals",
  },
  {
    href: "/settings",
    icon: "M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z",
    label: "Settings",
  },
  {
    href: "/upgrade",
    icon: "M7 7L12 2L17 7M12 2V15",
    label: "Upgrade",
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
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

export function Page({ title, description, children }: PageProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const initials =
    (user?.name || user?.email || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r lg:flex"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <Link className="flex items-center gap-3 px-5 pb-6 pt-7" to="/dashboard">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}
          >
            IF
          </div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}
          >
            InvoiceFlow
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              key={item.href}
              to={item.href}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
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
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            {title}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "Syne, sans-serif" }}
            >
              {description}
            </h1>
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {nav.map((item) => (
                <NavLink
                  className={({ isActive }) => `nav-item whitespace-nowrap ${isActive ? "active" : ""}`}
                  key={item.href}
                  to={item.href}
                >
                  <NavIcon d={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="animate-fade-in-up p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
