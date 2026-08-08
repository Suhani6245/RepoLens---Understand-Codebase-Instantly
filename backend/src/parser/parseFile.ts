import path from "path";
import { getParserFor } from "./treeSitterLoader";
import { analyzeTree, AstAnalysis } from "./astAnalyzer";
import { extractRawImports } from "./importExtractor";

export interface ParsedFile {
  imports: string[];
  exports: string[];
  functions: { name: string; paramCount: number }[];
  usedTreeSitter: boolean;
}

/**
 * Parses a single file's source. Tries a real Tree-sitter AST parse first
 * (accurate imports/exports/function signatures); falls back to the
 * lightweight regex extractor if no grammar is available for the
 * language, or if the AST parse throws (e.g. on a syntax-heavy file the
 * grammar doesn't fully support).
 */
export async function parseFile(
  filePath: string,
  content: string,
  language: string | null
): Promise<ParsedFile> {
  const extension = path.extname(filePath).toLowerCase();
  const parser = await getParserFor(language, extension);

  if (parser) {
    try {
      const tree = parser.parse(content);
      const analysis: AstAnalysis | null = language
        ? analyzeTree(tree, language)
        : null;

      if (analysis) {
        return { ...analysis, usedTreeSitter: true };
      }
    } catch {
      // Fall through to the regex-based extractor below.
    }
  }

  return {
    imports: extractRawImports(content, language),
    exports: [],
    functions: [],
    usedTreeSitter: false,
  };
}
