import { type ReactNode, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/axios";

const navigation = [
  { href: "/dashboard", icon: "M4 19V5M4 19H20M8 16V11M12 16V8M16 16V13", label: "Dashboard" },
  { href: "/invoices", icon: "M7 3H15L19 7V21H7a2 2 0 01-2-2V5a2 2 0 012-2zm7 0v5h5M9 13h6M9 17h4", label: "Invoices" },
  { href: "/proposals", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", label: "Proposals" },
  { href: "/settings", icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", label: "Settings" },
];

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" width="16" height="16">
      <path d={d} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function getInitials(value?: string) {
  return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export function Layout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const initials = useMemo(() => getInitials(user?.name || user?.email), [user]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="layout-container tech-grid film-grain">
      <aside className="layout-sidebar">
        <Link className="sidebar-logo" to="/dashboard">
          <div style={{ width: 24, height: 24, background: 'var(--accent-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary-text)', fontSize: 12, fontWeight: 700 }}>
            IF
          </div>
          InvoiceFlow
        </Link>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              key={item.href}
              to={item.href}
            >
              <Icon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-small" style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div className="text-small text-muted" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-small text-muted" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: '4px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-elevated)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <header className="layout-header">
          <div className="flex items-center gap-2">
            <h1 className="text-h2 font-display" style={{ margin: 0, fontSize: '28px' }}>{title}</h1>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </header>
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
