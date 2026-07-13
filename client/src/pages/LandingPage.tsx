import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="film-grain" style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' }}>
      {/* Background Orbit Animations (ETHER style) */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '140%', height: '140%', pointerEvents: 'none', zIndex: 0, opacity: 0.4 }} className="animate-orbit">
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '1px', height: '1px', boxShadow: '0 0 100px 40px var(--accent-primary)', opacity: 0.15 }}></div>
        <div style={{ position: 'absolute', bottom: '30%', right: '20%', width: '1px', height: '1px', boxShadow: '0 0 150px 60px var(--accent-selected)', opacity: 0.1 }}></div>
      </div>
      
      <div className="tech-grid" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}></div>

      <header style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(9, 9, 9, 0.6)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary-text)', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-display)', boxShadow: '0 0 15px rgba(197, 106, 58, 0.3)' }}>
            IF
          </div>
          <span className="font-display" style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>InvoiceFlow</span>
        </div>
        <nav style={{ display: 'flex', gap: '32px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <a href="#features" style={{ transition: 'color 0.2s' }}>Features</a>
          <a href="#workflow" style={{ transition: 'color 0.2s' }}>Workflow</a>
          <a href="#pricing" style={{ transition: 'color 0.2s' }}>Pricing</a>
        </nav>
        <div style={{ display: 'flex', gap: '16px' }}>
          {isAuthenticated ? (
            <button className="btn btn-primary btn-sm" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/dashboard")}>
              Enter System
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/login")} style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                Sign in
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("/register")} style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Initialize
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 10 }}>
        {/* Hero Section */}
        <section style={{ padding: '160px 48px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Removed v2.0 badge */}
          <h1 className="text-h1 animate-slide-up" style={{ fontSize: '64px', marginBottom: '24px', letterSpacing: '-0.04em', lineHeight: 1.1, textShadow: '0 4px 20px rgba(0,0,0,0.5)', animationDelay: '0.1s', animationFillMode: 'both' }}>
            The definitive operating system <br/> for <span style={{ color: 'var(--accent-selected)' }}>financial ops</span>.
          </h1>
          <p className="text-body animate-slide-up" style={{ fontSize: '18px', maxWidth: '640px', margin: '0 auto 56px', lineHeight: 1.6, color: 'var(--text-secondary)', animationDelay: '0.2s', animationFillMode: 'both' }}>
            Engineered for precision. InvoiceFlow combines cinematic aesthetics with enterprise-grade financial tooling to accelerate your revenue cycle.
          </p>
          <div className="animate-slide-up" style={{ display: 'flex', justifyContent: 'center', gap: '24px', animationDelay: '0.3s', animationFillMode: 'both' }}>
            {isAuthenticated ? (
               <button className="btn btn-primary btn-lg" style={{ minWidth: '180px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/dashboard")}>
                 Access Dashboard
               </button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" style={{ minWidth: '180px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/register")}>
                  Deploy Now
                </button>
                <button className="btn btn-secondary btn-lg" style={{ minWidth: '180px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  View Specs
                </button>
              </>
            )}
          </div>
        </section>

        {/* Live Invoice Preview */}
        <section style={{ padding: '0 48px 120px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="technical-panel animate-slide-up" style={{ borderRadius: '8px', overflow: 'hidden', padding: '2px', animationDelay: '0.4s', animationFillMode: 'both', background: 'linear-gradient(180deg, rgba(236,233,225,0.08) 0%, transparent 100%)' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-strong)' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-strong)' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--border-strong)' }}></div>
                </div>
                <div className="mono-label">process_invoice.tsx</div>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
              </div>
              <div style={{ display: 'flex', padding: '48px', gap: '48px', background: 'linear-gradient(135deg, rgba(23,23,21,0.5) 0%, transparent 100%)' }}>
                <div style={{ flex: 1 }}>
                  <div className="mono-label" style={{ marginBottom: '16px', color: 'var(--accent-primary)' }}>INV-2026-042</div>
                  <h3 className="text-h2" style={{ marginBottom: '32px' }}>Aura Dynamics Ltd.</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px dashed var(--border-strong)' }}>
                      <span className="text-body">Enterprise Infrastructure Setup</span>
                      <span className="font-mono text-primary">$45,000.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px dashed var(--border-strong)' }}>
                      <span className="text-body">Annual Maintenance Contract</span>
                      <span className="font-mono text-primary">$12,500.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px' }}>
                      <span className="text-h3" style={{ color: 'var(--text-secondary)' }}>Total Due</span>
                      <span className="font-mono" style={{ fontSize: '24px', color: 'var(--accent-selected)' }}>$57,500.00</span>
                    </div>
                  </div>
                </div>
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="technical-panel" style={{ padding: '24px', borderRadius: '6px' }}>
                     <div className="mono-label" style={{ marginBottom: '12px' }}>Transaction Status</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(227, 199, 138, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-selected)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </div>
                       <div>
                         <div className="text-primary font-mono" style={{ fontSize: '14px', fontWeight: 600 }}>Payment Secured</div>
                         <div className="text-small text-muted font-mono">Processed via Stripe</div>
                       </div>
                     </div>
                     <div className="mono-label" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>ID: REC-2026-042</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ padding: '160px 48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '80px' }}>
              <div className="mono-label" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>SYSTEM CAPABILITIES</div>
              <h2 className="text-h2" style={{ fontSize: '42px', letterSpacing: '-0.03em', maxWidth: '600px', lineHeight: 1.1 }}>
                Uncompromising control over your revenue cycle.
              </h2>
            </div>
            
            <div className="grid grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {[
                { title: "Precision Invoicing", desc: "Generate mathematically perfect, branded invoices with support for dynamic tax calculations and multi-currency parsing.", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
                { title: "Automated Recon", desc: "Instantly reconcile incoming payments against open invoices using advanced webhook listening and matching algorithms.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
                { title: "Telemetry & Analytics", desc: "Visualize your cash flow with high-fidelity, real-time charts. Track MRR, outstanding balances, and aging reports.", icon: "M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3" },
                { title: "Client Portals", desc: "Provide a secure, authenticated environment for clients to view history, download PDFs, and process payments.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
                { title: "Smart Scheduling", desc: "Configure recurring billing sequences with cron-like precision. Fully automated dispatch and follow-up routines.", icon: "M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
                { title: "Global Compliance", desc: "Built-in support for global tax schemas, regional date formatting, and compliant PDF generation for all jurisdictions.", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7v3l2 2" },
              ].map((feat, i) => (
                <div key={i} className="technical-panel" style={{ padding: '32px', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(236,233,225,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--accent-selected)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={feat.icon}></path></svg>
                  </div>
                  <h3 className="text-h3" style={{ marginBottom: '12px' }}>{feat.title}</h3>
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" style={{ padding: '160px 48px', background: 'var(--bg-surface)' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '80px' }}>
                 <div>
                   <div className="mono-label" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>PIPELINE ARCHITECTURE</div>
                   <h2 className="text-h2" style={{ fontSize: '42px', letterSpacing: '-0.03em', maxWidth: '600px', lineHeight: 1.1 }}>
                     The lifecycle of a <br/> modern transaction.
                   </h2>
                 </div>
              </div>
              
              <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', height: '1px', background: 'var(--border-strong)', zIndex: 0 }}></div>
                
                {[
                  { step: "01", title: "Generate", desc: "Compose data-rich invoices via GUI or API." },
                  { step: "02", title: "Dispatch", desc: "Automated routing via email with PDF attachments." },
                  { step: "03", title: "Settle", desc: "Frictionless payment collection via Stripe." },
                  { step: "04", title: "Reconcile", desc: "Instant ledger updates and automated receipts." }
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, padding: '0 24px', position: 'relative', zIndex: 1 }}>
                     <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-base)', border: '1px solid var(--accent-selected)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--accent-selected)', boxShadow: '0 0 10px rgba(227, 199, 138, 0.2)' }}>
                       {item.step}
                     </div>
                     <h4 className="text-h3" style={{ marginBottom: '8px' }}>{item.title}</h4>
                     <p className="text-body" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Benefits / Metrics */}
        <section style={{ padding: '160px 48px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
               <h2 className="text-h2" style={{ fontSize: '42px', letterSpacing: '-0.03em', marginBottom: '32px', lineHeight: 1.1 }}>
                 Measurable impact on your bottom line.
               </h2>
               <p className="text-body" style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '64px', lineHeight: 1.6 }}>
                 InvoiceFlow is not just a cosmetic upgrade. It's a highly optimized engine designed to reduce operational friction and accelerate cash velocity.
               </p>
               <ul style={{ display: 'flex', justifyContent: 'center', gap: '48px', listStyle: 'none' }}>
                 {[
                   { metric: "40%", text: "Faster payment settlement" },
                   { metric: "0", text: "Manual reconciliation errors" },
                   { metric: "15hrs", text: "Saved per month on admin" }
                 ].map((b, i) => (
                   <li key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div className="font-mono text-h2" style={{ color: 'var(--accent-primary)', fontSize: '48px' }}>{b.metric}</div>
                      <div className="text-body" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{b.text}</div>
                   </li>
                 ))}
               </ul>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" style={{ padding: '160px 48px', background: 'var(--bg-surface)' }}>
           <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div className="mono-label" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>LICENSING</div>
              <h2 className="text-h2" style={{ fontSize: '42px', letterSpacing: '-0.03em', marginBottom: '16px' }}>Deploy InvoiceFlow</h2>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Enterprise-grade infrastructure, priced for teams of all sizes.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
              <div className="technical-panel" style={{ padding: '48px', borderRadius: '8px', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } } as any}>
                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Developer</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                  <span className="font-mono" style={{ fontSize: '48px', color: 'var(--text-primary)' }}>$0</span>
                </div>
                <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '40px', minHeight: '48px' }}>Essential infrastructure for independent developers and freelancers.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 48px 0', display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Up to 10 active invoices</li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Standard templates</li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Community support</li>
                </ul>
                <button className="btn btn-secondary w-full font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/register")}>Initialize Base</button>
              </div>

              <div className="technical-panel" style={{ padding: '48px', borderRadius: '8px', borderColor: 'var(--accent-primary)', background: 'linear-gradient(180deg, rgba(197,106,58,0.05) 0%, transparent 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-12px', right: '48px', background: 'var(--accent-primary)', color: 'var(--accent-primary-text)', padding: '4px 12px', borderRadius: '2px', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Recommended</div>
                <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Production</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
                  <span className="font-mono" style={{ fontSize: '48px', color: 'var(--text-primary)' }}>$49</span>
                  <span className="mono-label">/ month</span>
                </div>
                <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: '40px', minHeight: '48px' }}>Uncapped limits and advanced automation for scaling businesses.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 48px 0', display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-selected)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Unlimited invoices & clients</li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-selected)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Automated reconciliation</li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-selected)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Advanced analytics & API access</li>
                  <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-selected)" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Priority dedicated support</li>
                </ul>
                <button className="btn btn-primary w-full font-mono" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/register")}>Upgrade to Pro</button>
              </div>
            </div>
           </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: '160px 48px', textAlign: 'center', position: 'relative' }}>
          <div className="tech-grid" style={{ position: 'absolute', inset: 0, zIndex: -1, opacity: 0.3 }}></div>
          <h2 className="text-h1" style={{ fontSize: '56px', letterSpacing: '-0.03em', marginBottom: '32px' }}>Ready to upgrade your infrastructure?</h2>
          <p className="text-body" style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '48px' }}>Join thousands of professional teams running their billing on InvoiceFlow.</p>
          <button className="btn btn-primary btn-lg" style={{ minWidth: '200px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => navigate("/register")}>Deploy System</button>
        </section>
      </main>

      <footer style={{ padding: '48px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--accent-primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary-text)', fontWeight: 700, fontSize: '10px', fontFamily: 'var(--font-display)' }}>
              IF
            </div>
            <span className="font-display" style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>InvoiceFlow</span>
          </div>
          <div className="mono-label" style={{ color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} INVOICEFLOW SYSTEM. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
