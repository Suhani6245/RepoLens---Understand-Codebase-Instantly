/**
 * Lightweight, regex-based import extraction.
 *
 * This is an intentional interim implementation for Phase 2 so the
 * dependency graph, cycle detection, and impact analysis have real edges
 * to work with. Phase 3 replaces this with proper Tree-sitter AST parsing
 * (see src/parser/README.md), which will also power imports/exports/
 * key-function extraction for the AI file explanations.
 */

const JS_TS_IMPORT_PATTERNS = [
  /import\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g,
  /export\s+(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g,
  /require\(\s*["']([^"']+)["']\s*\)/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
];

const PYTHON_IMPORT_PATTERNS = [
  /^\s*from\s+([.\w]+)\s+import\s+/gm,
  /^\s*import\s+([.\w]+)/gm,
];

/**
 * Extracts raw import specifiers (not yet resolved to file paths) from a
 * single file's source, based on its detected language.
 */
export function extractRawImports(
  content: string,
  language: string | null
): string[] {
  const specifiers = new Set<string>();

  if (language === "JavaScript" || language === "TypeScript") {
    for (const pattern of JS_TS_IMPORT_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        specifiers.add(match[1]);
      }
    }
  } else if (language === "Python") {
    for (const pattern of PYTHON_IMPORT_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        specifiers.add(match[1]);
      }
    }
  }

  return Array.from(specifiers);
}
