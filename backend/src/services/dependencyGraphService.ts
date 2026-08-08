import { detectCycles } from "../graph/cycleDetection";
import { analyzeImpact } from "../graph/impactAnalysis";
import { repositoryStore } from "./repositoryStore";
import {
  DependencyGraphEdge,
  DependencyGraphNode,
  DependencyGraphResponse,
  ImpactAnalysisResult,
} from "../types/repository";

/**
 * Shapes the stored AdjacencyList into React Flow-friendly nodes/edges and
 * includes any circular-import cycles detected in the graph. Cycle
 * detection is O(V+E) but only needs to run once per repository, so the
 * result is cached on the store record after the first call.
 */
export async function getDependencyGraph(
  repositoryId: string
): Promise<DependencyGraphResponse> {
  const record = repositoryStore.getOrThrow(repositoryId);
  const { dependencyGraph, pathIndex } = record;

  const nodes: DependencyGraphNode[] = dependencyGraph.nodes().map((nodePath) => {
    const fileNode = pathIndex.get(nodePath);
    return {
      id: nodePath,
      path: nodePath,
      label: fileNode?.name ?? nodePath.split("/").pop() ?? nodePath,
      language: fileNode?.language ?? null,
    };
  });

  const edges: DependencyGraphEdge[] = dependencyGraph
    .edges()
    .map(({ source, target }) => ({
      id: `${source}->${target}`,
      source,
      target,
    }));

  if (record.cyclesCache === null) {
    record.cyclesCache = detectCycles(dependencyGraph);
  }

  return { nodes, edges, cycles: record.cyclesCache };
}

/**
 * "If I change this file, what breaks?" — DFS over the reversed
 * dependency graph, starting from the given file.
 */
export async function getImpactAnalysis(
  repositoryId: string,
  filePath: string
): Promise<ImpactAnalysisResult> {
  const record = repositoryStore.getOrThrow(repositoryId);
  const affectedFiles = analyzeImpact(record.dependencyGraph, filePath);

  return { sourceFile: filePath, affectedFiles };
}
