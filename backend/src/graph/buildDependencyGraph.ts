import fs from "fs/promises";
import path from "path";
import { AdjacencyList } from "../graph/AdjacencyList";
import { parseFile, ParsedFile } from "../parser/parseFile";
import { FileNode } from "../types/repository";

const JS_TS_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const INDEX_FILES = JS_TS_EXTENSIONS.map((ext) => `index${ext}`);

export interface DependencyGraphBuildResult {
  graph: AdjacencyList;
  /** repository-relative path -> parsed imports/exports/functions */
  parsedFileCache: Map<string, ParsedFile>;
}

/**
 * Resolves a raw import specifier (e.g. "./Button", "../utils/foo") to a
 * repository-relative path that exists in the pathIndex HashMap. Returns
 * null for package imports (non-relative specifiers) or specifiers that
 * don't resolve to a real file — those aren't graph edges.
 */
function resolveJsTsSpecifier(
  fromPath: string,
  specifier: string,
  pathIndex: Map<string, FileNode>
): string | null {
  if (!specifier.startsWith(".")) return null; // package import, not a repo file

  const fromDir = path.dirname(fromPath);
  const rawResolved = path.normalize(path.join(fromDir, specifier)).replace(/\\/g, "/");

  const candidates = [
    rawResolved,
    ...JS_TS_EXTENSIONS.map((ext) => `${rawResolved}${ext}`),
    ...INDEX_FILES.map((idx) => `${rawResolved}/${idx}`),
  ];

  return candidates.find((candidate) => pathIndex.has(candidate)) ?? null;
}

function resolvePythonSpecifier(
  specifier: string,
  pathIndex: Map<string, FileNode>
): string | null {
  const asPath = specifier.replace(/^\.+/, "").replace(/\./g, "/");
  const candidates = [`${asPath}.py`, `${asPath}/__init__.py`];
  return candidates.find((candidate) => pathIndex.has(candidate)) ?? null;
}

/**
 * Walks every source file in the pathIndex, parses it with Tree-sitter
 * (see src/parser/parseFile.ts), and adds a resolved edge to the
 * adjacency list for each import that points at another file inside the
 * same repository. External package imports are intentionally excluded —
 * the graph only models in-repo dependencies. Each file's full parse
 * result is cached and returned so later AI-backed calls (file
 * explanation, Ask AI) don't need to re-parse.
 */
export async function buildDependencyGraph(
  rootDir: string,
  pathIndex: Map<string, FileNode>
): Promise<DependencyGraphBuildResult> {
  const graph = new AdjacencyList();
  const parsedFileCache = new Map<string, ParsedFile>();

  for (const node of pathIndex.values()) {
    if (node.type !== "file") continue;
    graph.addNode(node.path);
  }

  const sourceFiles = Array.from(pathIndex.values()).filter(
    (node) =>
      node.type === "file" &&
      (node.language === "TypeScript" ||
        node.language === "JavaScript" ||
        node.language === "Python")
  );

  await Promise.all(
    sourceFiles.map(async (fileNode) => {
      let content: string;
      try {
        content = await fs.readFile(path.join(rootDir, fileNode.path), "utf-8");
      } catch {
        return; // unreadable (binary, permissions, symlink race) — skip
      }

      const parsed = await parseFile(fileNode.path, content, fileNode.language);
      parsedFileCache.set(fileNode.path, parsed);

      for (const specifier of parsed.imports) {
        const resolved =
          fileNode.language === "Python"
            ? resolvePythonSpecifier(specifier, pathIndex)
            : resolveJsTsSpecifier(fileNode.path, specifier, pathIndex);

        if (resolved && resolved !== fileNode.path) {
          graph.addEdge(fileNode.path, resolved);
        }
      }
    })
  );

  return { graph, parsedFileCache };
}
