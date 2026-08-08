import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useAnalyzeRepository } from "@/hooks/useAnalyzeRepository";
import { useFileExplanation } from "@/hooks/useFileExplanation";
import { useArchitectureSummary } from "@/hooks/useArchitectureSummary";
import { useDependencyGraph } from "@/hooks/useDependencyGraph";
import { useAskAI } from "@/hooks/useAskAI";
import { useToast } from "@/components/ToastProvider";
import { addRecentRepository } from "@/utils/recentRepositories";
import FolderExplorer from "@/components/FolderExplorer";
import RepositoryOverviewPanel from "@/components/RepositoryOverviewPanel";
import FileExplanationPanel from "@/components/FileExplanationPanel";
import ArchitectureSummaryPanel from "@/components/ArchitectureSummaryPanel";
import DependencyGraphView from "@/components/DependencyGraphView";
import AskAIPanel from "@/components/AskAIPanel";
import Tabs from "@/components/Tabs";
import Card from "@/components/Card";
import { SkeletonBlock } from "@/components/Skeleton";
import type { FileNode } from "@/types/repository";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "explain", label: "File Explanation" },
  { id: "architecture", label: "Architecture" },
  { id: "graph", label: "Dependency Graph" },
  { id: "ask", label: "Ask AI" },
];

export default function AnalysisPage() {
  const { owner, repo } = useParams();
  const location = useLocation();
  const { showToast } = useToast();

  const repoUrl =
    (location.state as { repoUrl?: string } | null)?.repoUrl ??
    `https://github.com/${owner}/${repo}`;

  const { status, error, data, analyze } = useAnalyzeRepository();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const fileExplanation = useFileExplanation();
  const architecture = useArchitectureSummary();
  const dependencyGraph = useDependencyGraph();
  const askAI = useAskAI(data?.repositoryId ?? "");

  useEffect(() => {
    if (repoUrl) void analyze(repoUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  useEffect(() => {
    if (status === "error" && error) {
      showToast(error, "error");
    }
    if (status === "success" && data && owner && repo) {
      showToast("Repository analyzed successfully.", "success");
      addRecentRepository({ owner, repo, repoUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleSelectFile(node: FileNode) {
    setSelectedFile(node);
    setActiveTab("explain");
    if (data) void fileExplanation.fetchExplanation(data.repositoryId, node.path);
  }

  function handleFileReference(path: string) {
    setActiveTab("explain");
    if (data) void fileExplanation.fetchExplanation(data.repositoryId, path);
  }

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    if (!data) return;

    if (tabId === "architecture" && architecture.status === "idle") {
      void architecture.fetchSummary(data.repositoryId);
    }
    if (tabId === "graph" && dependencyGraph.status === "idle") {
      void dependencyGraph.fetchGraph(data.repositoryId);
    }
  }

  if (status === "loading" || status === "idle") {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 h-7 w-64 animate-pulseSoft rounded-md bg-background-elevated" />
          <Card>
            <p className="mb-4 text-sm text-text-secondary animate-pulseSoft">
              Cloning and analyzing {owner}/{repo}… this can take a moment for larger repositories.
            </p>
            <SkeletonBlock lines={4} />
          </Card>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="max-w-md text-center">
          <p className="font-medium text-text-primary">Analysis failed</p>
          <p className="mt-2 text-sm text-red-400">{error}</p>
        </Card>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-border px-6 py-3">
        <p className="text-sm font-medium text-text-primary">{data.overview.fullName}</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-border">
          <FolderExplorer
            root={data.fileTree}
            selectedPath={selectedFile?.path ?? null}
            onSelectFile={handleSelectFile}
          />
        </aside>

        <section className="flex-1 overflow-y-auto">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

          <div className="p-6">
            {activeTab === "overview" && (
              <RepositoryOverviewPanel overview={data.overview} />
            )}

            {activeTab === "explain" && (
              <FileExplanationPanel
                status={fileExplanation.status}
                error={fileExplanation.error}
                data={fileExplanation.data}
                selectedFileName={selectedFile?.name ?? null}
              />
            )}

            {activeTab === "architecture" && (
              <ArchitectureSummaryPanel
                status={architecture.status}
                error={architecture.error}
                data={architecture.data}
              />
            )}

            {activeTab === "graph" && (
              <DependencyGraphView
                status={dependencyGraph.status}
                error={dependencyGraph.error}
                data={dependencyGraph.data}
                onImpactRequest={(path) =>
                  dependencyGraph.fetchImpact(data.repositoryId, path)
                }
              />
            )}

            {activeTab === "ask" && (
              <AskAIPanel
                status={askAI.status}
                error={askAI.error}
                entries={askAI.entries}
                onAsk={askAI.ask}
                onFileClick={handleFileReference}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
