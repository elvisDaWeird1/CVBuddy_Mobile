import { API_URL } from "@/src/config/env";
import type { ApiErrorItem, ApiResponse } from "@/src/types/api";

const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiErrorItem[];

  constructor(status: number, message: string, errors: ApiErrorItem[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

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
};

const isFormData = (body: RequestBody | undefined): body is FormData =>
  typeof FormData !== "undefined" && body instanceof FormData;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
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
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body,
      signal: controller.signal
    });
    const rawBody = await response.text();
    const parsedBody: unknown = rawBody ? JSON.parse(rawBody) : null;

    if (!response.ok) {
      const errorPayload = isRecord(parsedBody) ? parsedBody : {};
      throw new ApiError(
        response.status,
        typeof errorPayload.message === "string" ? errorPayload.message : "Request failed",
        parseErrors(errorPayload.errors)
      );
    }

    if (!isRecord(parsedBody) || parsedBody.success !== true) {
      throw new ApiError(response.status, "The server returned an invalid response");
    }

    return parsedBody as unknown as ApiResponse<T>;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "The request timed out. Check the network and try again.");
    }

    throw new ApiError(0, "Unable to reach CVBuddy. Check the backend URL and network connection.");
  } finally {
    clearTimeout(timeout);
  }
}
