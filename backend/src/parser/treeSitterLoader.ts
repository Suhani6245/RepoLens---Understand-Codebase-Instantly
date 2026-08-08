import path from "path";
import Parser from "web-tree-sitter";

/**
 * Maps our internal language labels (see repositoryWalker's
 * EXTENSION_TO_LANGUAGE) to prebuilt grammar WASM files.
 *
 * TypeScript needs two grammars depending on extension — .tsx files use
 * the JSX-aware `tsx` grammar, plain .ts files use `typescript` — so
 * loadGrammarFor takes the file extension, not just the language label.
 */
const WASM_DIR = path.join(
  require.resolve("tree-sitter-wasms/package.json"),
  ".."
);

function grammarFileFor(language: string, extension: string): string | null {
  switch (language) {
    case "TypeScript":
      return extension === ".tsx"
        ? "tree-sitter-tsx.wasm"
        : "tree-sitter-typescript.wasm";
    case "JavaScript":
      return "tree-sitter-javascript.wasm";
    case "Python":
      return "tree-sitter-python.wasm";
    case "Go":
      return "tree-sitter-go.wasm";
    case "Rust":
      return "tree-sitter-rust.wasm";
    case "Java":
      return "tree-sitter-java.wasm";
    case "Ruby":
      return "tree-sitter-ruby.wasm";
    case "PHP":
      return "tree-sitter-php.wasm";
    default:
      return null;
  }
}

let initPromise: Promise<void> | null = null;
const languageCache = new Map<string, Parser.Language>();

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = Parser.init();
  }
  await initPromise;
}

/**
 * Returns a ready-to-use Parser configured for the given language +
 * extension, or null if RepoLens doesn't have a grammar for it (the
 * caller should fall back to regex-based extraction in that case).
 */
export async function getParserFor(
  language: string | null,
  extension: string
): Promise<Parser | null> {
  if (!language) return null;

  const wasmFile = grammarFileFor(language, extension);
  if (!wasmFile) return null;

  await ensureInitialized();

  const cacheKey = wasmFile;
  let grammar = languageCache.get(cacheKey);
  if (!grammar) {
    try {
      grammar = await Parser.Language.load(path.join(WASM_DIR, "out", wasmFile));
      languageCache.set(cacheKey, grammar);
    } catch {
      return null; // grammar file missing/corrupt — fall back gracefully
    }
  }

  const parser = new Parser();
  parser.setLanguage(grammar);
  return parser;
}
