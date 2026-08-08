import { StoredRepository } from "../services/repositoryStore";
import { detectCycles } from "../graph/cycleDetection";
import { traverseBFS } from "../graph/traversal";

const STOPWORDS = new Set([
  "the", "is", "are", "how", "does", "do", "a", "an", "of", "in", "on",
  "where", "which", "what", "to", "and", "for", "this", "that", "it",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

interface CandidateFile {
  path: string;
  imports: string[];
  exports: string[];
  graphNeighbors: string[];
}

export interface AskAiContext {
  candidateFiles: CandidateFile[];
  graphSummary: string;
  cycleSummary: string;
  centralFiles: string[];
}

const MAX_SEED_FILES = 6;
const MAX_TOTAL_FILES = 12;

/**
 * Finds files relevant to a natural-language question:
 *  1. Score every source file by keyword overlap between the question
 *     and its path + detected exports (a HashMap-backed O(1) lookup per
 *     token via the parsedFileCache).
 *  2. Take the top-scoring files as BFS seeds and walk outward one hop
 *     over the dependency graph, so closely related files (e.g. a route
 *     file and the controller it calls) are included even without a
 *     keyword match.
 */
export function buildAskAiContext(
  record: StoredRepository,
  question: string
): AskAiContext {
  const tokens = tokenize(question);
  const scored: { path: string; score: number }[] = [];

  for (const [filePath, parsed] of record.parsedFileCache) {
    const haystack = tokenize(
      `${filePath} ${parsed.exports.join(" ")} ${parsed.functions.map((f) => f.name).join(" ")}`
    );
    const haystackSet = new Set(haystack);
    const score = tokens.reduce(
      (sum, token) => sum + (haystackSet.has(token) ? 1 : 0),
      0
    );
    if (score > 0) scored.push({ path: filePath, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const seeds = scored.slice(0, MAX_SEED_FILES).map((s) => s.path);

  const relevantPaths = new Set(seeds);
  for (const seed of seeds) {
    const nearby = traverseBFS(record.dependencyGraph, seed).slice(0, 3);
    nearby.forEach((path) => relevantPaths.add(path));
    if (relevantPaths.size >= MAX_TOTAL_FILES) break;
  }

  if (relevantPaths.size === 0) {
    const reversed = record.dependencyGraph.reversed();
    const byIncoming = record.dependencyGraph
      .nodes()
      .map((node) => ({ node, incoming: reversed.neighbors(node).size }))
      .sort((a, b) => b.incoming - a.incoming)
      .slice(0, MAX_SEED_FILES);
    byIncoming.forEach(({ node }) => relevantPaths.add(node));
  }

  const candidateFiles = Array.from(relevantPaths)
    .slice(0, MAX_TOTAL_FILES)
    .map((path) => {
      const parsed = record.parsedFileCache.get(path);
      const graphNeighbors = Array.from(record.dependencyGraph.neighbors(path)).slice(
        0,
        8
      );
      return {
        path,
        imports: parsed?.imports ?? [],
        exports: parsed?.exports ?? [],
        graphNeighbors,
      };
    });

  const allNodes = record.dependencyGraph.nodes();
  const allEdges = record.dependencyGraph.edges();
  const cycles = detectCycles(record.dependencyGraph).slice(0, 5);
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();

  for (const node of allNodes) {
    inDegreeMap.set(node, 0);
    outDegreeMap.set(node, 0);
  }

  for (const { source, target } of allEdges) {
    outDegreeMap.set(source, (outDegreeMap.get(source) ?? 0) + 1);
    inDegreeMap.set(target, (inDegreeMap.get(target) ?? 0) + 1);
  }

  const centralFiles = allNodes
    .map((node) => ({
      node,
      score: (inDegreeMap.get(node) ?? 0) + (outDegreeMap.get(node) ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ node }) => node);

  const entryPoints = allNodes
    .filter((node) => (inDegreeMap.get(node) ?? 0) === 0 && (outDegreeMap.get(node) ?? 0) > 0)
    .slice(0, 5);

  const graphSummary = [
    `Graph overview: ${allNodes.length} files, ${allEdges.length} internal import edges.`,
    `Likely entry points: ${entryPoints.length ? entryPoints.join(", ") : "none detected"}.`,
    `Most connected files: ${centralFiles.length ? centralFiles.join(", ") : "none detected"}.`,
    `Dependency direction: each edge A -> B means A imports B.`,
  ].join(" ");

  const cycleSummary =
    cycles.length > 0
      ? `Detected cycles: ${cycles
          .map((cycle) => cycle.join(" -> "))
          .join(" | ")}`
      : "No circular import cycles detected.";

  return { candidateFiles, graphSummary, cycleSummary, centralFiles };
}
