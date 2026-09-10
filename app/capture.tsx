import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import { useCapturedPhoto } from "@/src/camera/captured-photo-context";
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorMessage,
  LoadingView,
  StatusPill
} from "@/src/components/ui";
import { colors, radii, shadows, spacing } from "@/src/theme";

function CaptureContent() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { setPhoto } = useCapturedPhoto();
  const { height } = useWindowDimensions();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const compact = height < 720;

  const openPreview = (uri: string, name: string, type: string, capturedAt: string) => {
    setPhoto({ uri, name, type, capturedAt });
    router.push("/preview");
  };

  const pickPhoto = async () => {
    if (busy) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.8
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      openPreview(
        asset.uri,
        asset.fileName || `cvbuddy-moment-${Date.now()}.jpg`,
        asset.mimeType || "image/jpeg",
        new Date().toISOString()
      );
    } catch {
      setError("Could not open your photo library. Check photo access and try again.");
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || busy) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.8 });

      if (!result?.uri) {
        setError("The camera did not return an image. Try again or choose a photo from your library.");
        return;
      }

      openPreview(result.uri, `cvbuddy-moment-${Date.now()}.jpg`, "image/jpeg", new Date().toISOString());
    } catch {
      setError("Could not capture the photo. Try again or choose a photo from your library.");
    } finally {
      setBusy(false);
    }
  };

  const handlePermissionRequest = async () => {
    setError(null);

    try {
      await requestPermission();
    } catch {
      setError("Camera permission could not be requested. You can still choose a photo from your library.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (!permission) {
    return (
      <LoadingView message="Checking camera access..." />
    );
  }

  if (!permission.granted) {
    return (
      <AppScreen>
        <View style={styles.permissionPage}>
          <AppCard elevated style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <AppText color={colors.primary} selectable={false} style={styles.permissionIconText}>◎</AppText>
            </View>
            <StatusPill label="Permission needed" tone="warning" />
            <View style={styles.permissionCopy}>
              <AppText variant="title">Camera access</AppText>
              <AppText color={colors.textSecondary}>
                CVBuddy uses your camera only when you choose to capture evidence for your private portfolio.
              </AppText>
            </View>
            {error ? <ErrorMessage message={error} /> : null}
            <View style={styles.permissionActions}>
              <AppButton
                onPress={() => void handlePermissionRequest()}
                title={permission.canAskAgain ? "Allow camera" : "Try camera again"}
              />
              <AppButton loading={busy} onPress={() => void pickPhoto()} title="Choose from library" variant="secondary" />
              <AppButton onPress={() => void handleSignOut()} title="Log out" variant="ghost" />
            </View>
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.capturePage}>
        <AppHeader
          action={<AppButton onPress={() => void handleSignOut()} small title="Log out" variant="ghost" />}
          subtitle="Frame one clear piece of portfolio evidence."
          title="Capture a moment"
        />

        <View style={[styles.cameraFrame, compact ? styles.cameraFrameCompact : null]}>
          <CameraView ref={cameraRef} facing={facing} style={StyleSheet.absoluteFill} />
          <View style={styles.cameraTopActions}>
            <StatusPill label={busy ? "Processing" : "Camera ready"} tone={busy ? "warning" : "success"} />
            <Pressable
              accessibilityLabel="Flip camera"
              accessibilityRole="button"
              disabled={busy}
              hitSlop={8}
              onPress={() => setFacing((current) => current === "back" ? "front" : "back")}
              style={({ pressed }) => [styles.flipButton, pressed ? styles.flipButtonPressed : null]}
            >
              <AppText color={colors.white} selectable={false} style={styles.flipButtonText} variant="label">↻ Flip</AppText>
            </Pressable>
          </View>

          <View style={[styles.cameraBottomBar, compact ? styles.cameraBottomBarCompact : null]}>
            <AppButton disabled={busy} onPress={() => void pickPhoto()} small title="Library" variant="secondary" />
            <Pressable
              accessibilityLabel="Take photo"
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: busy }}
              disabled={busy}
              hitSlop={8}
              onPress={() => void takePhoto()}
              style={({ pressed }) => [
                styles.shutterOuter,
                compact ? styles.shutterOuterCompact : null,
                pressed ? styles.shutterPressed : null,
                busy ? styles.shutterDisabled : null
              ]}
            >
              <View style={styles.shutterInner}>
                {busy ? <ActivityIndicator color={colors.textOnPrimary} /> : null}
              </View>
            </Pressable>
            <View style={styles.actionPlaceholder} />
          </View>
        </View>

        <View style={styles.footer}>
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <View style={styles.helperRow}>
              <View style={styles.helperDot} />
              <AppText color={colors.textMuted} variant="caption">
                One photo per Moment. You can review and add a caption before uploading.
              </AppText>
            </View>
          )}
        </View>
      </View>
    </AppScreen>
  );
}

export default function CaptureScreen() {
  return <AuthGuard><CaptureContent /></AuthGuard>;
}

const styles = StyleSheet.create({
  capturePage: { alignSelf: "center", flex: 1, maxWidth: 820, width: "100%" },
  cameraFrame: {
    backgroundColor: colors.cameraBackground,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.xxl,
    borderWidth: 1,
    boxShadow: shadows.floating,
    flex: 1,
    marginHorizontal: spacing.md,
    overflow: "hidden"
  },
  cameraFrameCompact: { borderRadius: radii.xl },
  cameraTopActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg
  },
  flipButton: {
    backgroundColor: colors.overlay,
    borderColor: colors.cameraOverlayBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  flipButtonPressed: { backgroundColor: colors.surfaceElevated },
  flipButtonText: { lineHeight: 18 },
  cameraBottomBar: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    borderColor: colors.cameraControlBorder,
    borderRadius: radii.xl,
    borderWidth: 1,
    bottom: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    left: spacing.lg,
    padding: spacing.md,
    position: "absolute",
    right: spacing.lg
  },
  cameraBottomBarCompact: { bottom: spacing.md, left: spacing.md, right: spacing.md },
  shutterOuter: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.shutterBorder,
    borderRadius: radii.pill,
    borderWidth: 5,
    height: 76,
    justifyContent: "center",
    width: 76
  },
  shutterOuterCompact: { height: 66, width: 66 },
  shutterInner: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: "76%",
    justifyContent: "center",
    width: "76%"
  },
  shutterPressed: { borderColor: colors.primary, transform: [{ scale: 0.94 }] },
  shutterDisabled: { opacity: 0.68 },
  actionPlaceholder: { width: 78 },
  footer: { minHeight: 76, padding: spacing.lg, paddingBottom: spacing.md },
  helperRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  helperDot: { backgroundColor: colors.primary, borderRadius: radii.pill, height: 6, marginTop: 6, width: 6 },
  permissionPage: { alignItems: "center", flex: 1, justifyContent: "center", padding: spacing.xl },
  permissionCard: { gap: spacing.xl, maxWidth: 520, padding: spacing.xxl, width: "100%" },
  permissionIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xl,
    height: 68,
    justifyContent: "center",
    width: 68
  },
  permissionIconText: { fontSize: 36, lineHeight: 40 },
  permissionCopy: { gap: spacing.sm },
  permissionActions: { gap: spacing.md }
});
