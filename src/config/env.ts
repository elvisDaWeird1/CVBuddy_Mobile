import Constants from "expo-constants";

export type ApiMode = "lan" | "tunnel" | "remote";

const requestedMode = process.env.EXPO_PUBLIC_API_MODE?.trim().toLowerCase();
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configuredApiPort = process.env.EXPO_PUBLIC_API_PORT?.trim() || "5000";

const apiMode: ApiMode = (() => {
  if (!requestedMode) {
    return __DEV__ ? "lan" : "remote";
  }

  if (requestedMode === "lan" || requestedMode === "tunnel" || requestedMode === "remote") {
    return requestedMode;
  }

  throw new Error(
    "EXPO_PUBLIC_API_MODE must be lan, tunnel, or remote."
  );
})();

const validatePort = (value: string) => {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("EXPO_PUBLIC_API_PORT must be a valid TCP port (1-65535).");
  }

  return port;
};

const validateApiUrl = (value: string, requireHttps: boolean) => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be a complete URL such as https://api-dev.example.com/api."
    );
  }

  if (!(parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) {
    throw new Error("EXPO_PUBLIC_API_URL must use http:// or https://.");
  }

  if (requireHttps && parsedUrl.protocol !== "https:") {
    throw new Error("Tunnel, remote, and production API URLs must use HTTPS.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("EXPO_PUBLIC_API_URL must not contain credentials.");
  }

  if (parsedUrl.search || parsedUrl.hash) {
    throw new Error("EXPO_PUBLIC_API_URL must not contain a query string or fragment.");
  }

  const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "");

  if (!normalizedPath.endsWith("/api")) {
    throw new Error("EXPO_PUBLIC_API_URL must include the backend /api path.");
  }

  parsedUrl.pathname = normalizedPath;

  return parsedUrl.toString().replace(/\/+$/, "");
};

const getHostFromRuntimeUri = (runtimeUri: string | null | undefined) => {
  if (!runtimeUri) {
    return null;
  }

  try {
    const parsedUri = new URL(
      runtimeUri.includes("://") ? runtimeUri : `http://${runtimeUri}`
    );

    return parsedUri.hostname || null;
  } catch {
    return null;
  }
};

const getMetroHost = () => {
  const runtimeUris = [
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    Constants.experienceUrl,
    Constants.expoGoConfig?.debuggerHost
  ];

  for (const runtimeUri of runtimeUris) {
    const host = getHostFromRuntimeUri(runtimeUri);

    if (host) {
      return host;
    }
  }

  throw new Error(
    "Expo has not provided a LAN host for this runtime yet. Reload Expo Go from the current npm run start:lan QR code, or use tunnel/remote mode with EXPO_PUBLIC_API_URL."
  );
};

const resolveApiUrl = () => {
  if (apiMode === "lan") {
    if (!__DEV__) {
      throw new Error("LAN API discovery is development-only. Configure an HTTPS remote API for production.");
    }

    const port = validatePort(configuredApiPort);
    const metroHost = getMetroHost();

    return validateApiUrl(`http://${metroHost}:${port}/api`, false);
  }

  if (!configuredApiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is required in tunnel/remote mode. Set it to the fixed HTTPS backend URL and reload Expo Go."
    );
  }

  return validateApiUrl(configuredApiUrl, true);
};

let lastLoggedApiUrl: string | null = null;

export const getApiUrl = () => {
  const url = resolveApiUrl();

  if (__DEV__ && url !== lastLoggedApiUrl) {
    console.info("[CVBuddy API] configuration", {
      baseUrl: url,
      mode: apiMode
    });
    lastLoggedApiUrl = url;
  }

  return url;
};

export const API_CONFIG = Object.freeze({
  mode: apiMode,
  port: validatePort(configuredApiPort),
  get url() {
    return getApiUrl();
  }
});
