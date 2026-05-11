import { create } from "zustand";

import { normalizePlan, type Plan } from "@/lib/plan";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: Plan;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  setPlan: (plan: string) => void;
  logout: () => void;
};

const storedUser = localStorage.getItem("user");
const initialUser = storedUser
  ? (() => {
      const parsedUser = JSON.parse(storedUser) as Omit<AuthUser, "plan"> & {
        plan: string;
      };

      return {
        ...parsedUser,
        plan: normalizePlan(parsedUser.plan),
      };
    })()
  : null;
const initialToken = localStorage.getItem("token");

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: Boolean(initialToken),
  token: initialToken,
  user: initialUser,
  login: ({ accessToken, user }) => {
    const normalizedUser: AuthUser = {
      ...user,
      plan: normalizePlan(user.plan),
    };

    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));

    set({
      isAuthenticated: true,
      token: accessToken,
      user: normalizedUser,
    });
  },
  setPlan: (plan) => {
    set((state) => {
      if (!state.user) {
        return {};
      }

      const nextUser = {
        ...state.user,
        plan: normalizePlan(plan),
      };

      localStorage.setItem("user", JSON.stringify(nextUser));

      return { user: nextUser };
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({
      isAuthenticated: false,
      token: null,
      user: null,
    });
  },
}));
