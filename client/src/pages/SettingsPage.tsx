import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { settingsApi, type UserProfile, type ProfileUpdateData, type PasswordChangeData } from "@/lib/api/settings";
import { Button } from "@/components/Button";
import { Page } from "@/pages/Page";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";

const profileSchema = z.object({
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessWebsite: z.string().url().optional().or(z.literal("")),
  defaultCurrency: z.string().length(3).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(),
  defaultPaymentTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type ProfileFormValues = z.input<typeof profileSchema>;
type PasswordFormValues = z.input<typeof passwordSchema>;

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
];

const paymentTerms = [
  "Net 15",
  "Net 30",
  "Net 45",
  "Net 60",
  "Due on Receipt",
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "defaults" | "account">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const { showToast, toasts, dismissToast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await settingsApi.getProfile();
      setProfile(data);
      profileForm.reset({
        businessName: data.businessName || "",
        businessAddress: data.businessAddress || "",
        businessPhone: data.businessPhone || "",
        businessWebsite: data.businessWebsite || "",
        defaultCurrency: data.defaultCurrency,
        defaultTaxRate: data.defaultTaxRate,
        defaultPaymentTerms: data.defaultPaymentTerms,
        defaultNotes: data.defaultNotes || "",
      });
    } catch (error) {
      showToast("Failed to load profile", "error");
    }
  };

  const handleProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setLoading(true);
    try {
      if (logoFile) {
        await settingsApi.uploadLogo(logoFile);
      }

      const updateData: ProfileUpdateData = {
        ...data,
        businessWebsite: data.businessWebsite || undefined,
      };

      const updatedProfile = await settingsApi.updateProfile(updateData);
      setProfile(updatedProfile);
      showToast("Profile updated successfully", "success");
      setLogoFile(null);
      setLogoPreview("");
    } catch (error) {
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    setLoading(true);
    try {
      await settingsApi.changePassword(data);
      passwordForm.reset();
      showToast("Password changed successfully", "success");
    } catch (error) {
      showToast("Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        await settingsApi.deleteAccount();
        showToast("Account deleted successfully", "success");
        window.location.href = "/register";
      } catch (error) {
        showToast("Failed to delete account", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogoChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoChange(e.dataTransfer.files[0]);
    }
  };

  const tabs = [
    { id: "profile", label: "Business Profile" },
    { id: "defaults", label: "Invoice Defaults" },
    { id: "account", label: "Account" },
  ];

  return (
    <Page title="Settings" description="Account settings.">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border p-1.5" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          {tabs.map((tab) => (
            <button
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-[0_0_20px_var(--accent-glow)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <section className="glass-card p-6">
              <h2 className="section-heading">Business Information</h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="field-label">Business Name</label>
                  <input className="input-dark" type="text" {...profileForm.register("businessName")} />
                </div>
                <div>
                  <label className="field-label">Business Phone</label>
                  <input className="input-dark" type="tel" {...profileForm.register("businessPhone")} />
                </div>
              </div>

              <div className="mt-6">
                <label className="field-label">Business Address</label>
                <textarea className="input-dark" rows={3} {...profileForm.register("businessAddress")} />
              </div>

              <div className="mt-6">
                <label className="field-label">Business Website</label>
                <input
                  className="input-dark"
                  placeholder="https://example.com"
                  type="url"
                  {...profileForm.register("businessWebsite")}
                />
              </div>
            </section>

            <section className="glass-card p-6">
              <h2 className="section-heading">Logo</h2>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  {logoPreview || profile?.logoUrl ? (
                    <img
                      alt="Logo preview"
                      className="h-24 w-24 rounded-2xl border object-cover"
                      src={logoPreview || profile?.logoUrl}
                      style={{ borderColor: "var(--border)" }}
                    />
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-2xl border text-sm"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      No logo
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div
                    className="rounded-2xl border border-dashed p-6 text-center transition"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      background: dragActive ? "rgba(99,102,241,0.12)" : "var(--bg-elevated)",
                      borderColor: dragActive ? "var(--accent)" : "var(--border-hover)",
                    }}
                  >
                    <input
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => e.target.files?.[0] && handleLogoChange(e.target.files[0])}
                      type="file"
                    />
                    <label className="cursor-pointer" htmlFor="logo-upload">
                      <div style={{ color: "var(--text-secondary)" }}>
                        <p>Drag and drop your logo here, or click to browse</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button disabled={loading} type="submit">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "defaults" && (
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <section className="glass-card p-6">
              <h2 className="section-heading">Preferences</h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="field-label">Default Currency</label>
                  <select className="input-dark appearance-none" {...profileForm.register("defaultCurrency")}>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Default Tax Rate (%)</label>
                  <input
                    className="input-dark"
                    max="100"
                    min="0"
                    step="0.1"
                    type="number"
                    {...profileForm.register("defaultTaxRate", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="field-label">Default Payment Terms</label>
                <select className="input-dark appearance-none" {...profileForm.register("defaultPaymentTerms")}>
                  {paymentTerms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <label className="field-label">Default Notes</label>
                <textarea
                  className="input-dark"
                  placeholder="Thank you for your business."
                  rows={4}
                  {...profileForm.register("defaultNotes")}
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button disabled={loading} type="submit">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "account" && (
          <div className="space-y-4">
            <section className="glass-card p-6">
              <h2 className="section-heading">Change Password</h2>

              <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                <div>
                  <label className="field-label">Current Password</label>
                  <input className="input-dark" type="password" {...passwordForm.register("currentPassword")} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-[#F87171]">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="field-label">New Password</label>
                  <input className="input-dark" type="password" {...passwordForm.register("newPassword")} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-[#F87171]">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button disabled={loading} type="submit">
                    {loading ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </section>

            <section className="glass-card border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.05)] p-6">
              <h2 className="section-heading">Danger Zone</h2>
              <h3 className="text-sm font-medium text-[#F87171]">Delete Account</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <div className="mt-4">
                <Button disabled={loading} onClick={handleDeleteAccount} variant="danger">
                  {loading ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={() => dismissToast(toast.id)}
          tone={toast.type}
        />
      ))}
    </Page>
  );
}
