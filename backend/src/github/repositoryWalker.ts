import fs from "fs/promises";
import path from "path";
import { FileNode } from "../types/repository";

const IGNORED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".cache",
  ".turbo",
  ".output",
]);

// Safety cap so a single enormous repository can't hang the request.
const MAX_FILES = 8000;

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".php": "PHP",
  ".css": "CSS",
  ".scss": "SCSS",
  ".html": "HTML",
  ".json": "JSON",
  ".md": "Markdown",
  ".yml": "YAML",
  ".yaml": "YAML",
};

export interface RepositoryWalkResult {
  fileTree: FileNode;
  pathIndex: Map<string, FileNode>;
  fileCount: number;
  folderCount: number;
  languageCounts: Map<string, number>;
}

function detectLanguage(fileName: string): string | null {
  const ext = path.extname(fileName).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? null;
}

/**
 * Walks the cloned repository directory with a depth-first traversal,
 * building:
 *  - a FileNode tree (for the frontend's VS Code-like explorer)
 *  - a HashMap<relativePath, FileNode> for O(1) file lookups elsewhere
 *    in the pipeline (import resolution, explain-by-path, impact analysis)
 */
export async function walkRepository(
  rootDir: string
): Promise<RepositoryWalkResult> {
  const pathIndex = new Map<string, FileNode>();
  const languageCounts = new Map<string, number>();
  let fileCount = 0;
  let folderCount = 0;

  async function walk(dirAbsPath: string, dirRelPath: string): Promise<FileNode> {
    const entries = await fs.readdir(dirAbsPath, { withFileTypes: true });
    const children: FileNode[] = [];

    // Deterministic ordering: folders first, then files, both alphabetical.
    const sorted = [...entries].sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      if (fileCount >= MAX_FILES) break;
      if (entry.name.startsWith(".") && entry.name !== ".env.example") continue;

      const entryRelPath = dirRelPath ? `${dirRelPath}/${entry.name}` : entry.name;
      const entryAbsPath = path.join(dirAbsPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIR_NAMES.has(entry.name)) continue;

        folderCount += 1;
        // DFS: recurse into the subdirectory before moving to the next sibling.
        const childNode = await walk(entryAbsPath, entryRelPath);
        children.push(childNode);
      } else if (entry.isFile()) {
        fileCount += 1;
        const language = detectLanguage(entry.name);
        if (language) {
          languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
        }

        let sizeBytes: number | null = null;
        try {
          const stat = await fs.stat(entryAbsPath);
          sizeBytes = stat.size;
        } catch {
          sizeBytes = null;
        }

        const fileNode: FileNode = {
          id: entryRelPath,
          name: entry.name,
          path: entryRelPath,
          type: "file",
          language,
          sizeBytes,
        };

        pathIndex.set(entryRelPath, fileNode);
        children.push(fileNode);
      }
    }

    const folderNode: FileNode = {
      id: dirRelPath || ".",
      name: dirRelPath ? path.basename(dirRelPath) : path.basename(rootDir),
      path: dirRelPath,
      type: "folder",
      language: null,
      sizeBytes: null,
      children,
    };

    if (dirRelPath) pathIndex.set(dirRelPath, folderNode);
    return folderNode;
  }

  const fileTree = await walk(rootDir, "");

  return { fileTree, pathIndex, fileCount, folderCount, languageCounts };
}
