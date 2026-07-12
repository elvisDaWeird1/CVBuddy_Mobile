import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

export const colors = {
  ink: "#172033",
  muted: "#64748B",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#D9E2EC",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  danger: "#B42318",
  success: "#16794F",
  softBlue: "#E8F0FF"
};

export const layoutStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginBottom: 24 },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: "700", marginBottom: 6 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    marginBottom: 16
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16
  },
  muted: { color: colors.muted },
  error: { color: colors.danger, lineHeight: 20 },
  success: { color: colors.success, lineHeight: 20 }
});

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
};

export function AppButton({ title, onPress, disabled = false, loading = false, variant = "primary", small = false }: ButtonProps) {
  const backgroundColor = variant === "primary"
    ? colors.primary
    : variant === "danger"
      ? colors.danger
      : colors.surface;
  const textColor = variant === "secondary" ? colors.primary : colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: variant === "secondary" ? colors.primary : backgroundColor },
        small ? styles.smallButton : null,
        disabled || loading ? styles.disabled : null,
        pressed && !disabled && !loading ? styles.pressed : null
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }, small ? styles.smallButtonText : null]}>{title}</Text>}
    </Pressable>
  );
}

export function LoadingView({ message }: { message: string }) {
  return (
    <SafeAreaView style={layoutStyles.safe}>
      <View style={layoutStyles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[layoutStyles.muted, styles.loadingText]}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <Text accessibilityRole="alert" style={[layoutStyles.error, styles.message]}>{message}</Text>;
}

export function ScreenScrollView({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={layoutStyles.safe}>
      <ScrollView contentContainerStyle={layoutStyles.page} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 18,
    width: "100%"
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  smallButton: { minHeight: 38, paddingHorizontal: 12, width: "auto" },
  smallButtonText: { fontSize: 13 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  loadingText: { marginTop: 12 },
  message: { marginBottom: 14, marginTop: 2 }
});
