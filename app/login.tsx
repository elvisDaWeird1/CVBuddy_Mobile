import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "@/src/auth/auth-context";
import { AppButton, ErrorMessage, layoutStyles, ScreenScrollView } from "@/src/components/ui";

export default function LoginScreen() {
  const { status, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated") {
    return <Redirect href="/capture" />;
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenScrollView>
        <View style={{ flex: 1, justifyContent: "center", paddingTop: 48 }}>
          <Text style={layoutStyles.title}>CVBuddy</Text>
          <Text style={layoutStyles.subtitle}>Capture proof of your work and keep your portfolio moving.</Text>

          <Text style={layoutStyles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="applicant@example.com"
            placeholderTextColor="#94A3B8"
            style={layoutStyles.input}
            value={email}
          />

          <Text style={layoutStyles.label}>Password</Text>
          <TextInput
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={layoutStyles.input}
            value={password}
          />

          {error ? <ErrorMessage message={error} /> : null}
          <AppButton loading={submitting} onPress={() => void handleSubmit()} title="Log in" />
        </View>
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}
