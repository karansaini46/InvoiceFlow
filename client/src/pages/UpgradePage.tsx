import { isAxiosError } from "axios";
import { useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
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
        if (!mounted) return;
        setCurrentPlan(status.plan);
        setPlan(status.plan);
        setMessage(status.plan === "pro" ? "You're already on Pro." : null);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError("Unable to load your plan.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadStatus();
    return () => { mounted = false; };
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
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Layout title="Plans & Billing">
      <div className="grid grid-cols-2 gap-8 max-w-4xl">
        
        <Card style={{ padding: '32px' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h3">Free</h3>
            {currentPlan === "free" && <span className="badge">Current Plan</span>}
          </div>
          <div className="text-h1 font-mono mb-2">$0<span className="text-body text-muted">/mo</span></div>
          <p className="text-small text-muted mb-8">Get started, no commitment.</p>
          
          <ul className="flex-col gap-4 text-small mb-8" style={{ display: 'flex' }}>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--text-tertiary)' }}>—</span> Up to 3 invoices</li>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--text-tertiary)' }}>—</span> Basic invoice creation</li>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--text-tertiary)' }}>—</span> PDF export</li>
          </ul>
        </Card>

        <Card style={{ padding: '32px', borderColor: 'var(--border-focus)', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h3">Professional</h3>
            {currentPlan === "pro" && <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>Current Plan</span>}
          </div>
          <div className="text-h1 font-mono mb-2">$29<span className="text-body text-muted">/mo</span></div>
          <p className="text-small text-muted mb-8">For growing agencies and businesses.</p>
          
          <ul className="flex-col gap-4 text-small mb-8" style={{ display: 'flex' }}>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--success-text)' }}>✓</span> Unlimited invoices</li>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--success-text)' }}>✓</span> Proposals & PDF export</li>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--success-text)' }}>✓</span> Automated reminders</li>
            <li className="flex gap-3 items-center"><span style={{ color: 'var(--success-text)' }}>✓</span> AI Insights</li>
          </ul>

          {error && <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>{error}</div>}
          {message && <div style={{ color: 'var(--success-text)', fontSize: '13px', marginBottom: '16px', textAlign: 'center', fontWeight: 500 }}>{message}</div>}

          {currentPlan !== "pro" && (
            <Button className="w-full" loading={loading || upgrading} onClick={handleUpgrade} size="lg" variant="primary">
              Upgrade to Pro
            </Button>
          )}
        </Card>

      </div>
    </Layout>
  );
}
