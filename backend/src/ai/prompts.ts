import { GeminiJsonSchema } from "./geminiClient";

const NO_CODE_DUMP_RULE =
  "Never reproduce large blocks of the source verbatim in your response. Describe behavior in your own words instead of quoting code.";

// ---------------------------------------------------------------------------
// File explanation
// ---------------------------------------------------------------------------

export const FILE_EXPLANATION_SYSTEM_INSTRUCTION = `You are a senior software engineer explaining a single file inside a larger codebase to another engineer who has never seen it. Be precise and concrete, grounded only in the facts given to you (file path, language, extracted imports/exports/function signatures, and the source). ${NO_CODE_DUMP_RULE}`;

export const FILE_EXPLANATION_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    purpose: { type: "string" },
    responsibilities: { type: "array", items: { type: "string" } },
    keyFunctions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
      },
    },
    summary: { type: "string" },
  },
  required: ["purpose", "responsibilities", "keyFunctions", "summary"],
};

export function buildFileExplanationPrompt(params: {
  filePath: string;
  language: string | null;
  imports: string[];
  exports: string[];
  functionNames: string[];
  source: string;
}): string {
  const { filePath, language, imports, exports, functionNames, source } = params;

  return [
    `File: ${filePath}`,
    `Language: ${language ?? "unknown"}`,
    `Detected imports: ${imports.length ? imports.join(", ") : "(none)"}`,
    `Detected exports: ${exports.length ? exports.join(", ") : "(none)"}`,
    `Detected top-level functions: ${functionNames.length ? functionNames.join(", ") : "(none)"}`,
    "",
    "Source:",
    "```",
    source.slice(0, 12000), // guard against pathological file sizes
    "```",
    "",
    "Explain this file's purpose, responsibilities, key functions (using the detected function names where relevant), and give a 1-2 sentence summary.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Architecture summary
// ---------------------------------------------------------------------------

export const ARCHITECTURE_SUMMARY_SYSTEM_INSTRUCTION = `You are a senior software architect writing a concise architecture summary of a repository for another engineer evaluating whether to work in this codebase. Base every claim only on the evidence provided (folder names, detected framework, dependency manifest, top-level file layout). If evidence is insufficient to determine a field with confidence, say "Not evident from the repository structure" for that field rather than guessing.`;

export const ARCHITECTURE_SUMMARY_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    pattern: { type: "string" },
    authentication: { type: "string" },
    database: { type: "string" },
    apiStructure: { type: "string" },
    stateManagement: { type: "string" },
    folderOrganization: { type: "string" },
  },
  required: [
    "pattern",
    "authentication",
    "database",
    "apiStructure",
    "stateManagement",
    "folderOrganization",
  ],
};

export function buildArchitectureSummaryPrompt(params: {
  repositoryName: string;
  description: string | null;
  detectedFramework: string;
  primaryLanguage: string | null;
  topLevelEntries: string[];
  dependencyNames: string[];
}): string {
  const {
    repositoryName,
    description,
    detectedFramework,
    primaryLanguage,
    topLevelEntries,
    dependencyNames,
  } = params;

  return [
    `Repository: ${repositoryName}`,
    `Description: ${description ?? "(none provided)"}`,
    `Detected framework: ${detectedFramework}`,
    `Primary language: ${primaryLanguage ?? "unknown"}`,
    `Top-level folders/files: ${topLevelEntries.join(", ")}`,
    `package.json dependency names: ${dependencyNames.length ? dependencyNames.join(", ") : "(none / not a Node project)"}`,
    "",
    "Produce an architecture summary covering: overall pattern, authentication approach, database, API structure, state management approach, and folder organization philosophy.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Ask AI
// ---------------------------------------------------------------------------

export const ASK_AI_SYSTEM_INSTRUCTION = `You are a senior engineer answering a question about a specific codebase using only the repository context provided to you (file tree, relevant file paths, their detected imports/exports, and the dependency graph summary). Treat each edge A -> B as 'A imports B'. If the graph is relevant, explain what the nodes and edges represent in plain language. If the context doesn't contain enough information to answer confidently, say so explicitly instead of speculating. ${NO_CODE_DUMP_RULE}`;

export const ASK_AI_SCHEMA: GeminiJsonSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
    referencedFiles: { type: "array", items: { type: "string" } },
  },
  required: ["answer", "referencedFiles"],
};

export function buildAskAiPrompt(params: {
  question: string;
  context: {
    candidateFiles: {
      path: string;
      imports: string[];
      exports: string[];
      graphNeighbors: string[];
    }[];
    graphSummary: string;
    cycleSummary: string;
    centralFiles: string[];
  };
}): string {
  const { question, context } = params;

  const contextBlock = context.candidateFiles
    .map(
      (f) =>
        `- ${f.path} | imports: [${f.imports.join(", ")}] | exports: [${f.exports.join(", ")}] | dependency neighbors: [${f.graphNeighbors.join(", ") || "none"}]`
    )
    .join("\n");

  return [
    `Question: ${question}`,
    "",
    "Dependency graph summary:",
    context.graphSummary,
    context.cycleSummary,
    `High-connectivity files: ${context.centralFiles.join(", ") || "none"}`,
    "",
    "Relevant files and dependency connections (path, detected imports, detected exports, and direct graph neighbors):",
    contextBlock || "(no obviously relevant files found by keyword/graph search)",
    "",
    "Use both the file-level metadata and the dependency relationships above to answer the question. If the dependency graph is relevant, explain what the nodes and edges represent in plain language, and explain what the graph suggests about architecture, coupling, and flow. List the file paths your answer draws on in referencedFiles.",
  ].join("\n");
}
