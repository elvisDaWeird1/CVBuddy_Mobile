import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

import { isApiError, isRecoverableConnectionError } from "@/src/api/api-client";
import { listMoments } from "@/src/api/portfolio-api";
import { useAuth } from "@/src/auth/auth-context";
import { AuthGuard } from "@/src/auth/auth-guard";
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorMessage,
  ErrorState,
  LoadingState,
  StatusPill
} from "@/src/components/ui";
import { useNetworkStatus } from "@/src/network/network-context";
import { colors, radii, shadows, spacing } from "@/src/theme";
import type { PortfolioMoment } from "@/src/types/api";

const formatDate = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric"
      });
};

function MomentCard({ moment }: { moment: PortfolioMoment }) {
  const imageUrl = moment.mediaAssets[0]?.secureUrl;
  const statusTone = moment.status.toLowerCase() === "published" ? "success" : "neutral";

  return (
    <AppCard elevated style={styles.card}>
      {imageUrl ? (
        <Image
          accessibilityLabel={moment.caption || "Portfolio moment"}
          resizeMode="cover"
          source={{ uri: imageUrl }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <View style={styles.imageFallbackIcon}>
            <AppText color={colors.textMuted} selectable={false} style={styles.imageFallbackSymbol}>◇</AppText>
          </View>
          <AppText color={colors.textMuted} variant="caption">Image unavailable</AppText>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <AppText color={colors.textMuted} style={styles.date} variant="caption">
            {formatDate(moment.capturedAt)}
          </AppText>
          <View style={styles.pillRow}>
            <StatusPill label={moment.status} tone={statusTone} />
            <StatusPill label={moment.visibility} tone="primary" />
          </View>
        </View>

        {moment.caption ? (
          <AppText style={styles.caption}>{moment.caption}</AppText>
        ) : (
          <AppText color={colors.textMuted} style={styles.emptyCaption}>No caption added.</AppText>
        )}

        {moment.experience?.title ? (
          <View style={styles.experienceRow}>
            <View style={styles.experienceDot} />
            <AppText color={colors.textSecondary} style={styles.experience} variant="caption">
              {moment.experience.title}
            </AppText>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
}

function MomentsContent() {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const { reconnectCount } = useNetworkStatus();
  const { width } = useWindowDimensions();
  const [moments, setMoments] = useState<PortfolioMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryOnReconnect, setRetryOnReconnect] = useState(false);
  const previousReconnectCount = useRef(reconnectCount);
  const columns = width >= 820 ? 2 : 1;

  const loadMoments = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (!token) {
      return;
    }

    setError(null);
    setRetryOnReconnect(false);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await listMoments(token, signal);

      if (!signal?.aborted) {
        setMoments(result.items);
      }
    } catch (requestError) {
      if (isApiError(requestError) && requestError.kind === "cancelled") {
        return;
      }

      if (isApiError(requestError) && requestError.status === 401) {
        await signOut({ notifyBackend: false });
        return;
      }

      if (!signal?.aborted) {
        setRetryOnReconnect(isRecoverableConnectionError(requestError));
        setError(requestError instanceof Error ? requestError.message : "Could not load moments.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [signOut, token]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMoments(false, controller.signal);

    return () => controller.abort();
  }, [loadMoments]);

  useEffect(() => {
    const connectionWasRestored = reconnectCount > previousReconnectCount.current;
    previousReconnectCount.current = reconnectCount;

    if (connectionWasRestored && retryOnReconnect) {
      void loadMoments();
    }
  }, [loadMoments, reconnectCount, retryOnReconnect]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <AppScreen>
      <View style={styles.page}>
        <AppHeader
          action={<AppButton onPress={() => void handleSignOut()} small title="Log out" variant="ghost" />}
          subtitle="A private timeline of your latest portfolio evidence."
          title="Recent Moments"
        />
        <FlatList
          columnWrapperStyle={columns > 1 ? styles.columns : undefined}
          contentContainerStyle={[styles.list, moments.length === 0 ? styles.emptyList : null]}
          contentInsetAdjustmentBehavior="automatic"
          data={moments}
          key={`moments-${columns}`}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={() => void loadMoments(true)}
              progressBackgroundColor={colors.surfaceSecondary}
              refreshing={refreshing}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            loading ? (
              <LoadingState message="Loading your Moments..." />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void loadMoments()} />
            ) : (
              <EmptyState
                actionTitle="Capture your first Moment"
                message="Photos you upload as portfolio evidence will appear here in a calm, private timeline."
                onAction={() => router.replace("/capture")}
                symbol="＋"
                title="Your timeline is ready"
              />
            )
          }
          renderItem={({ item }) => <MomentCard moment={item} />}
          showsVerticalScrollIndicator={false}
        />
        {error && moments.length > 0 ? (
          <View style={styles.bottomError}>
            <ErrorMessage message={error} />
            <AppButton onPress={() => void loadMoments()} small title="Retry" variant="secondary" />
          </View>
        ) : null}
      </View>
    </AppScreen>
  );
}

export default function MomentsScreen() {
  return <AuthGuard><MomentsContent /></AuthGuard>;
}

const styles = StyleSheet.create({
  page: { alignSelf: "center", flex: 1, maxWidth: 1080, width: "100%" },
  list: { gap: spacing.lg, padding: spacing.xl, paddingTop: spacing.xs },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  columns: { gap: spacing.lg },
  card: {
    borderRadius: radii.xl,
    boxShadow: shadows.card,
    flex: 1,
    overflow: "hidden",
    padding: 0
  },
  image: { backgroundColor: colors.cameraBackground, height: 220, width: "100%" },
  imageFallback: { alignItems: "center", gap: spacing.sm, justifyContent: "center" },
  imageFallbackIcon: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  imageFallbackSymbol: { fontSize: 24, lineHeight: 28 },
  cardBody: { gap: spacing.md, padding: spacing.lg },
  cardTopRow: { gap: spacing.md },
  date: { fontVariant: ["tabular-nums"] },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  caption: { fontSize: 17, lineHeight: 25 },
  emptyCaption: { fontStyle: "italic" },
  experienceRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  experienceDot: { backgroundColor: colors.info, borderRadius: radii.pill, height: 6, width: 6 },
  experience: { flex: 1 },
  bottomError: {
    alignItems: "center",
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  }
});
