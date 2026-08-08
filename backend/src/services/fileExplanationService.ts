import fs from "fs/promises";
import path from "path";
import { AppError } from "../utils/AppError";
import { repositoryStore } from "./repositoryStore";
import { generateStructuredContent } from "../ai/geminiClient";
import {
  FILE_EXPLANATION_SCHEMA,
  FILE_EXPLANATION_SYSTEM_INSTRUCTION,
  buildFileExplanationPrompt,
} from "../ai/prompts";
import { FileExplanation } from "../types/repository";

interface GeminiFileExplanation {
  purpose: string;
  responsibilities: string[];
  keyFunctions: { name: string; description: string }[];
  summary: string;
}

/**
 * Reads the requested file, reuses its cached Tree-sitter parse (imports/
 * exports/function signatures — computed once during analysis, see
 * buildDependencyGraph), and asks Gemini to turn those grounded facts
 * into a human-readable explanation.
 */
export async function explainFile(
  repositoryId: string,
  filePath: string
): Promise<FileExplanation> {
  const record = repositoryStore.getOrThrow(repositoryId);

  const fileNode = record.pathIndex.get(filePath);
  if (!fileNode || fileNode.type !== "file") {
    throw new AppError(
      `File "${filePath}" was not found in this repository.`,
      "NOT_FOUND",
      404
    );
  }

  let source: string;
  try {
    source = await fs.readFile(path.join(record.clonePath, filePath), "utf-8");
  } catch {
    throw new AppError(
      `Could not read "${filePath}" — the analyzed repository may have expired.`,
      "REPOSITORY_NOT_FOUND",
      410
    );
  }

  const parsed = record.parsedFileCache.get(filePath);
  const imports = parsed?.imports ?? [];
  const exports = parsed?.exports ?? [];
  const functionNames = parsed?.functions.map((f) => f.name) ?? [];

  const prompt = buildFileExplanationPrompt({
    filePath,
    language: fileNode.language,
    imports,
    exports,
    functionNames,
    source,
  });

  const result = await generateStructuredContent<GeminiFileExplanation>(
    FILE_EXPLANATION_SYSTEM_INSTRUCTION,
    prompt,
    FILE_EXPLANATION_SCHEMA
  );

  return {
    path: filePath,
    purpose: result.purpose,
    responsibilities: result.responsibilities,
    keyFunctions: result.keyFunctions,
    imports,
    exports,
    summary: result.summary,
  };
}
