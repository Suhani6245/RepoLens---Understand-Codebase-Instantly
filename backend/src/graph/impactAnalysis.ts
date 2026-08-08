import { AdjacencyList } from "./AdjacencyList";
import { traverseDFS } from "./traversal";
import { AppError } from "../utils/AppError";

/**
 * "If I change this file, what breaks?"
 *
 * The dependency graph stores edges as A -> B meaning "A imports B", so
 * "what depends on file X" is answered by running DFS from X on the
 * *reversed* graph — every node reachable there imports X, directly or
 * transitively.
 */
export function analyzeImpact(graph: AdjacencyList, filePath: string): string[] {
  if (!graph.has(filePath)) {
    throw new AppError(
      `"${filePath}" was not found in the dependency graph.`,
      "NOT_FOUND",
      404
    );
  }

  const reversedGraph = graph.reversed();
  return traverseDFS(reversedGraph, filePath);
}
