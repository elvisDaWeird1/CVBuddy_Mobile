import NetInfo, { type NetInfoStateType } from "@react-native-community/netinfo";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { abortPendingApiRequests } from "@/src/api/api-client";
import { colors, fontSizes, fontWeights, spacing } from "@/src/theme";

type ConnectionStatus = "offline" | "online" | "unknown";

type NetworkContextValue = {
  status: ConnectionStatus;
  isOnline: boolean;
  reconnectCount: number;
};

type NetworkSnapshot = {
  status: ConnectionStatus;
  type: NetInfoStateType;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

const getConnectionStatus = (
  isConnected: boolean | null,
  isInternetReachable: boolean | null
): ConnectionStatus => {
  if (isConnected === false || isInternetReachable === false) {
    return "offline";
  }

  if (isConnected === true) {
    return "online";
  }

  return "unknown";
};

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [reconnectCount, setReconnectCount] = useState(0);
  const previousSnapshot = useRef<NetworkSnapshot | null>(null);

  useEffect(() => NetInfo.addEventListener((state) => {
    const nextStatus = getConnectionStatus(state.isConnected, state.isInternetReachable);
    const previous = previousSnapshot.current;
    const connectionTypeChanged = previous !== null && previous.type !== state.type;
    const connectionRestored = previous?.status === "offline" && nextStatus === "online";
    const onlineTransportChanged = connectionTypeChanged && nextStatus === "online";

    if (nextStatus === "offline") {
      abortPendingApiRequests("offline");
    } else if (connectionTypeChanged) {
      abortPendingApiRequests("network-change");
    }

    if (connectionRestored || onlineTransportChanged) {
      setReconnectCount((count) => count + 1);
    }

    previousSnapshot.current = { status: nextStatus, type: state.type };
    setStatus(nextStatus);
  }), []);

  const value = useMemo<NetworkContextValue>(() => ({
    isOnline: status !== "offline",
    reconnectCount,
    status
  }), [reconnectCount, status]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export const useNetworkStatus = () => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error("useNetworkStatus must be used inside NetworkProvider");
  }

  return context;
};

export function NetworkStatusBanner() {
  const { status } = useNetworkStatus();

  if (status !== "offline") {
    return null;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.banner}>
        <View style={styles.dot} />
        <Text style={styles.text}>No internet connection. Requests are paused until the device reconnects.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.errorBackground },
  banner: {
    alignItems: "center",
    backgroundColor: colors.errorBackground,
    borderBottomColor: colors.error,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  dot: { backgroundColor: colors.error, borderRadius: 4, height: 7, width: 7 },
  text: {
    color: colors.error,
    flexShrink: 1,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    textAlign: "center"
  }
});
