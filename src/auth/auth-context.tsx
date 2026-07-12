import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isApiError } from "@/src/api/api-client";
import { getCurrentAccount, login as loginRequest, logout as logoutRequest } from "@/src/api/auth-api";
import { clearStoredToken, getStoredToken, storeToken } from "@/src/auth/token-storage";
import type { Account } from "@/src/types/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SignOutOptions = {
  notifyBackend?: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  account: Account | null;
  login: (email: string, password: string) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const storedToken = await getStoredToken();

      if (!storedToken) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const currentAccount = await getCurrentAccount(storedToken);

        if (!cancelled) {
          setToken(storedToken);
          setAccount(currentAccount.account);
          setStatus("authenticated");
        }
      } catch (error) {
        if (isApiError(error) && error.status !== 401) {
          // A stale or unreachable session should not leave the app on a protected screen.
        }

        await clearStoredToken();

        if (!cancelled) {
          setStatus("unauthenticated");
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email.trim(), password);

    if (result.account.role !== "APPLICANT") {
      throw new Error("Only applicant accounts can use the mobile portfolio flow.");
    }

    await storeToken(result.token);
    setToken(result.token);
    setAccount(result.account);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async ({ notifyBackend = true }: SignOutOptions = {}) => {
    const currentToken = token;

    if (notifyBackend && currentToken) {
      try {
        await logoutRequest(currentToken);
      } catch {
        // Local token removal is the safe fallback when the backend logout call fails.
      }
    }

    await clearStoredToken();
    setToken(null);
    setAccount(null);
    setStatus("unauthenticated");
  }, [token]);

  const value = useMemo(
    () => ({ status, token, account, login, signOut }),
    [account, login, signOut, status, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
