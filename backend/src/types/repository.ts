export interface RepositoryOverview {
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  detectedFramework: string | null;
  fileCount: number;
  folderCount: number;
  estimatedArchitecture: string;
  defaultBranch: string;
  url: string;
}

export type FileNodeType = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  language: string | null;
  sizeBytes: number | null;
  children?: FileNode[];
}

export interface FileExplanation {
  path: string;
  purpose: string;
  responsibilities: string[];
  keyFunctions: { name: string; description: string }[];
  imports: string[];
  exports: string[];
  summary: string;
}

export interface ArchitectureSummary {
  pattern: string;
  framework: string;
  backend: string | null;
  frontend: string | null;
  authentication: string | null;
  database: string | null;
  apiStructure: string;
  stateManagement: string | null;
  folderOrganization: string;
}

export interface DependencyGraphNode {
  id: string;
  path: string;
  label: string;
  language: string | null;
}

export interface DependencyGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface DependencyGraphResponse {
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
  cycles: string[][];
}

export interface ImpactAnalysisResult {
  sourceFile: string;
  affectedFiles: string[];
}

export interface AnalyzeRepositoryRequest {
  repoUrl: string;
}

export interface AnalyzeRepositoryResponse {
  repositoryId: string;
  overview: RepositoryOverview;
  fileTree: FileNode;
}

export interface AskAIRequest {
  repositoryId: string;
  question: string;
}

export interface AskAIResponse {
  answer: string;
  referencedFiles: string[];
}
