import axios, { AxiosError } from "axios";

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
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong while talking to the RepoLens backend.";

    return Promise.reject(new Error(message));
  }
);
