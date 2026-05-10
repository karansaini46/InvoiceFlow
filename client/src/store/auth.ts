import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
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
  logout: () => void;
};

const storedUser = localStorage.getItem("user");
const initialUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
const initialToken = localStorage.getItem("token");

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: Boolean(initialToken),
  token: initialToken,
  user: initialUser,
  login: ({ accessToken, user }) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      isAuthenticated: true,
      token: accessToken,
      user,
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
