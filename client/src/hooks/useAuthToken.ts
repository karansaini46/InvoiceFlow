import { useAuthStore } from "@/store/auth";

export function useAuthToken() {
  return useAuthStore((state) => state.token);
}
