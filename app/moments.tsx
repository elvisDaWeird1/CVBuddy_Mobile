import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { isApiError } from "@/src/api/api-client";
import { listMoments } from "@/src/api/portfolio-api";
import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import { AppButton, colors, ErrorMessage, layoutStyles } from "@/src/components/ui";
import type { PortfolioMoment } from "@/src/types/api";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

function MomentCard({ moment }: { moment: PortfolioMoment }) {
  const imageUrl = moment.mediaAssets[0]?.secureUrl;

  return (
    <View style={styles.card}>
      {imageUrl ? <Image accessibilityLabel={moment.caption || "Portfolio moment"} source={{ uri: imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]}><Text style={layoutStyles.muted}>No image URL</Text></View>}
      <Text style={styles.date}>{formatDate(moment.capturedAt)}</Text>
      {moment.caption ? <Text style={styles.caption}>{moment.caption}</Text> : <Text style={styles.emptyCaption}>No caption</Text>}
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{moment.status}</Text>
        <Text style={styles.meta}>{moment.visibility}</Text>
      </View>
      {moment.experience?.title ? <Text style={styles.experience}>Experience: {moment.experience.title}</Text> : null}
    </View>
  );
}

function MomentsContent() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [moments, setMoments] = useState<PortfolioMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoments = useCallback(async (isRefresh = false) => {
    if (!token) {
      return;
    }

    setError(null);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await listMoments(token);
      setMoments(result.items);
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        await signOut({ notifyBackend: false });
        return;
      }

      setError(requestError instanceof Error ? requestError.message : "Could not load moments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [signOut, token]);

  useEffect(() => {
    void loadMoments();
  }, [loadMoments]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={layoutStyles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recent Moments</Text>
          <Text style={styles.subtitle}>Your latest portfolio evidence.</Text>
        </View>
        <AppButton onPress={() => void handleSignOut()} title="Log out" small variant="secondary" />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={moments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl onRefresh={() => void loadMoments(true)} refreshing={refreshing} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? <Text style={layoutStyles.muted}>Loading Moments...</Text> : error ? <ErrorMessage message={error} /> : <Text style={layoutStyles.muted}>No Moments yet. Capture your first one.</Text>}
            {!loading && !error ? <View style={styles.emptyButton}><AppButton onPress={() => router.replace("/capture")} title="Capture a Moment" /></View> : null}
          </View>
        }
        renderItem={({ item }) => <MomentCard moment={item} />}
      />
      {error && moments.length > 0 ? <View style={styles.bottomError}><ErrorMessage message={error} /></View> : null}
    </SafeAreaView>
  );
}

export default function MomentsScreen() {
  return <AuthGuard><MomentsContent /></AuthGuard>;
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.muted, marginTop: 3 },
  list: { gap: 14, padding: 20, paddingTop: 4 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, overflow: "hidden", paddingBottom: 16 },
  image: { backgroundColor: "#E2E8F0", height: 220, width: "100%" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  date: { color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 14 },
  caption: { color: colors.ink, fontSize: 16, lineHeight: 23, marginHorizontal: 16, marginTop: 7 },
  emptyCaption: { color: colors.muted, fontStyle: "italic", marginHorizontal: 16, marginTop: 7 },
  metaRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 12 },
  meta: { backgroundColor: colors.softBlue, borderRadius: 20, color: colors.primaryDark, fontSize: 12, fontWeight: "700", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, textTransform: "capitalize" },
  experience: { color: colors.muted, fontSize: 13, marginHorizontal: 16, marginTop: 10 },
  empty: { alignItems: "center", padding: 30 },
  emptyButton: { marginTop: 18, width: "100%" },
  bottomError: { padding: 20, paddingTop: 0 }
});
