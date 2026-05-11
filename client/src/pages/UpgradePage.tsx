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
    <Page title="Upgrade" description="Compare the free plan with the PRO upgrade.">
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Free
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">FREE</h2>
            </div>
            <PlanBadge plan="free" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">$0</p>
          <p className="mt-2 text-sm text-slate-600">Best for trying the app and small demos.</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li>Max 3 invoices</li>
            <li>Basic invoice features</li>
            <li>Simple plan visibility in the app</li>
          </ul>
        </article>

        <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Pro
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">PRO</h2>
            </div>
            <PlanBadge plan="pro" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">$29</p>
          <p className="mt-2 text-sm text-slate-600">One-time dummy upgrade for the demo flow.</p>
          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li>Unlimited invoices</li>
            <li>All available features</li>
            <li>Instant in-app upgrade</li>
          </ul>

          <div className="mt-6 space-y-3">
            {message ? (
              <div className="rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-md border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            {currentPlan === "pro" ? (
              <div className="rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800">
                ✅ You are on the PRO plan
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={loading || upgrading}
                onClick={handleUpgrade}
                type="button"
              >
                {upgrading ? "Upgrading..." : "Upgrade to PRO"}
              </Button>
            )}
          </div>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/invoices"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to invoices
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>
    </Page>
  );
}
