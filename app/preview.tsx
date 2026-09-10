import { useRef, useState } from "react";
import { KeyboardAvoidingView, Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { Redirect, useRouter } from "expo-router";

import { isApiError } from "@/src/api/api-client";
import { createMoment } from "@/src/api/portfolio-api";
import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import { useCapturedPhoto } from "@/src/camera/captured-photo-context";
import {
  AppButton,
  AppCard,
  AppHeader,
  AppInput,
  AppText,
  ErrorMessage,
  ScreenScrollView,
  StatusPill
} from "@/src/components/ui";
import { colors, radii, shadows, spacing } from "@/src/theme";
import type { PortfolioMoment } from "@/src/types/api";

function PreviewContent() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const { photo, clearPhoto } = useCapturedPhoto();
  const { width } = useWindowDimensions();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedMoment, setUploadedMoment] = useState<PortfolioMoment | null>(null);
  const wide = width >= 640;

  if (!photo || !token) {
    return <Redirect href="/capture" />;
  }

  const handleRetake = () => {
    clearPhoto();
    router.replace("/capture");
  };

  const handleUpload = async () => {
    if (uploadingRef.current) {
      return;
    }

    uploadingRef.current = true;
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

      if (
        isApiError(uploadError) &&
        (uploadError.kind === "network" || uploadError.kind === "timeout")
      ) {
        setError(
          `${uploadError.message} The upload is not retried automatically; check Recent Moments before retrying because the server may already have received it.`
        );
      } else {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Try again.");
      }
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  if (uploadedMoment) {
    return (
      <ScreenScrollView contentContainerStyle={styles.successPage}>
        <View style={styles.successHero}>
          <View style={styles.successIcon}>
            <AppText color={colors.success} selectable={false} style={styles.successIconText}>✓</AppText>
          </View>
          <StatusPill label="Upload complete" tone="success" />
          <View style={styles.successCopy}>
            <AppText style={styles.centerText} variant="title">Moment uploaded</AppText>
            <AppText color={colors.textSecondary} style={styles.centerText}>
              Your photo is now stored as private portfolio evidence.
            </AppText>
          </View>
        </View>

        <AppCard elevated style={styles.resultCard}>
          <Image accessibilityLabel="Uploaded moment" resizeMode="cover" source={{ uri: photo.uri }} style={styles.resultImage} />
          <View style={styles.resultBody}>
            <View style={styles.resultMetaRow}>
              <StatusPill label="Private" tone="primary" />
              <AppText color={colors.textMuted} style={styles.monoText} variant="caption">
                ID {uploadedMoment.id}
              </AppText>
            </View>
            {uploadedMoment.caption ? (
              <AppText>{uploadedMoment.caption}</AppText>
            ) : (
              <AppText color={colors.textMuted}>No caption added.</AppText>
            )}
          </View>
        </AppCard>

        <View style={[styles.actions, wide ? styles.actionsWide : null]}>
          <AppButton
            fullWidth={!wide}
            onPress={handleRetake}
            style={wide ? styles.wideButton : null}
            title="Capture another"
          />
          <AppButton
            fullWidth={!wide}
            onPress={() => router.push("/moments")}
            style={wide ? styles.wideButton : null}
            title="View recent Moments"
            variant="secondary"
          />
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}>
      <ScreenScrollView>
        <AppHeader
          action={<StatusPill label="Not uploaded" tone="warning" />}
          inset={false}
          subtitle="Check the image and add helpful context."
          title="Review your photo"
        />

        <View style={styles.previewFrame}>
          <Image
            accessibilityLabel="Photo preview"
            resizeMode="cover"
            source={{ uri: photo.uri }}
            style={[styles.previewImage, { height: Math.min(width * 0.9, 430) }]}
          />
          <View style={styles.previewMeta}>
            <View style={styles.previewMetaDot} />
            <AppText color={colors.textSecondary} variant="caption">Ready to upload</AppText>
          </View>
        </View>

        <AppCard style={styles.captionCard}>
          <View style={styles.captionHeading}>
            <AppText variant="sectionTitle">Tell the story</AppText>
            <AppText color={colors.textSecondary}>
              A short caption helps you remember the impact behind this work.
            </AppText>
          </View>
          <AppInput
            containerStyle={styles.captionInput}
            hint={`${caption.length}/500 characters`}
            label="Caption (optional)"
            maxLength={500}
            multiline
            onChangeText={setCaption}
            placeholder="What did you make, improve, or learn?"
            style={styles.multilineInput}
            textAlignVertical="top"
            value={caption}
          />
        </AppCard>

        {error ? <ErrorMessage message={error} /> : null}
        <View style={[styles.actions, wide ? styles.actionsWide : null]}>
          <AppButton
            fullWidth={!wide}
            loading={uploading}
            onPress={() => void handleUpload()}
            style={wide ? styles.wideButton : null}
            title="Upload Moment"
          />
          <AppButton
            disabled={uploading}
            fullWidth={!wide}
            onPress={handleRetake}
            style={wide ? styles.wideButton : null}
            title="Retake"
            variant="secondary"
          />
        </View>
      </ScreenScrollView>
    </KeyboardAvoidingView>
  );
}

export default function PreviewScreen() {
  return <AuthGuard><PreviewContent /></AuthGuard>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  previewFrame: {
    backgroundColor: colors.cameraBackground,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    borderWidth: 1,
    boxShadow: shadows.card,
    overflow: "hidden"
  },
  previewImage: { backgroundColor: colors.cameraBackground, width: "100%" },
  previewMeta: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  previewMetaDot: { backgroundColor: colors.success, borderRadius: radii.pill, height: 7, width: 7 },
  captionCard: { gap: spacing.xl },
  captionHeading: { gap: spacing.sm },
  captionInput: { gap: spacing.sm },
  multilineInput: { minHeight: 124, paddingTop: spacing.lg },
  actions: { gap: spacing.md },
  actionsWide: { flexDirection: "row" },
  wideButton: { flex: 1 },
  successPage: { justifyContent: "center", maxWidth: 660 },
  successHero: { alignItems: "center", gap: spacing.lg },
  successIcon: {
    alignItems: "center",
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  successIconText: { fontSize: 34, fontWeight: "800", lineHeight: 40 },
  successCopy: { gap: spacing.sm, maxWidth: 480 },
  centerText: { textAlign: "center" },
  resultCard: { overflow: "hidden", padding: 0 },
  resultImage: { backgroundColor: colors.cameraBackground, height: 280, width: "100%" },
  resultBody: { gap: spacing.lg, padding: spacing.xl },
  resultMetaRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  monoText: { flex: 1, fontVariant: ["tabular-nums"], textAlign: "right" }
});
