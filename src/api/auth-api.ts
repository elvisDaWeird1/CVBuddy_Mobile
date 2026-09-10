import { apiRequest } from "@/src/api/api-client";
import type { AuthData, CurrentAccountData } from "@/src/types/api";

export const login = async (email: string, password: string) => {
  const response = await apiRequest<AuthData>("/auth/login", {
    method: "POST",
    body: { email, password }
  });

  if (!response.data) {
    throw new Error("Login response did not include an account token.");
  }

  return response.data;
};

export const getCurrentAccount = async (token: string, signal?: AbortSignal) => {
  const response = await apiRequest<CurrentAccountData>("/auth/me", { signal, token });

  if (!response.data) {
    throw new Error("Current account response did not include account data.");
  }

  return response.data;
};

export const logout = (token: string) => apiRequest<void>("/auth/logout", { method: "POST", token });
