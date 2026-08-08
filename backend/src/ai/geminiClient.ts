import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

/**
 * Model string for Gemini's current generally-available stable model.
 * Centralized here so upgrading to a newer stable release is a one-line
 * change.
 */
const GEMINI_MODEL = "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new AppError(
      "GEMINI_API_KEY is not configured on the server. Set it in backend/.env to enable AI features.",
      "AI_REQUEST_FAILED",
      503
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

/**
 * Generic type for the JSON Schema objects we hand to Gemini's structured
 * output mode. Kept loose (not a full JSON Schema type) since we only use
 * a small subset (object/array/string/number/boolean + required/items).
 */
export type GeminiJsonSchema = Record<string, unknown>;

/**
 * Calls Gemini with a system instruction + user prompt and asks for a
 * JSON response matching `schema`. Every AI-backed RepoLens feature
 * (file explanation, architecture summary, Ask AI) goes through this one
 * function, so prompt construction and error handling stay consistent.
 */
export async function generateStructuredContent<T>(
  systemInstruction: string,
  prompt: string,
  schema: GeminiJsonSchema
): Promise<T> {
  const ai = getClient();

  let responseText: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    responseText = response.text;
  } catch (err) {
    throw new AppError(
      `Gemini request failed: ${err instanceof Error ? err.message : "unknown error"}`,
      "AI_REQUEST_FAILED",
      502
    );
  }

  if (!responseText) {
    throw new AppError(
      "Gemini returned an empty response.",
      "AI_REQUEST_FAILED",
      502
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new AppError(
      "Gemini returned a response that wasn't valid JSON.",
      "AI_REQUEST_FAILED",
      502
    );
  }
}
