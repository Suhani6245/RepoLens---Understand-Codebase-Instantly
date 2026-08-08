import fs from "fs/promises";
import path from "path";
import { repositoryStore } from "./repositoryStore";
import { generateStructuredContent } from "../ai/geminiClient";
import {
  ARCHITECTURE_SUMMARY_SCHEMA,
  ARCHITECTURE_SUMMARY_SYSTEM_INSTRUCTION,
  buildArchitectureSummaryPrompt,
} from "../ai/prompts";
import { ArchitectureSummary } from "../types/repository";

interface GeminiArchitectureSummary {
  pattern: string;
  authentication: string;
  database: string;
  apiStructure: string;
  stateManagement: string;
  folderOrganization: string;
}

async function readDependencyNames(clonePath: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path.join(clonePath, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as Record<string, unknown>;
    const names = new Set<string>();
    for (const field of ["dependencies", "devDependencies"] as const) {
      const section = pkg[field];
      if (section && typeof section === "object") {
        Object.keys(section as Record<string, unknown>).forEach((n) => names.add(n));
      }
    }
    return Array.from(names);
  } catch {
    return [];
  }
}

/**
 * Combines facts already derived heuristically during analysis (detected
 * framework, folder layout) with a single Gemini call for the fields that
 * genuinely require judgment (auth approach, DB, state management, etc).
 * Cached on the store record after the first call.
 */
export async function getArchitectureSummary(
  repositoryId: string
): Promise<ArchitectureSummary> {
  const record = repositoryStore.getOrThrow(repositoryId);

  if (record.architectureCache) {
    return record.architectureCache;
  }

  const topLevelEntries = (record.fileTree.children ?? []).map((c) => c.name);
  const dependencyNames = await readDependencyNames(record.clonePath);

  const prompt = buildArchitectureSummaryPrompt({
    repositoryName: record.overview.name,
    description: record.overview.description,
    detectedFramework: record.overview.detectedFramework ?? "Unknown",
    primaryLanguage: record.overview.primaryLanguage,
    topLevelEntries,
    dependencyNames,
  });

  const result = await generateStructuredContent<GeminiArchitectureSummary>(
    ARCHITECTURE_SUMMARY_SYSTEM_INSTRUCTION,
    prompt,
    ARCHITECTURE_SUMMARY_SCHEMA
  );

  const summary: ArchitectureSummary = {
    pattern: result.pattern,
    framework: record.overview.detectedFramework ?? "Unknown",
    backend: null,
    frontend: null,
    authentication: result.authentication,
    database: result.database,
    apiStructure: result.apiStructure,
    stateManagement: result.stateManagement,
    folderOrganization: result.folderOrganization,
  };

  record.architectureCache = summary;
  return summary;
}
