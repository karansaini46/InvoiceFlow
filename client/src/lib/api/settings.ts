import { api } from "@/lib/axios";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  logoUrl?: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  defaultPaymentTerms: string;
  defaultNotes?: string;
  plan: string;
  createdAt: string;
}

export interface ProfileUpdateData {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  defaultCurrency?: string;
  defaultTaxRate?: number;
  defaultPaymentTerms?: string;
  defaultNotes?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

const resolveAssetUrl = (url?: string) => {
  if (!url) {
    return url;
  }

  return new URL(url, apiBaseUrl).toString();
};

const normalizeProfile = (profile: UserProfile): UserProfile => ({
  ...profile,
  logoUrl: resolveAssetUrl(profile.logoUrl),
});

export const settingsApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/settings/profile");
    return normalizeProfile(response.data);
  },

  updateProfile: async (data: ProfileUpdateData): Promise<UserProfile> => {
    const response = await api.patch("/settings/profile", data);
    return normalizeProfile(response.data);
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append("logo", file);
    
    const response = await api.post("/settings/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      logoUrl: resolveAssetUrl(response.data.logoUrl) ?? "",
    };
  },

  changePassword: async (data: PasswordChangeData): Promise<void> => {
    await api.patch("/settings/password", data);
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete("/settings/account");
  },
};
