# Parser Module (Phase 3 — done)

- **treeSitterLoader.ts** — loads prebuilt WASM grammars (`tree-sitter-wasms` + `web-tree-sitter`) for TypeScript, TSX, JavaScript, Python, Go, Rust, Java, Ruby, and PHP. Grammars are cached after first load.
- **astAnalyzer.ts** — walks the Tree-sitter AST (`descendantsOfType`, `childForFieldName`) to extract imports, exports, and top-level function signatures. Dedicated analyzers for JS/TS and Python today.
- **parseFile.ts** — the entry point: tries a real AST parse first, falls back to `importExtractor.ts`'s regex-based extraction for languages without a dedicated analyzer or on parse failure.
- **importExtractor.ts** — the original lightweight regex extractor from Phase 2, now used only as the fallback path.

`graph/buildDependencyGraph.ts` calls `parseFile` for every source file and caches the full result (`ParsedFile`) on the repository store record, so the AI services (file explanation, Ask AI context) reuse it instead of re-parsing.
