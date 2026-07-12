import { Redirect } from "expo-router";
import { type ReactNode } from "react";

import { LoadingView } from "@/src/components/ui";
import { useAuth } from "@/src/auth/auth-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingView message="Restoring your session..." />;
  }

  if (status !== "authenticated") {
    return <Redirect href="/login" />;
  }

  return children;
}
