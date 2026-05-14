import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { type AuthSession, useAuthStore } from "@/store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshRequest: Promise<AuthSession> | null = null;

const isAuthRoute = (url?: string) => url?.startsWith("/auth/") ?? false;

const refreshSession = async () => {
  refreshRequest ??= refreshClient
    .post<AuthSession>("/auth/refresh")
    .then((response) => {
      useAuthStore.getState().login(response.data);
      return response.data;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequestConfig | undefined;

    if (
      !request ||
      error.response?.status !== 401 ||
      request._retry ||
      isAuthRoute(request.url)
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      const session = await refreshSession();
      request.headers.Authorization = `Bearer ${session.accessToken}`;

      return api(request);
    } catch (refreshError) {
      useAuthStore.getState().logout();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    }
  },
);
