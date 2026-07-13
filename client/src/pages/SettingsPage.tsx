import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useToast } from "@/hooks/useToast";
import { settingsApi, type PasswordChangeData, type ProfileUpdateData, type UserProfile } from "@/lib/api/settings";
import type { FollowUpRule } from "@/types/invoice";

const profileSchema = z.object({
  businessAddress: z.string().optional(),
  businessName: z.string().optional(),
  businessPhone: z.string().optional(),
  businessWebsite: z.string().url().optional().or(z.literal("")),
  defaultCurrency: z.string().length(3).optional(),
  defaultNotes: z.string().optional(),
  defaultPaymentTerms: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Must be at least 8 characters"),
});

type ProfileFormValues = z.input<typeof profileSchema>;
type PasswordFormValues = z.input<typeof passwordSchema>;
type Tab = "business" | "defaults" | "followups" | "security";

const currencies = [{ code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, { code: "GBP", symbol: "£" }, { code: "INR", symbol: "₹" }];
const paymentTerms = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt"];

function initials(value?: string) {
  return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("business");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [followUpRules, setFollowUpRules] = useState<FollowUpRule[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const { dismissToast, showToast, toasts } = useToast();

  const profileForm = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const businessName = profileForm.watch("businessName");
  const avatarInitials = useMemo(() => initials(businessName || profile?.name || profile?.email), [businessName, profile]);

  useEffect(() => { void loadProfile(); void loadFollowUps(); }, []);

  const loadProfile = async () => {
    try {
      const data = await settingsApi.getProfile();
      setProfile(data);
      profileForm.reset({
        businessAddress: data.businessAddress || "", businessName: data.businessName || "",
        businessPhone: data.businessPhone || "", businessWebsite: data.businessWebsite || "",
        defaultCurrency: data.defaultCurrency, defaultNotes: data.defaultNotes || "",
        defaultPaymentTerms: data.defaultPaymentTerms, defaultTaxRate: data.defaultTaxRate,
      });
    } catch { showToast("Failed to load profile", "error"); }
  };

  const loadFollowUps = async () => {
    try {
      const data = await settingsApi.getFollowUpDefaults();
      setFollowUpRules(data.rules);
    } catch { showToast("Failed to load follow-ups", "error"); }
  };

  const handleUpdateFollowUpRule = (index: number, field: keyof FollowUpRule, value: any) => {
    const newRules = [...followUpRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setFollowUpRules(newRules);
  };

  const handleSaveFollowUps = async () => {
    setFollowUpLoading(true);
    try {
      const payload = followUpRules.map(r => ({ offsetDays: r.offsetDays, enabled: r.enabled }));
      const response = await settingsApi.updateFollowUpDefaults(payload);
      setFollowUpRules(response.rules);
      showToast("Follow-ups updated", "success");
    } catch { showToast("Failed to update follow-ups", "error"); }
    finally { setFollowUpLoading(false); }
  };

  const handleProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setLoading(true);
    try {
      if (logoFile) await settingsApi.uploadLogo(logoFile);
      const updateData: ProfileUpdateData = { ...data, businessWebsite: data.businessWebsite || undefined };
      const updatedProfile = await settingsApi.updateProfile(updateData);
      setProfile(updatedProfile);
      showToast("Profile updated", "success");
      setLogoFile(null); setLogoPreview("");
    } catch { showToast("Failed to update profile", "error"); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    setLoading(true);
    try {
      await settingsApi.changePassword(data as PasswordChangeData);
      passwordForm.reset();
      showToast("Password changed", "success");
    } catch { showToast("Failed to change password", "error"); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteOpen(false); setLoading(true);
    try {
      await settingsApi.deleteAccount();
      showToast("Account deleted", "success");
      window.location.href = "/register";
    } catch { showToast("Failed to delete account", "error"); }
    finally { setLoading(false); }
  };

  const handleLogoChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleLogoChange(e.dataTransfer.files[0]);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "business", label: "Business" },
    { id: "defaults", label: "Defaults" },
    { id: "followups", label: "Follow-ups" },
    { id: "security", label: "Security" },
  ];

  return (
    <Layout title="Settings">
      <div className="flex-col gap-6" style={{ display: 'flex', maxWidth: '960px' }}>
        
        <div className="flex gap-4" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-small font-medium pb-2"
              style={{
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "business" && (
          <form className="flex-col gap-6" style={{ display: 'flex' }} onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <Card>
              <div className="flex items-center gap-4 mb-6">
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {avatarInitials}
                </div>
                <div>
                  <h3 className="text-h2 font-display" style={{ fontSize: '24px', margin: 0, marginBottom: '4px' }}>Business Profile</h3>
                  <p className="text-small text-muted">Update your company details and branding.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input label="Business Name" placeholder="Company LLC" {...profileForm.register("businessName")} />
                <Input label="Business Phone" type="tel" placeholder="+1 (555) 000-0000" {...profileForm.register("businessPhone")} />
              </div>
              <div className="mb-4">
                <label className="text-small font-medium text-muted block mb-1">Business Address</label>
                <textarea 
                  className="w-full"
                  rows={3} 
                  style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }}
                  {...profileForm.register("businessAddress")} 
                />
              </div>
              <div>
                <Input label="Business Website" type="url" placeholder="https://example.com" {...profileForm.register("businessWebsite")} />
              </div>
            </Card>

            <Card>
              <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Logo</h3>
              <div className="flex gap-6 items-start">
                <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden', backgroundColor: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {logoPreview || profile?.logoUrl ? (
                    <img src={logoPreview || profile?.logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="text-small text-muted">No logo</span>
                  )}
                </div>
                <label 
                  htmlFor="logo-upload"
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  style={{ cursor: 'pointer', flex: 1, border: `1px dashed ${dragActive ? 'var(--text-primary)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', backgroundColor: dragActive ? 'var(--bg-surface-elevated)' : 'transparent', transition: 'all 0.2s ease' }}
                >
                  <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
                  <span className="text-small font-medium cursor-pointer mb-2 block">Click to upload or drag and drop</span>
                  <p className="text-small text-muted">PNG, JPG, GIF up to 5MB</p>
                </label>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button loading={loading} type="submit" variant="primary">Save Changes</Button>
            </div>
          </form>
        )}

        {activeTab === "defaults" && (
          <form className="flex-col gap-6" style={{ display: 'flex' }} onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <Card>
              <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Invoice Defaults</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-small font-medium text-muted block mb-1">Default Currency</label>
                  <select className="w-full" style={{ height: '36px', padding: '0 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }} {...profileForm.register("defaultCurrency")}>
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
                <Input label="Default Tax Rate (%)" type="number" step="0.1" {...profileForm.register("defaultTaxRate", { valueAsNumber: true })} />
              </div>
              <div className="mb-4">
                <label className="text-small font-medium text-muted block mb-1">Default Payment Terms</label>
                <select className="w-full" style={{ height: '36px', padding: '0 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }} {...profileForm.register("defaultPaymentTerms")}>
                  {paymentTerms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-small font-medium text-muted block mb-1">Default Notes</label>
                <textarea 
                  className="w-full"
                  rows={4}
                  style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-base)', outline: 'none' }}
                  {...profileForm.register("defaultNotes")}
                />
              </div>
            </Card>
            <div className="flex justify-end">
              <Button loading={loading} type="submit" variant="primary">Save Changes</Button>
            </div>
          </form>
        )}

        {activeTab === "followups" && (
          <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <Card>
              <h3 className="text-h2 font-display mb-2" style={{ fontSize: '24px' }}>Automated Follow-ups</h3>
              <p className="text-small text-muted mb-6">Configure default reminders for unpaid invoices.</p>
              
              <div className="grid grid-cols-3 gap-4">
                {followUpRules.map((rule, i) => (
                  <div key={i} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-small font-medium">Reminder {i + 1}</span>
                      <input type="checkbox" checked={rule.enabled} onChange={e => handleUpdateFollowUpRule(i, "enabled", e.target.checked)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" style={{ width: '60px', marginBottom: 0, textAlign: 'center' }} value={rule.offsetDays} onChange={e => handleUpdateFollowUpRule(i, "offsetDays", parseInt(e.target.value) || 0)} disabled={!rule.enabled} />
                      <span className="text-small text-muted">days after due</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="flex justify-end">
              <Button loading={followUpLoading} onClick={handleSaveFollowUps} variant="primary">Save Changes</Button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="flex-col gap-6" style={{ display: 'flex' }}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
              <Card>
                <h3 className="text-h2 font-display mb-6" style={{ fontSize: '24px' }}>Change Password</h3>
                <div className="flex-col gap-4 mb-6">
                  <Input label="Current Password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register("currentPassword")} />
                  <Input label="New Password" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register("newPassword")} />
                </div>
                <div className="flex justify-end">
                  <Button loading={loading} type="submit" variant="primary">Update Password</Button>
                </div>
              </Card>
            </form>

            <Card style={{ backgroundColor: 'var(--error-bg)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <h3 className="text-h2 font-display mb-2" style={{ color: 'var(--error-text)', fontSize: '24px' }}>Danger Zone</h3>
              <p className="text-small mb-4" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>Once you delete your account, there is no going back. Please be certain.</p>
              <Button onClick={() => setDeleteOpen(true)} variant="secondary" style={{ color: 'var(--error-text)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Delete Account</Button>
            </Card>
          </div>
        )}
      </div>

      {toasts.map(toast => <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => dismissToast(toast.id)} />)}
      
      <ConfirmModal
        open={deleteOpen}
        title="Delete Account"
        message="Are you sure you want to delete your account? All data will be permanently erased."
        confirmLabel="Delete Account"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </Layout>
  );
}
