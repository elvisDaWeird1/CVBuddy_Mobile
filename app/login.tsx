import { useRef, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Redirect } from "expo-router";

import { isApiError } from "@/src/api/api-client";
import { useAuth } from "@/src/auth/auth-context";
import { AppButton, AppCard, AppInput, AppText, BrandMark, ErrorMessage, ScreenScrollView } from "@/src/components/ui";
import { colors, radii, spacing } from "@/src/theme";

export default function LoginScreen() {
  const { status, login } = useAuth();
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const requiredError = error === "Enter your email and password to continue.";

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated") {
    return <Redirect href="/capture" />;
  }

  const handleSubmit = async () => {
    if (submittingRef.current) {
      return;
    }

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    submittingRef.current = true;
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (submissionError) {
      if (isApiError(submissionError) && submissionError.status === 401) {
        setError("Email or password is incorrect.");
      } else if (isApiError(submissionError) && submissionError.errors[0]?.message) {
        setError(submissionError.errors[0].message);
      } else {
        setError(submissionError instanceof Error ? submissionError.message : "Login failed. Try again.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}>
      <ScreenScrollView contentContainerStyle={[styles.page, height >= 900 ? styles.pageTall : null]}>
        <View pointerEvents="none" style={styles.ambientTop} />
        <View pointerEvents="none" style={styles.ambientBottom} />

        <View style={styles.intro}>
          <BrandMark />
          <View style={styles.introCopy}>
            <AppText color={colors.primary} variant="eyebrow">Portfolio companion</AppText>
            <AppText variant="display">Make your work visible.</AppText>
            <AppText color={colors.textSecondary}>
              Capture proof of your progress and keep your CV growing, one moment at a time.
            </AppText>
          </View>
        </View>

        <AppCard elevated style={styles.formCard}>
          <View style={styles.formHeading}>
            <AppText variant="sectionTitle">Welcome back</AppText>
            <AppText color={colors.textMuted} variant="caption">Sign in with your applicant account.</AppText>
          </View>

          <AppInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            error={requiredError && !email.trim() ? "Email is required." : null}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="applicant@example.com"
            returnKeyType="next"
            label="Email"
            value={email}
          />

          <AppInput
            autoComplete="password"
            error={requiredError && !password ? "Password is required." : null}
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={() => void handleSubmit()}
            placeholder="Your password"
            returnKeyType="done"
            secureTextEntry
            value={password}
          />

          {error && !requiredError ? <ErrorMessage message={error} /> : null}
          <AppButton loading={submitting} onPress={() => void handleSubmit()} title="Continue securely" />
        </AppCard>

        <View style={styles.securityNote}>
          <View style={styles.securityDot} />
          <AppText color={colors.textMuted} variant="caption">
            Your session is encrypted and stored securely on this device.
          </AppText>
        </View>
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    maxWidth: 560,
    overflow: "hidden",
    paddingBottom: spacing.massive,
    paddingTop: spacing.huge
  },
  pageTall: { justifyContent: "center" },
  ambientTop: {
    backgroundColor: colors.primarySoft,
    borderRadius: 180,
    height: 280,
    opacity: 0.72,
    position: "absolute",
    right: -170,
    top: -110,
    width: 280
  },
  ambientBottom: {
    backgroundColor: colors.infoBackground,
    borderRadius: 130,
    bottom: -90,
    height: 220,
    left: -150,
    opacity: 0.4,
    position: "absolute",
    width: 220
  },
  intro: { gap: spacing.xxl },
  introCopy: { gap: spacing.md, maxWidth: 500 },
  formCard: { borderRadius: radii.xl, gap: spacing.xl, padding: spacing.xxl },
  formHeading: { gap: spacing.xs },
  securityNote: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  securityDot: { backgroundColor: colors.success, borderRadius: radii.pill, height: 6, width: 6 }
});
