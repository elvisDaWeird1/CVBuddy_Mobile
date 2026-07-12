import { Redirect } from "expo-router";

import { useAuth } from "@/src/auth/auth-context";
import { LoadingView } from "@/src/components/ui";

export default function Index() {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingView message="Loading CVBuddy..." />;
  }

  return <Redirect href={status === "authenticated" ? "/capture" : "/login"} />;
}
