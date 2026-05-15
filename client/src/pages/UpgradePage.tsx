import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { PlanBadge } from "@/components/PlanBadge";
import { paymentApi } from "@/lib/api/payment";
import { Page } from "@/pages/Page";
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
        setMessage(status.plan === "pro" ? "You're already on Pro." : null);
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

    void loadStatus();
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
      setMessage("You're now on Pro.");
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
    <Page title="Upgrade">
      <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase text-[var(--text-3)]">Free</span>
            <PlanBadge plan="free" />
          </div>
          <p className="mono mt-2 text-[24px] font-medium text-[var(--text-1)]">$0</p>
          <p className="mt-1 text-[12px] text-[var(--text-2)]">Get started, no commitment.</p>
          <ul className="mt-4 space-y-2 text-[12px] text-[var(--text-2)]">
            {["Up to 3 invoices", "Basic invoice creation", "PDF export"].map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="text-[var(--text-3)]">–</span>
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="card relative overflow-hidden border-[rgba(79,110,247,0.3)] p-6">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-[var(--accent)]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase text-[var(--accent)]">Pro</span>
            <PlanBadge plan="pro" />
          </div>
          <p className="mono mt-2 text-[24px] font-medium text-[var(--text-1)]">$29</p>
          <p className="mt-1 text-[12px] text-[var(--text-2)]">One-time upgrade for the demo.</p>
          <ul className="mt-4 space-y-2 text-[12px] text-[var(--text-2)]">
            {["Unlimited invoices", "Proposals & PDF export", "Priority features", "Instant activation"].map(
              (item) => (
                <li className="flex gap-2" key={item}>
                  <span className="text-[var(--green)]">✓</span>
                  {item}
                </li>
              ),
            )}
          </ul>

          {error ? <div className="card error-state mt-5">⚠ {error}</div> : null}
          {message ? <p className="mt-5 text-[12px] text-[var(--green)]">{message}</p> : null}

          {currentPlan === "pro" ? (
            <p className="mt-5 text-[13px] font-medium text-[var(--green)]">You&apos;re on Pro</p>
          ) : (
            <Button className="mt-5 w-full" loading={loading || upgrading} onClick={handleUpgrade} size="lg">
              Upgrade to Pro
            </Button>
          )}
        </article>
      </div>
    </Page>
  );
}
