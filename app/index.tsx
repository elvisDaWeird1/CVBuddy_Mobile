import { Redirect } from "expo-router";

import { useAuth } from "@/src/auth/auth-context";
import { SessionConnectionView } from "@/src/auth/auth-guard";
import { LoadingView } from "@/src/components/ui";

export default function Index() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingView message="Loading CVBuddy..." />;
  }

  if (status === "connection-error") {
    return <SessionConnectionView />;
  }

  return <Redirect href={status === "authenticated" ? "/capture" : "/login"} />;
}
