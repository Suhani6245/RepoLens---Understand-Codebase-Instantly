import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { AppError } from "../utils/AppError";
import { parseGithubUrl } from "../utils/githubUrl";
import { fetchRepoMetadata } from "../github/githubClient";
import { cloneRepository, removeClonedRepository } from "../github/repoCloner";
import { walkRepository } from "../github/repositoryWalker";
import { detectFramework } from "../github/frameworkDetector";
import { buildDependencyGraph } from "../graph/buildDependencyGraph";
import { repositoryStore, StoredRepository } from "./repositoryStore";
import { AnalyzeRepositoryResponse, RepositoryOverview } from "../types/repository";

async function readPackageJson(
  clonePath: string
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(path.join(clonePath, "package.json"), "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickPrimaryLanguage(languageCounts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [language, count] of languageCounts) {
    if (count > bestCount) {
      best = language;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Orchestrates: validate URL -> fetch GitHub metadata -> shallow clone ->
 * DFS-walk the tree -> extract + resolve imports into a dependency graph ->
 * persist everything in the repository store.
 */
export async function analyzeRepository(
  repoUrl: string
): Promise<AnalyzeRepositoryResponse> {
  const { owner, repo, cloneUrl } = parseGithubUrl(repoUrl);

  const metadata = await fetchRepoMetadata(owner, repo);
  const repositoryId = crypto.randomUUID();

  let clonePath: string;
  try {
    clonePath = await cloneRepository(cloneUrl, repositoryId);
  } catch (err) {
    throw err instanceof AppError
      ? err
      : new AppError("Failed to clone repository.", "CLONE_FAILED", 502);
  }

  try {
    const { fileTree, pathIndex, fileCount, folderCount, languageCounts } =
      await walkRepository(clonePath);

    const packageJson = await readPackageJson(clonePath);
    const { framework, estimatedArchitecture } = detectFramework(
      pathIndex,
      packageJson
    );

    const { graph: dependencyGraph, parsedFileCache } = await buildDependencyGraph(
      clonePath,
      pathIndex
    );

    const overview: RepositoryOverview = {
      name: metadata.name,
      owner: metadata.owner,
      fullName: metadata.fullName,
      description: metadata.description,
      stars: metadata.stars,
      forks: metadata.forks,
      primaryLanguage: metadata.language ?? pickPrimaryLanguage(languageCounts),
      detectedFramework: framework,
      fileCount,
      folderCount,
      estimatedArchitecture,
      defaultBranch: metadata.defaultBranch,
      url: metadata.url,
    };

    const record: StoredRepository = {
      repositoryId,
      overview,
      fileTree,
      pathIndex,
      dependencyGraph,
      parsedFileCache,
      cyclesCache: null,
      architectureCache: null,
      clonePath,
      createdAt: Date.now(),
    };
    repositoryStore.set(record);

    return { repositoryId, overview, fileTree };
  } catch (err) {
    await removeClonedRepository(clonePath);
    throw err instanceof AppError
      ? err
      : new AppError(
          "Failed to analyze the cloned repository.",
          "PARSE_FAILED",
          500
        );
  }
}
