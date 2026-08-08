import axios, { AxiosError } from "axios";

function normalizeErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("quota") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("429")
  ) {
    return "Gemini API quota has been exhausted. Please check your billing or API limits and try again later.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Gemini API rate limit reached. Please wait a moment and try again.";
  }

  if (
    normalized.includes("safety") ||
    normalized.includes("blocked") ||
    normalized.includes("unsafe content")
  ) {
    return "This request was blocked by Gemini safety policies. Please revise the prompt and try again.";
  }

  return message;
}

/**
 * Backend base URL is injected via environment variable at build time.
 * Never hardcode a deployed backend URL here.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const httpClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.response.use(
  (response) => {
    const payload = response.data as
      | { success?: boolean; data?: unknown }
      | unknown;

    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      payload.success === true &&
      "data" in payload
    ) {
      return {
        ...response,
        data: payload.data,
      };
    }

    return response;
  },
  (error: AxiosError<{ error?: { message?: string; code?: string } }>) => {
    const rawMessage =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong while talking to the RepoLens backend.";

    return Promise.reject(new Error(normalizeErrorMessage(rawMessage)));
  }
);
