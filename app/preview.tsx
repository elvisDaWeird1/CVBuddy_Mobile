import { useState } from "react";
import { KeyboardAvoidingView, Platform, Image, Text, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";

import { isApiError } from "@/src/api/api-client";
import { createMoment } from "@/src/api/portfolio-api";
import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import { useCapturedPhoto } from "@/src/camera/captured-photo-context";
import { AppButton, colors, ErrorMessage, layoutStyles, ScreenScrollView } from "@/src/components/ui";
import type { PortfolioMoment } from "@/src/types/api";

function PreviewContent() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const { photo, clearPhoto } = useCapturedPhoto();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMoment, setUploadedMoment] = useState<PortfolioMoment | null>(null);

  if (!photo || !token) {
    return <Redirect href="/capture" />;
  }

  const handleRetake = () => {
    clearPhoto();
    router.replace("/capture");
  };

  const handleUpload = async () => {
    setError(null);
    setUploading(true);

    try {
      const moment = await createMoment({ token, photo, caption });
      setUploadedMoment(moment);
    } catch (uploadError) {
      if (isApiError(uploadError) && uploadError.status === 401) {
        await signOut({ notifyBackend: false });
        return;
      }

      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  if (uploadedMoment) {
    return (
      <ScreenScrollView>
        <Text style={layoutStyles.title}>Moment uploaded</Text>
        <Text style={layoutStyles.subtitle}>Your photo is now stored as a private Portfolio Moment.</Text>
        <View style={layoutStyles.card}>
          <Image accessibilityLabel="Uploaded moment" source={{ uri: photo.uri }} style={{ borderRadius: 12, height: 260, width: "100%" }} />
          <Text style={[layoutStyles.success, { marginTop: 14 }]}>Upload successful</Text>
          <Text style={[layoutStyles.muted, { marginTop: 6 }]}>Moment ID: {uploadedMoment.id}</Text>
          {uploadedMoment.caption ? <Text style={[layoutStyles.muted, { marginTop: 6 }]}>{uploadedMoment.caption}</Text> : null}
        </View>
        <View style={{ height: 14 }} />
        <AppButton onPress={handleRetake} title="Capture another" />
        <View style={{ height: 12 }} />
        <AppButton onPress={() => router.push("/moments")} title="View recent Moments" variant="secondary" />
      </ScreenScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenScrollView>
        <Text style={layoutStyles.sectionTitle}>Review your photo</Text>
        <Text style={layoutStyles.subtitle}>Check the image before adding it to your portfolio.</Text>
        <Image accessibilityLabel="Photo preview" source={{ uri: photo.uri }} style={{ backgroundColor: colors.ink, borderRadius: 16, height: 360, width: "100%" }} />

        <Text style={[layoutStyles.label, { marginTop: 22 }]}>Caption (optional)</Text>
        <TextInput
          multiline
          maxLength={500}
          onChangeText={setCaption}
          placeholder="What does this moment show?"
          placeholderTextColor="#94A3B8"
          style={[layoutStyles.input, { minHeight: 100, paddingTop: 14, textAlignVertical: "top" }]}
          value={caption}
        />

        {error ? <ErrorMessage message={error} /> : null}
        <AppButton loading={uploading} onPress={() => void handleUpload()} title="Upload Moment" />
        <View style={{ height: 12 }} />
        <AppButton disabled={uploading} onPress={handleRetake} title="Retake" variant="secondary" />
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}

export default function PreviewScreen() {
  return <AuthGuard><PreviewContent /></AuthGuard>;
}
