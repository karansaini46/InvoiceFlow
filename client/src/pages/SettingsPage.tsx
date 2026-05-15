import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/Button";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  settingsApi,
  type PasswordChangeData,
  type ProfileUpdateData,
  type UserProfile,
} from "@/lib/api/settings";
import { Page } from "@/pages/Page";

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
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type ProfileFormValues = z.input<typeof profileSchema>;
type PasswordFormValues = z.input<typeof passwordSchema>;
type Tab = "business" | "defaults" | "security";

const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
];

const paymentTerms = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt"];

function initials(value?: string) {
  return (
    value
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("business");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savedSection, setSavedSection] = useState<Tab | null>(null);
  const savedTimer = useRef<number | null>(null);
  const { dismissToast, showToast, toasts } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const businessName = profileForm.watch("businessName");
  const avatarInitials = useMemo(
    () => initials(businessName || profile?.name || profile?.email),
    [businessName, profile],
  );

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(
    () => () => {
      if (savedTimer.current !== null) {
        window.clearTimeout(savedTimer.current);
      }
    },
    [],
  );

  const markSaved = (section: Tab) => {
    setSavedSection(section);
    if (savedTimer.current !== null) {
      window.clearTimeout(savedTimer.current);
    }
    savedTimer.current = window.setTimeout(() => setSavedSection(null), 2000);
  };

  const loadProfile = async () => {
    try {
      const data = await settingsApi.getProfile();
      setProfile(data);
      profileForm.reset({
        businessAddress: data.businessAddress || "",
        businessName: data.businessName || "",
        businessPhone: data.businessPhone || "",
        businessWebsite: data.businessWebsite || "",
        defaultCurrency: data.defaultCurrency,
        defaultNotes: data.defaultNotes || "",
        defaultPaymentTerms: data.defaultPaymentTerms,
        defaultTaxRate: data.defaultTaxRate,
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
      markSaved(activeTab);
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
      await settingsApi.changePassword(data as PasswordChangeData);
      passwordForm.reset();
      showToast("Password changed successfully", "success");
      markSaved("security");
    } catch (error) {
      showToast("Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteOpen(false);
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
  };

  const handleLogoChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      handleLogoChange(event.dataTransfer.files[0]);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "business", label: "Business" },
    { id: "defaults", label: "Defaults" },
    { id: "security", label: "Security" },
  ];

  return (
    <Page title="Settings">
      <div className="max-w-4xl space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              className={`btn btn-ghost rounded-none border-b-2 px-3 py-2 ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--text-1)]"
                  : "border-transparent text-[var(--text-2)]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "business" ? (
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <section className="card p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-3">
                  <span className="mono flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-3)] text-xs text-[var(--text-2)]">
                    {avatarInitials}
                  </span>
                  <h2 className="text-[14px] font-medium text-[var(--text-1)]">Business profile</h2>
                </div>
                {savedSection === "business" ? <span className="text-[11px] text-[var(--green)]">Saved</span> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Business Name</label>
                  <input className="input" type="text" {...profileForm.register("businessName")} />
                </div>
                <div>
                  <label className="label">Business Phone</label>
                  <input className="input" type="tel" {...profileForm.register("businessPhone")} />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Business Address</label>
                <textarea className="input" rows={3} {...profileForm.register("businessAddress")} />
              </div>

              <div className="mt-4">
                <label className="label">Business Website</label>
                <input className="input" placeholder="https://example.com" type="url" {...profileForm.register("businessWebsite")} />
              </div>
            </section>

            <section className="card p-5">
              <div className="mb-5 border-b border-[var(--border)] pb-3">
                <h2 className="text-[14px] font-medium text-[var(--text-1)]">Logo</h2>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  {logoPreview || profile?.logoUrl ? (
                    <img
                      alt="Logo preview"
                      className="h-20 w-20 rounded-md border border-[var(--border)] object-cover"
                      src={logoPreview || profile?.logoUrl}
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-2)] text-xs text-[var(--text-3)]">
                      No logo
                    </div>
                  )}
                </div>

                <div
                  className="flex-1 rounded-md border border-dashed p-5 text-center transition-colors"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    background: dragActive ? "var(--accent-dim)" : "var(--bg-2)",
                    borderColor: dragActive ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <input
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(event) => event.target.files?.[0] && handleLogoChange(event.target.files[0])}
                    type="file"
                  />
                  <label className="cursor-pointer text-xs text-[var(--text-2)]" htmlFor="logo-upload">
                    Drag and drop your logo here, or click to browse
                  </label>
                  <p className="mt-1 text-[11px] text-[var(--text-3)]">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button loading={loading} size="sm" type="submit">
                Save changes
              </Button>
            </div>
          </form>
        ) : null}

        {activeTab === "defaults" ? (
          <form className="space-y-4" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
            <section className="card p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="text-[14px] font-medium text-[var(--text-1)]">Invoice defaults</h2>
                {savedSection === "defaults" ? <span className="text-[11px] text-[var(--green)]">Saved</span> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Default Currency</label>
                  <select className="input" {...profileForm.register("defaultCurrency")}>
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Default Tax Rate (%)</label>
                  <input
                    className="input"
                    max="100"
                    min="0"
                    step="0.1"
                    type="number"
                    {...profileForm.register("defaultTaxRate", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Default Payment Terms</label>
                <select className="input" {...profileForm.register("defaultPaymentTerms")}>
                  {paymentTerms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="label">Default Notes</label>
                <textarea
                  className="input"
                  placeholder="Thank you for your business."
                  rows={4}
                  {...profileForm.register("defaultNotes")}
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button loading={loading} size="sm" type="submit">
                Save changes
              </Button>
            </div>
          </form>
        ) : null}

        {activeTab === "security" ? (
          <div className="space-y-4">
            <section className="card p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="text-[14px] font-medium text-[var(--text-1)]">Security</h2>
                {savedSection === "security" ? <span className="text-[11px] text-[var(--green)]">Saved</span> : null}
              </div>

              <form className="space-y-4" onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                <div>
                  <label className="label">Current Password</label>
                  <input className="input" type="password" {...passwordForm.register("currentPassword")} />
                  {passwordForm.formState.errors.currentPassword ? (
                    <p className="field-error">{passwordForm.formState.errors.currentPassword.message}</p>
                  ) : null}
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input className="input" type="password" {...passwordForm.register("newPassword")} />
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="field-error">{passwordForm.formState.errors.newPassword.message}</p>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <Button loading={loading} size="sm" type="submit">
                    Change password
                  </Button>
                </div>
              </form>
            </section>

            <section className="card border-[rgba(239,68,68,0.25)] bg-[var(--red-dim)] p-5">
              <div className="mb-4 border-b border-[rgba(239,68,68,0.18)] pb-3">
                <h2 className="text-[14px] font-medium text-[var(--text-1)]">Danger zone</h2>
              </div>
              <p className="text-[13px] font-medium text-[var(--red)]">Delete account</p>
              <p className="mt-1 text-[12px] text-[var(--text-2)]">
                Once you delete your account, there is no going back.
              </p>
              <Button className="mt-4" loading={loading} onClick={() => setDeleteOpen(true)} size="sm" variant="danger">
                Delete account
              </Button>
            </section>
          </div>
        ) : null}
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onDismiss={() => dismissToast(toast.id)}
          type={toast.type}
        />
      ))}

      <ConfirmModal
        confirmLabel="Delete account"
        destructive
        message="Delete your account? This cannot be undone."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
        open={deleteOpen}
        title="Delete account"
      />
    </Page>
  );
}
