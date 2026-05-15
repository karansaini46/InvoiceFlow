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
    <Page title="Settings" description="Manage your business profile, invoice defaults, and account settings.">
      <div className="max-w-4xl mx-auto">
        
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "profile" && (
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    {...profileForm.register("businessName")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Phone</label>
                  <input
                    type="tel"
                    {...profileForm.register("businessPhone")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Business Address</label>
                <textarea
                  rows={3}
                  {...profileForm.register("businessAddress")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Business Website</label>
                <input
                  type="url"
                  {...profileForm.register("businessWebsite")}
                  placeholder="https://example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Logo</h2>
              
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {(logoPreview || profile?.logoUrl) ? (
                    <img
                      src={logoPreview || profile?.logoUrl}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No logo</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleLogoChange(e.target.files[0])}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="text-gray-600">
                        <p>Drag and drop your logo here, or click to browse</p>
                        <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "defaults" && (
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Defaults</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                <select
                  {...profileForm.register("defaultCurrency")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...profileForm.register("defaultTaxRate", { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Default Payment Terms</label>
              <select
                {...profileForm.register("defaultPaymentTerms")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {paymentTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Default Notes</label>
              <textarea
                rows={4}
                {...profileForm.register("defaultNotes")}
                placeholder="Thank you for your business."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "account" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
              
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    {...passwordForm.register("newPassword")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="border-t pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                <p className="mt-1 text-sm text-red-700">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <div className="mt-4">
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Render toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.type}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </Page>
  );
}
