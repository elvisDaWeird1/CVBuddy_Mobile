import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import { isApiError, isRecoverableConnectionError } from "@/src/api/api-client";
import { getCurrentAccount, login as loginRequest, logout as logoutRequest } from "@/src/api/auth-api";
import { clearStoredToken, getStoredToken, storeToken } from "@/src/auth/token-storage";
import { useNetworkStatus } from "@/src/network/network-context";
import type { Account } from "@/src/types/api";

type AuthStatus = "authenticated" | "connection-error" | "loading" | "unauthenticated";

type SignOutOptions = {
  notifyBackend?: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  account: Account | null;
  sessionError: string | null;
  login: (email: string, password: string) => Promise<void>;
  retrySession: () => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { reconnectCount } = useNetworkStatus();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const hydrateController = useRef<AbortController | null>(null);
  const previousReconnectCount = useRef(reconnectCount);

  const hydrateSession = useCallback(async () => {
    hydrateController.current?.abort();

    const controller = new AbortController();
    hydrateController.current = controller;
    setStatus("loading");
    setSessionError(null);

    try {
      const storedToken = await getStoredToken();

      if (controller.signal.aborted) {
        return;
      }

      if (!storedToken) {
        setToken(null);
        setAccount(null);
        setStatus("unauthenticated");
        return;
      }

      try {
        const currentAccount = await getCurrentAccount(storedToken, controller.signal);

        if (!controller.signal.aborted) {
          setToken(storedToken);
          setAccount(currentAccount.account);
          setStatus("authenticated");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (isRecoverableConnectionError(error)) {
          setToken(storedToken);
          setAccount(null);
          setSessionError(error.message);
          setStatus("connection-error");
          return;
        }

        await clearStoredToken();

        if (!controller.signal.aborted) {
          setToken(null);
          setAccount(null);
          setStatus("unauthenticated");
        }
      }
    } finally {
      if (hydrateController.current === controller) {
        hydrateController.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void hydrateSession();

    return () => hydrateController.current?.abort();
  }, [hydrateSession]);

  useEffect(() => {
    const connectionWasRestored = reconnectCount > previousReconnectCount.current;
    previousReconnectCount.current = reconnectCount;

    if (connectionWasRestored && status === "connection-error") {
      void hydrateSession();
    }
  }, [hydrateSession, reconnectCount, status]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email.trim(), password);

    if (result.account.role !== "APPLICANT") {
      throw new Error("Only applicant accounts can use the mobile portfolio flow.");
    }

    await storeToken(result.token);
    setToken(result.token);
    setAccount(result.account);
    setSessionError(null);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async ({ notifyBackend = true }: SignOutOptions = {}) => {
    hydrateController.current?.abort();
    const currentToken = token;

    if (notifyBackend && currentToken) {
      try {
        await logoutRequest(currentToken);
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          // The local session is already invalid and can be safely removed.
        }
      }
    }

    await clearStoredToken();
    setToken(null);
    setAccount(null);
    setSessionError(null);
    setStatus("unauthenticated");
  }, [token]);

  const value = useMemo(
    () => ({
      status,
      token,
      account,
      sessionError,
      login,
      retrySession: hydrateSession,
      signOut
    }),
    [account, hydrateSession, login, sessionError, signOut, status, token]
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
