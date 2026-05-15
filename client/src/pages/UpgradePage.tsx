import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/Button";
import { PlanBadge } from "@/components/PlanBadge";
import { Page } from "@/pages/Page";
import { paymentApi } from "@/lib/api/payment";
import { useAuthStore } from "@/store/auth";

export function UpgradePage() {
  const user = useAuthStore((state) => state.user);
  const setPlan = useAuthStore((state) => state.setPlan);
  const [currentPlan, setCurrentPlan] = useState(user?.plan ?? "free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      try {
        setLoading(true);
        const status = await paymentApi.getStatus();

        if (!mounted) {
          return;
        }

        setCurrentPlan(status.plan);
        setPlan(status.plan);
        setMessage(status.plan === "pro" ? "You're already on PRO." : null);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError("Unable to load your plan.");
        console.error("Error loading payment status:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      mounted = false;
    };
  }, [setPlan]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      setMessage(null);
      setError(null);

      const result = await paymentApi.mockUpgrade();
      setCurrentPlan(result.plan);
      setPlan(result.plan);
      setMessage("🎉 You're now PRO!");
    } catch (err) {
      if (isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data.message ?? "Unable to upgrade plan.");
      } else {
        setError("Unable to upgrade plan.");
      }

      console.error("Error upgrading plan:", err);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Page title="Upgrade" description="Go Pro.">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-bold sm:text-5xl" style={{ color: "var(--text-primary)" }}>
            Unlock the full power of InvoiceFlow
          </h2>
          <p className="mt-4 text-base" style={{ color: "var(--text-secondary)" }}>
            Move beyond the starter limit with unlimited invoicing and the complete workflow surface.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="glass-card glass-card-hover p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Free
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">FREE</h3>
              </div>
              <PlanBadge plan="free" />
            </div>
            <p className="stat-number mt-6">$0</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Best for trying the app and small demos.
            </p>
            <ul className="mt-5 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              {["Max 3 invoices", "Basic invoice features", "Simple plan visibility in the app"].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span style={{ color: "var(--accent)" }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="glass-card relative overflow-hidden border-[var(--accent)] p-6 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-cyan))" }}
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">Pro</p>
                <h3 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">PRO</h3>
              </div>
              <PlanBadge plan="pro" />
            </div>
            <div className="mt-6 flex items-end gap-2">
              <p className="stat-number text-4xl">$29</p>
              <span className="pb-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                /month
              </span>
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              One-time dummy upgrade for the demo flow.
            </p>
            <ul className="mt-5 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              {["Unlimited invoices", "All available features", "Instant in-app upgrade"].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span style={{ color: "var(--accent-cyan)" }}>→</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3">
              {message ? (
                <div className="rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm text-[#34D399]">
                  {message}
                </div>
              ) : null}
              {error ? <div className="error-banner text-sm">{error}</div> : null}

              {currentPlan === "pro" ? (
                <div className="rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.12)] px-4 py-3 text-sm font-medium text-[#34D399]">
                  You are on the PRO plan
                </div>
              ) : (
                <Button className="w-full py-3" disabled={loading || upgrading} onClick={handleUpgrade} type="button">
                  {upgrading ? "Upgrading..." : "Upgrade to PRO"}
                </Button>
              )}
            </div>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="action-pill" to="/invoices">
            Back to invoices
          </Link>
          <Link className="action-pill" to="/dashboard">
            Back to dashboard
          </Link>
        </div>
      </section>
    </Page>
  );
}
