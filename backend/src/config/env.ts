import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  geminiApiKey: string;
  githubToken: string | undefined;
  frontendOrigin: string;
  cloneWorkspaceDir: string;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`
    );
  }
  return value;
}

/**
 * Central place all environment variables are read from.
 * Nothing else in the codebase should touch process.env directly.
 */
export const env: EnvConfig = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: (process.env.NODE_ENV as EnvConfig["nodeEnv"]) ?? "development",
  // Validated lazily (see validateEnv) so local tooling / tests can boot
  // without a real key, but the server refuses to start in production
  // without one.
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  githubToken: process.env.GITHUB_TOKEN,
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  cloneWorkspaceDir: process.env.CLONE_WORKSPACE_DIR ?? "/tmp/repolens",
};

export function validateEnv(): void {
  if (env.nodeEnv === "production" && !env.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY must be set in production. See .env.example."
    );
  }
}

export { requireEnv };
