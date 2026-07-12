import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import { useCapturedPhoto } from "@/src/camera/captured-photo-context";
import { AppButton, colors, ErrorMessage, layoutStyles } from "@/src/components/ui";

function CaptureContent() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { setPhoto } = useCapturedPhoto();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openPreview = (uri: string, name: string, type: string, capturedAt: string) => {
    setPhoto({ uri, name, type, capturedAt });
    router.push("/preview");
  };

  const pickPhoto = async () => {
    setError(null);
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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (!permission) {
    return <View style={layoutStyles.centered}><Text style={layoutStyles.muted}>Checking camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={layoutStyles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={layoutStyles.sectionTitle}>Camera access</Text>
          <Text style={layoutStyles.subtitle}>CVBuddy needs camera access so you can capture evidence for your portfolio.</Text>
          {error ? <ErrorMessage message={error} /> : null}
          <AppButton onPress={() => void requestPermission()} title={permission.canAskAgain ? "Allow camera" : "Try camera again"} />
          <View style={styles.permissionGap} />
          <AppButton onPress={() => void pickPhoto()} title="Choose from photo library" variant="secondary" />
          <View style={styles.permissionGap} />
          <AppButton onPress={() => void handleSignOut()} title="Log out" variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={layoutStyles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Capture a moment</Text>
          <Text style={styles.headerSubtitle}>Add evidence to your portfolio.</Text>
        </View>
        <AppButton onPress={() => void handleSignOut()} title="Log out" small variant="secondary" />
      </View>

      <View style={styles.cameraFrame}>
        <CameraView ref={cameraRef} facing={facing} style={StyleSheet.absoluteFill} />
        <View style={styles.cameraTopActions}>
          <Pressable accessibilityRole="button" onPress={() => setFacing(current => current === "back" ? "front" : "back")} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>Flip</Text>
          </Pressable>
        </View>
        <View style={styles.cameraBottomActions}>
          <AppButton onPress={() => void pickPhoto()} title="Library" small variant="secondary" />
          <Pressable accessibilityLabel="Take photo" accessibilityRole="button" disabled={busy} onPress={() => void takePhoto()} style={[styles.shutter, busy ? styles.shutterDisabled : null]} />
          <View style={styles.actionPlaceholder} />
        </View>
      </View>

      <View style={styles.footer}>
        {error ? <ErrorMessage message={error} /> : <Text style={layoutStyles.muted}>One photo per Moment. You can review it before uploading.</Text>}
      </View>
    </SafeAreaView>
  );
}

export default function CaptureScreen() {
  return <AuthGuard><CaptureContent /></AuthGuard>;
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  headerSubtitle: { color: colors.muted, marginTop: 3 },
  cameraFrame: { backgroundColor: "#101827", flex: 1, marginHorizontal: 12, overflow: "hidden", borderRadius: 20 },
  cameraTopActions: { alignItems: "flex-end", padding: 16 },
  switchButton: { backgroundColor: "rgba(15, 23, 42, 0.72)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  switchButtonText: { color: "#FFFFFF", fontWeight: "700" },
  cameraBottomActions: { alignItems: "center", bottom: 24, flexDirection: "row", justifyContent: "space-between", left: 20, position: "absolute", right: 20 },
  shutter: { backgroundColor: "#FFFFFF", borderColor: colors.primary, borderRadius: 40, borderWidth: 7, height: 76, width: 76 },
  shutterDisabled: { opacity: 0.6 },
  actionPlaceholder: { width: 72 },
  footer: { minHeight: 70, paddingHorizontal: 20, paddingTop: 14 },
  permissionContainer: { flex: 1, justifyContent: "center", padding: 24 },
  permissionGap: { height: 12 }
});
