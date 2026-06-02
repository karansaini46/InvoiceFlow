import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/auth";

type TabType = "proposals" | "invoices" | "insights";

const inlineStyles = `
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-16px) scale(1.04); }
  }
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
    50% { transform: translateY(-24px) rotate(60deg) scale(1.08); }
  }
  @keyframes sweep {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-float-slow {
    animation: float-slow 9s ease-in-out infinite;
  }
  .animate-float-medium {
    animation: float-medium 13s ease-in-out infinite;
  }
  .pro-glow-card {
    position: relative;
  }
  .pro-glow-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(90deg, var(--accent), #6278f8, #f59e0b, var(--accent));
    background-size: 300% 300%;
    border-radius: 8px;
    z-index: -1;
    animation: sweep 6s linear infinite;
    opacity: 0.35;
    transition: opacity 0.3s ease;
  }
  .pro-glow-card:hover::before {
    opacity: 0.75;
  }
`;

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("insights");

  // Mouse Simulator position states
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Bar progress states for AI tab
  const [barWidths, setBarWidths] = useState({ acme: 0, globex: 0, cyber: 0 });

  // Proposals Mock Simulator State
  const [proposalAccepted, setProposalAccepted] = useState(false);
  const [proposalDeclined, setProposalDeclined] = useState(false);

  // Invoices Mock Simulator State
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // AI Reminder Simulator State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Handle Mouse spotlight tracker
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Trigger bar animations on tab change
  useEffect(() => {
    if (activeTab === "insights") {
      setBarWidths({ acme: 0, globex: 0, cyber: 0 });
      const timer = setTimeout(() => {
        setBarWidths({ acme: 94, globex: 71, cyber: 35 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Smooth scroll helper
  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDownloadMock = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    }, 1500);
  };

  const handleCopyReminder = () => {
    setReminderCopied(true);
    setTimeout(() => setReminderCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-0)] text-[var(--text-1)] selection:bg-[var(--accent)] selection:text-white relative overflow-x-hidden">
      {/* Inject custom stylesheets */}
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* Background Floating Orbs */}
      <div className="absolute top-[8%] left-[5%] -z-10 h-[260px] w-[260px] rounded-full bg-[rgba(79,110,247,0.06)] blur-[90px] animate-float-slow" />
      <div className="absolute top-[35%] right-[8%] -z-10 h-[320px] w-[320px] rounded-full bg-[rgba(34,197,94,0.04)] blur-[100px] animate-float-medium" />
      <div className="absolute bottom-[20%] left-[3%] -z-10 h-[280px] w-[280px] rounded-full bg-[rgba(239,68,68,0.03)] blur-[95px] animate-float-slow" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(8,9,12,0.85)] px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="flex items-center gap-2.5" to="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] font-mono text-sm font-bold text-white shadow-[0_0_15px_rgba(79,110,247,0.4)]">
              IF
            </span>
            <span className="font-mono text-base font-semibold tracking-tight text-[var(--text-1)]">
              InvoiceFlow
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToId("features")}
              className="text-[13px] font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)] cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToId("simulator")}
              className="text-[13px] font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)] cursor-pointer"
            >
              Interactive Demo
            </button>
            <button
              onClick={() => scrollToId("pricing")}
              className="text-[13px] font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)] cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToId("faq")}
              className="text-[13px] font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)] cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="shadow-[0_0_12px_rgba(79,110,247,0.25)] hover:shadow-[0_0_20px_rgba(79,110,247,0.45)] transition-shadow duration-300"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  className="px-3 py-1.5 text-[13px] font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
                  to="/login"
                >
                  Sign In
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="shadow-[0_0_12px_rgba(79,110,247,0.25)] hover:shadow-[0_0_20px_rgba(79,110,247,0.45)] transition-shadow duration-300"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32">
        <div className="absolute top-1/4 left-1/2 -z-10 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,110,247,0.12),transparent_65%)] blur-[80px]" />

        <div className="mx-auto max-w-4xl text-center">
          {/* AI Banner Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,110,247,0.25)] bg-[var(--accent-dim)] px-3 py-1 text-xs font-medium text-[var(--accent)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Gemini-Powered Cash Flow Insights & Payment Reminders
          </div>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-[var(--text-1)] to-[var(--text-2)] leading-[1.15]">
            Smarter invoicing. <br />
            <span className="text-[var(--accent)]">Better cash flow.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[var(--text-2)] md:text-base">
            Craft high-converting proposals, automate professional invoicing, and leverage AI insights to forecast revenue. Built for freelancers, agencies, and modern builders.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-8 shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(79,110,247,0.45)] transition-all duration-200"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="w-full sm:w-auto px-8 shadow-[0_0_20px_rgba(79,110,247,0.3)] hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(79,110,247,0.45)] transition-all duration-200"
                >
                  Get Started Free
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => scrollToId("simulator")}
                  className="w-full sm:w-auto px-8 hover:bg-[var(--bg-3)] hover:scale-[1.02] transition-all duration-200"
                >
                  Interactive Demo
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 text-xs text-[var(--text-3)] font-mono">
            No credit card required · Free 3 invoices tier
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <section id="simulator" className="mx-auto max-w-5xl px-6 pb-24">
        {/* Simulator window with Mouse spotlight handler */}
        <div
          id="simulator-card"
          onMouseMove={handleMouseMove}
          className="card border-[var(--border)] bg-[var(--bg-1)] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden relative group"
        >
          {/* Mouse Spotlight overlay */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 opacity-100 group-hover:opacity-100"
            style={{
              background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(79, 110, 247, 0.08), transparent 75%)`,
            }}
          />

          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-0)] px-4 py-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] opacity-80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b] opacity-80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] opacity-80" />
              <span className="ml-3 text-[11px] font-mono text-[var(--text-3)]">app.invoiceflow.com/demo</span>
            </div>
            {/* Tabs */}
            <div className="flex rounded-md bg-[var(--bg-2)] p-0.5 border border-[var(--border)]">
              {(["insights", "proposals", "invoices"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[11px] font-medium rounded-sm capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-[var(--bg-3)] text-[var(--text-1)] border-b border-[rgba(255,255,255,0.05)] shadow-sm"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  }`}
                >
                  {tab === "insights" ? "AI Insights" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Content Panel */}
          <div className="min-h-[380px] p-6 lg:p-8 flex flex-col justify-between relative z-10">
            {activeTab === "insights" && (
              <div className="space-y-6 page-enter">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-1)] flex items-center gap-2">
                      <span className="text-[var(--accent)]">⚡</span> AI Cash Flow Forecasting
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--text-3)]">Predictive performance based on last 90 days client behaviors.</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-2)] border border-[var(--border)] p-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="text-[10px] uppercase font-semibold text-[var(--text-3)] tracking-wider">Next 30 Days Forecast</p>
                    <p className="mono mt-1 text-[20px] font-bold text-[var(--accent)]">$14,250.00</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 space-y-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <h4 className="text-[11px] font-bold uppercase text-[var(--text-3)] tracking-wider">Payment Risk Index</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-2)]">Acme Corp</span>
                          <span className="text-[var(--green)] font-medium">94% On-Time</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--green)] rounded-full"
                            style={{
                              width: `${barWidths.acme}%`,
                              transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-2)]">Globex Inc</span>
                          <span className="text-[var(--amber)] font-medium">71% On-Time (Medium Risk)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--amber)] rounded-full"
                            style={{
                              width: `${barWidths.globex}%`,
                              transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-2)]">CyberDyne Labs</span>
                          <span className="text-[var(--red)] font-medium">35% On-Time (High Risk)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg-3)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--red)] rounded-full"
                            style={{
                              width: `${barWidths.cyber}%`,
                              transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-[var(--text-3)] tracking-wider">Actionable Insight</h4>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-2)]">
                        CyberDyne Labs has an outstanding invoice of <span className="mono font-semibold text-[var(--text-1)]">$3,200</span> that is 14 days overdue. Generate a customized payment reminder now.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--border)]">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full flex justify-center items-center gap-1.5 text-xs py-2 bg-[var(--bg-3)] border-[var(--border)] hover:border-[var(--border-focus)] hover:scale-[1.01] transition-all"
                        onClick={() => setShowReminderModal(true)}
                      >
                        <span>🪄</span> Generate AI Reminder Email
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--accent-dim)] p-3 text-[12px] leading-relaxed text-[var(--text-2)] flex items-start gap-2.5">
                  <span className="text-[var(--accent)] text-sm">💡</span>
                  <span>
                    <strong className="text-[var(--text-1)]">AI Forecast:</strong> Historical trends suggest invoices issued in June are settled 4.2 days faster than the yearly average. Plan your equipment upgrades accordingly.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "proposals" && (
              <div className="space-y-6 page-enter">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-3)]">PROPOSAL #PROP-2026-004</span>
                    <h3 className="text-base font-semibold mt-0.5 text-[var(--text-1)]">Product Design & Brand Identity</h3>
                  </div>
                  <div>
                    {proposalAccepted ? (
                      <span className="badge badge-accepted">✓ Accepted</span>
                    ) : proposalDeclined ? (
                      <span className="badge badge-declined">✖ Declined</span>
                    ) : (
                      <span className="badge badge-draft">Pending Review</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex justify-between text-xs text-[var(--text-3)] border-b border-[var(--border)] pb-2 font-mono">
                    <span>Scope of Work</span>
                    <span>Cost</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-2)] font-medium">1. Brand Strategy & Logo Suite Design</span>
                      <span className="mono text-[var(--text-1)]">$3,500.00</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-2)] font-medium">2. High-Fidelity UI/UX Web Mockups (12 pages)</span>
                      <span className="mono text-[var(--text-1)]">$5,000.00</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs font-semibold text-[var(--text-2)]">Total Proposal Value</span>
                    <span className="mono text-sm font-bold text-[var(--text-1)]">$8,500.00</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {proposalAccepted || proposalDeclined ? (
                    <button
                      className="text-xs text-[var(--accent)] underline cursor-pointer hover:text-[#6278f8] transition-colors"
                      onClick={() => {
                        setProposalAccepted(false);
                        setProposalDeclined(false);
                      }}
                    >
                      Reset proposal state
                    </button>
                  ) : (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setProposalDeclined(true)}
                        className="px-4 py-1.5 hover:scale-[1.02] transition-transform"
                      >
                        Decline Proposal
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setProposalAccepted(true)}
                        className="px-4 py-1.5 shadow-[0_0_12px_rgba(79,110,247,0.2)] hover:shadow-[0_0_18px_rgba(79,110,247,0.4)] hover:scale-[1.02] transition-all"
                      >
                        Accept & Convert to Invoice
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="space-y-6 page-enter">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-3)]">INVOICE #INV-2026-012</span>
                    <h3 className="text-base font-semibold mt-0.5 text-[var(--text-1)]">Globex Corporation</h3>
                  </div>
                  <div>
                    <span className="badge badge-paid">✓ Paid</span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="text-[10px] uppercase font-mono text-[var(--text-3)] tracking-wider">Amount Due</p>
                    <p className="mono mt-1.5 text-[22px] font-bold text-[var(--text-1)]">$4,200.00</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="text-[10px] uppercase font-mono text-[var(--text-3)] tracking-wider">Due Date</p>
                    <p className="mt-1.5 text-xs font-medium text-[var(--text-1)]">June 15, 2026</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <p className="text-[10px] uppercase font-mono text-[var(--text-3)] tracking-wider">Project Ref</p>
                    <p className="mt-1.5 text-xs font-medium text-[var(--accent)] font-mono">#PROP-2026-002</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-2)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-2)] font-medium">Professional Consultation (30 hours @ $140/hr)</span>
                    <span className="mono text-[var(--text-1)] font-semibold">$4,200.00</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-[var(--text-3)] font-mono">Payment method: Stripe Credit Card</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={downloading}
                    onClick={handleDownloadMock}
                    className="flex items-center gap-2 border-[var(--border)] hover:bg-[var(--bg-3)] hover:scale-[1.02] transition-all"
                  >
                    {downloaded ? (
                      <span className="text-[var(--green)]">✓ Copied PDF Link!</span>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5 text-[var(--text-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V14M8 10L12 14L16 10M5 20H19" />
                        </svg>
                        Download PDF Invoice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="border-t border-[var(--border)] bg-[var(--bg-1)] px-6 py-24 relative">
        <div className="absolute bottom-0 right-0 -z-10 h-[250px] w-[300px] rounded-full bg-[rgba(79,110,247,0.03)] blur-[60px]" />
        
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[var(--text-1)]">
              Everything you need to get paid. Beautifully.
            </h2>
            <p className="mt-4 text-sm text-[var(--text-2)] leading-relaxed">
              No complicated accounting jargon. Just clean dashboards, seamless automation, and insights that actually make sense.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                📋
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">Proposals That Sell</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Draft beautiful pitches with custom markdown directly in the browser. Share a sleek, client-facing link for instant approval or decline.
              </p>
            </article>

            {/* Feature 2 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                💵
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">One-Click Invoices</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Convert accepted proposals to active invoices automatically. Track payments, export to professional PDF layouts, and customize billing details.
              </p>
            </article>

            {/* Feature 3 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                🔮
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">Cash Flow Forecasting</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Our lightweight, built-in forecasting analyses past client payment behaviors to calculate upcoming revenue and payment likelihoods.
              </p>
            </article>

            {/* Feature 4 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                ✉️
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">AI Payment Reminders</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Tired of writing awkward emails to get paid? Generate polite, professional email reminders tailored to specific clients and invoice sizes.
              </p>
            </article>

            {/* Feature 5 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                📈
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">Visual Revenue Charts</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Track your financial progress over the last 6 months with intuitive, streamlined charts and summary metrics (Revenue, Outstanding, Overdue).
              </p>
            </article>

            {/* Feature 6 */}
            <article className="card p-6 border-[var(--border)] hover:border-[var(--border-focus)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-2)] border border-[var(--border)] text-[var(--accent)] text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                ⚡
              </div>
              <h3 className="mt-4 text-[14px] font-semibold text-[var(--text-1)]">Blazing Fast SPA</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                Built with React and Vite for near-instant transitions. A clean, keyboard-first, distraction-free environment that values your time.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-[var(--border)] px-6 py-24 relative overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-xl mx-auto font-sans">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[var(--text-1)]">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-sm text-[var(--text-2)]">
              Get started with our free tier, or unlock the full power of InvoiceFlow with our Pro subscription.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
            {/* Free Tier */}
            <article className="card p-8 border-[var(--border)] bg-[var(--bg-1)] flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all duration-300">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider">Free Plan</h3>
                  <span className="rounded bg-[var(--bg-2)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-2)] uppercase">Starter</span>
                </div>
                <p className="mono mt-4 text-3xl font-bold text-[var(--text-1)]">$0</p>
                <p className="mt-2 text-xs text-[var(--text-3)]">No credit card required. Free forever.</p>
                
                <ul className="mt-8 space-y-3.5 text-xs text-[var(--text-2)]">
                  {["Up to 3 active invoices", "Basic invoice creation & metadata", "Standard PDF exports", "Self-hosted manual reminder copy"].map((item) => (
                    <li className="flex gap-2.5 items-center" key={item}>
                      <span className="text-[var(--text-3)]">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="w-full justify-center bg-[var(--bg-2)] hover:bg-[var(--bg-3)] border-[var(--border)] hover:scale-[1.01] transition-transform"
                >
                  Sign Up Free
                </Button>
              </div>
            </article>

            {/* Pro Tier (with animated gradient sweep glow border) */}
            <article className="pro-glow-card card p-8 border-transparent bg-[var(--bg-1)] flex flex-col justify-between shadow-[0_0_35px_rgba(79,110,247,0.12)] hover:shadow-[0_0_45px_rgba(79,110,247,0.22)] transition-all duration-300">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider">Pro Plan</h3>
                  <span className="rounded bg-[var(--accent-dim)] border border-[rgba(79,110,247,0.2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide">Popular</span>
                </div>
                <p className="mono mt-4 text-3xl font-bold text-[var(--text-1)]">$29</p>
                <p className="mt-2 text-xs text-[var(--text-3)]">One-time upgrade, activation instantly.</p>
                
                <ul className="mt-8 space-y-3.5 text-xs text-[var(--text-2)]">
                  {[
                    "Unlimited active & draft invoices",
                    "Unlimited client proposals with custom scope",
                    "Advanced PDF exports & instant downloads",
                    "Gemini AI Cash Flow forecasting widget",
                    "AI Payment Reminder automated email generator",
                    "Priority features and instant onboarding support",
                  ].map((item) => (
                    <li className="flex gap-2.5 items-center" key={item}>
                      <span className="text-[var(--green)]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="w-full justify-center shadow-[0_0_20px_rgba(79,110,247,0.25)] hover:shadow-[0_0_28px_rgba(79,110,247,0.45)] hover:scale-[1.01] transition-all"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-[var(--border)] bg-[var(--bg-1)] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-[var(--text-1)]">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-[var(--text-2)]">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                answer: "Yes, our Free plan allows you to create up to 3 invoices completely free of charge. No credit card details are required to sign up.",
                question: "Is there a truly free tier available?",
              },
              {
                answer: "The AI Cash Flow Insights runs lightweight predictive heuristics combined with Gemini LLM summarization. It processes your past invoicing frequencies, amount volumes, and client payment turnaround histories to forecast your expected revenue for the next 30 days and flag potential default/payment risks.",
                question: "How does the AI Cash Flow Forecasting work?",
              },
              {
                answer: "Absolutely. Once a client reviews and accepts your proposal via the secure sharing link, InvoiceFlow enables you to convert that entire itemized proposal outline into an editable invoice structure with a single click, saving you copy-paste time.",
                question: "Can I convert proposals into active invoices automatically?",
              },
              {
                answer: "Yes! PDF downloads are fully optimized. Every proposal and invoice comes with a clean, printer-friendly, minimal design style. You can customize the business profile parameters, including your logo, name, invoice defaults, and contact details, under your user settings page.",
                question: "Can I customize the generated invoices with my details?",
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <article
                  key={faq.question}
                  className="card border-[var(--border)] bg-[var(--bg-2)] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-medium text-xs sm:text-[13px] text-[var(--text-1)] cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span className={`text-[var(--text-3)] transition-transform duration-300 text-xs ${isOpen ? "rotate-90 text-[var(--accent)]" : ""}`}>
                      ▶
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[var(--text-2)] leading-relaxed border-t border-[var(--border)] bg-[rgba(8,9,12,0.15)] page-enter">
                      {faq.answer}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-12 bg-[var(--bg-0)]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6.5 w-6.5 items-center justify-center rounded bg-[var(--accent)] font-mono text-xs font-bold text-white">
              IF
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight text-[var(--text-1)]">
              InvoiceFlow
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-[var(--text-2)] font-sans">
            <button onClick={() => scrollToId("features")} className="hover:text-[var(--text-1)] cursor-pointer">Features</button>
            <button onClick={() => scrollToId("simulator")} className="hover:text-[var(--text-1)] cursor-pointer">Demo</button>
            <button onClick={() => scrollToId("pricing")} className="hover:text-[var(--text-1)] cursor-pointer">Pricing</button>
            <Link to="/login" className="hover:text-[var(--text-1)]">Dashboard</Link>
          </div>

          <p className="text-xs text-[var(--text-3)] font-mono">
            &copy; {new Date().getFullYear()} InvoiceFlow Inc. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Mock AI Reminder Modal */}
      {showReminderModal && (
        <div className="modal-backdrop">
          <div className="modal-box max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-2.5">
              <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                <span>🪄</span> Gemini AI Payment Reminder
              </h3>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderCopied(false);
                }}
                className="text-[var(--text-3)] hover:text-[var(--text-1)] text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="label">Generated Reminder Draft</label>
              <div className="rounded border border-[var(--border)] bg-[var(--bg-0)] p-3 text-xs leading-relaxed font-mono text-[var(--text-2)] h-44 overflow-y-auto">
                <p><span className="text-[var(--text-3)]">Subject:</span> Friendly follow-up: Invoice #INV-2026-012 for CyberDyne Labs</p>
                <p className="mt-3">Dear Finance Team,</p>
                <p className="mt-2">I hope you are doing well. I wanted to send a quick reminder regarding invoice #INV-2026-012 ($3,200.00) issued on May 15, 2026. It is currently 14 days past due.</p>
                <p className="mt-2">Could you please check on the status of this payment? I've attached a copy of the invoice PDF link below for your reference.</p>
                <p className="mt-2">If payment has already been sent, please disregard this note.</p>
                <p className="mt-3">Best regards,<br />John Doe</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderCopied(false);
                }}
                className="border-[var(--border)]"
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyReminder}
                className="shadow-[0_0_12px_rgba(79,110,247,0.2)] hover:shadow-[0_0_18px_rgba(79,110,247,0.45)] hover:scale-[1.02] transition-all"
              >
                {reminderCopied ? "✓ Copied!" : "Copy Draft Text"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
