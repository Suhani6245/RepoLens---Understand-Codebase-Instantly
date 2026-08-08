import { httpClient } from "@/services/httpClient";
import type {
  AnalyzeRepositoryResponse,
  ArchitectureSummary,
  AskAIRequest,
  AskAIResponse,
  DependencyGraphResponse,
  FileExplanation,
  ImpactAnalysisResult,
} from "@/types/repository";

/**
 * Kicks off analysis of a public GitHub repository.
 * Backend clones the repo, walks the tree, and returns an overview + file tree.
 */
export async function analyzeRepository(
  repoUrl: string
): Promise<AnalyzeRepositoryResponse> {
  const { data } = await httpClient.post<AnalyzeRepositoryResponse>(
    "/api/analyze",
    { repoUrl }
  );
  return data;
}

/**
 * Requests an AI-generated explanation for a single file.
 */
export async function explainFile(
  repositoryId: string,
  path: string
): Promise<FileExplanation> {
  const { data } = await httpClient.post<FileExplanation>("/api/explain", {
    repositoryId,
    path,
  });
  return data;
}

/**
 * Fetches the architecture-level summary for a repository.
 */
export async function getArchitectureSummary(
  repositoryId: string
): Promise<ArchitectureSummary> {
  const { data } = await httpClient.get<ArchitectureSummary>(
    `/api/repository/${repositoryId}/architecture`
  );
  return data;
}

/**
 * Fetches the dependency graph (nodes, edges, detected cycles).
 */
export async function getDependencyGraph(
  repositoryId: string
): Promise<DependencyGraphResponse> {
  const { data } = await httpClient.get<DependencyGraphResponse>(
    `/api/graph/${repositoryId}`
  );
  return data;
}

/**
 * Runs DFS-based impact analysis for a given file.
 */
export async function getImpactAnalysis(
  repositoryId: string,
  path: string
): Promise<ImpactAnalysisResult> {
  const { data } = await httpClient.get<ImpactAnalysisResult>(
    `/api/graph/${repositoryId}/impact`,
    { params: { path } }
  );
  return data;
}

/**
 * Asks a natural-language question about the repository.
 */
export async function askAI(request: AskAIRequest): Promise<AskAIResponse> {
  const { data } = await httpClient.post<AskAIResponse>(
    "/api/question",
    request
  );
  return data;
}
