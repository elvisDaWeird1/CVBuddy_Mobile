import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/src/auth/auth-context";
import { CapturedPhotoProvider } from "@/src/camera/captured-photo-context";
import { NetworkProvider, NetworkStatusBanner } from "@/src/network/network-context";
import { colors } from "@/src/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <View style={styles.root}>
          <NetworkStatusBanner />
          <AuthProvider>
            <CapturedPhotoProvider>
              <StatusBar backgroundColor={colors.background} style="light" />
              <Stack
                screenOptions={{
                  animation: "slide_from_right",
                  contentStyle: { backgroundColor: colors.background },
                  headerShown: false
                }}
              />
            </CapturedPhotoProvider>
          </AuthProvider>
        </View>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 }
});
