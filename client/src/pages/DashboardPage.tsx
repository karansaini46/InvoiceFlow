import { useNavigate } from "react-router-dom";

import { Button } from "@/components/Button";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth";

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              InvoiceFlow
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Track outstanding invoices and recent billing activity.
            </p>
          </div>
          <Button className="sm:mt-1" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Signed in as</p>
          <p className="mt-1 text-lg font-medium text-slate-950">
            {user?.name ?? "User"}
          </p>
          <p className="mt-1 text-sm text-slate-600">{user?.email}</p>
        </div>
      </section>
    </main>
  );
}
