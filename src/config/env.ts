const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (__DEV__ && !configuredApiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is missing. Copy mobile/.env.example to mobile/.env and set a reachable backend URL."
  );
}

export const API_URL = (configuredApiUrl || "http://localhost:5000/api").replace(/\/+$/, "");
