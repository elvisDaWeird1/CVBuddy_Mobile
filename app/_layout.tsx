import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/src/auth/auth-context";
import { CapturedPhotoProvider } from "@/src/camera/captured-photo-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CapturedPhotoProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
        </CapturedPhotoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
