import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

import { getApiUrl } from "@/src/config/env";
import type { ApiErrorItem, ApiResponse } from "@/src/types/api";

const REQUEST_TIMEOUT_MS = 20_000;

export type ApiErrorKind =
  | "cancelled"
  | "configuration"
  | "http"
  | "invalid-response"
  | "network"
  | "offline"
  | "timeout";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiErrorItem[];
  readonly kind: ApiErrorKind;

  constructor(
    status: number,
    message: string,
    errors: ApiErrorItem[] = [],
    kind: ApiErrorKind = "http"
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.kind = kind;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const isRecoverableConnectionError = (error: unknown): error is ApiError =>
  isApiError(error) && (
    error.kind === "configuration" ||
    error.kind === "network" ||
    error.kind === "offline" ||
    error.kind === "timeout"
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseErrors = (value: unknown): ApiErrorItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): ApiErrorItem[] => {
    if (!isRecord(item) || typeof item.message !== "string") {
      return [];
    }

    return [{
      field: typeof item.field === "string" ? item.field : undefined,
      message: item.message
    }];
  });
};

type RequestBody = FormData | Record<string, string>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: RequestBody;
  signal?: AbortSignal;
};

type AbortCause = "external" | "network-change" | "offline" | "timeout";

type ActiveRequest = {
  cause: AbortCause | null;
};

const activeRequests = new Map<AbortController, ActiveRequest>();

export const abortPendingApiRequests = (cause: "network-change" | "offline") => {
  for (const [controller, request] of activeRequests) {
    request.cause = cause;
    controller.abort();
  }
};

const isFormData = (body: RequestBody | undefined): body is FormData =>
  typeof FormData !== "undefined" && body instanceof FormData;

const getNetworkState = async (): Promise<NetInfoState | null> => {
  try {
    return await NetInfo.fetch();
  } catch {
    return null;
  }
};

const isDefinitelyOffline = (state: NetInfoState | null) =>
  state?.isConnected === false || state?.isInternetReachable === false;

const offlineError = () => new ApiError(
  0,
  "No internet connection. Reconnect the device and try again.",
  [],
  "offline"
);

const abortError = (cause: AbortCause | null) => {
  if (cause === "timeout") {
    return new ApiError(
      408,
      "The CVBuddy backend did not respond in time. Check that it is running and that the LAN or tunnel URL is reachable.",
      [],
      "timeout"
    );
  }

  if (cause === "offline") {
    return offlineError();
  }

  if (cause === "network-change") {
    return new ApiError(
      0,
      "The network changed while the request was running. Wait for the connection to settle, then try again.",
      [],
      "network"
    );
  }

  return new ApiError(0, "The request was cancelled.", [], "cancelled");
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const method = options.method || "GET";
  let apiUrl: string;

  try {
    apiUrl = getApiUrl();
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "The API URL could not be resolved.",
      [],
      "configuration"
    );
  }

  const requestUrl = `${apiUrl}${path}`;
  const startedAt = Date.now();
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;

  if (options.body) {
    if (isFormData(options.body)) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const controller = new AbortController();
  const activeRequest: ActiveRequest = { cause: null };
  activeRequests.set(controller, activeRequest);

  const abortFromCaller = () => {
    activeRequest.cause = "external";
    controller.abort();
  };

  if (options.signal?.aborted) {
    abortFromCaller();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timeout = setTimeout(() => {
    activeRequest.cause = "timeout";
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  if (__DEV__) {
    console.info("[CVBuddy API] request", { method, url: requestUrl });
  }

  try {
    const networkState = await getNetworkState();

    if (isDefinitelyOffline(networkState)) {
      throw offlineError();
    }

    if (controller.signal.aborted) {
      throw abortError(activeRequest.cause);
    }

    const response = await fetch(requestUrl, {
      method,
      headers,
      body,
      signal: controller.signal
    });
    const rawBody = await response.text();
    let parsedBody: unknown = null;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        throw new ApiError(
          response.status,
          "The server returned a response that was not valid JSON.",
          [],
          "invalid-response"
        );
      }
    }

    if (__DEV__) {
      console.info("[CVBuddy API] response", {
        durationMs: Date.now() - startedAt,
        method,
        status: response.status,
        url: requestUrl
      });
    }

    if (!response.ok) {
      const errorPayload = isRecord(parsedBody) ? parsedBody : {};
      throw new ApiError(
        response.status,
        typeof errorPayload.message === "string" ? errorPayload.message : `Request failed with HTTP ${response.status}`,
        parseErrors(errorPayload.errors)
      );
    }

    if (!isRecord(parsedBody) || parsedBody.success !== true) {
      throw new ApiError(
        response.status,
        "The server returned an invalid response.",
        [],
        "invalid-response"
      );
    }

    return parsedBody as unknown as ApiResponse<T>;
  } catch (error) {
    let normalizedError: ApiError;

    if (isApiError(error)) {
      normalizedError = error;
    } else if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      normalizedError = abortError(activeRequest.cause);
    } else if (isDefinitelyOffline(await getNetworkState())) {
      normalizedError = offlineError();
    } else {
      normalizedError = new ApiError(
        0,
        "This device is online, but the CVBuddy backend is unreachable. Check the backend health endpoint, tunnel URL/DNS, and firewall.",
        [],
        "network"
      );
    }

    if (__DEV__ && normalizedError.kind !== "cancelled") {
      console.warn("[CVBuddy API] failed", {
        durationMs: Date.now() - startedAt,
        kind: normalizedError.kind,
        method,
        status: normalizedError.status,
        url: requestUrl
      });
    }

    throw normalizedError;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
    activeRequests.delete(controller);
  }
}
