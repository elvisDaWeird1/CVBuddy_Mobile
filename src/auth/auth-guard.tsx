import { Redirect } from "expo-router";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppScreen, ErrorState, LoadingView } from "@/src/components/ui";
import { useAuth } from "@/src/auth/auth-context";

export function SessionConnectionView() {
  const { retrySession, sessionError } = useAuth();

  return (
    <AppScreen>
      <View style={styles.recovery}>
        <ErrorState
          message={sessionError || "CVBuddy could not verify the saved session because the backend is unreachable."}
          onRetry={() => void retrySession()}
        />
      </View>
    </AppScreen>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingView message="Restoring your session..." />;
  }

  if (status === "connection-error") {
    return <SessionConnectionView />;
  }

  if (status !== "authenticated") {
    return <Redirect href="/login" />;
  }

  return children;
}

const styles = StyleSheet.create({
  recovery: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 }
});
