import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/Skeleton";
import CycleWarningBanner from "@/components/CycleWarningBanner";
import { computeLayeredLayout } from "@/utils/graphLayout";
import type {
  DependencyGraphResponse,
  ImpactAnalysisResult,
} from "@/types/repository";
import type { RequestStatus } from "@/types/api";

interface DependencyGraphViewProps {
  status: RequestStatus;
  error: string | null;
  data: DependencyGraphResponse | null;
  onImpactRequest?: (path: string) => Promise<ImpactAnalysisResult>;
}

const BASE_NODE_STYLE = {
  background: "linear-gradient(135deg, #101a2a 0%, #182337 100%)",
  color: "#e6e9f0",
  border: "1px solid #2b3d56",
  borderRadius: 14,
  fontSize: 12,
  fontWeight: 600,
  padding: "10px 14px",
  width: 220,
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.22)",
};

export default function DependencyGraphView({
  status,
  error,
  data,
  onImpactRequest,
}: DependencyGraphViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [impact, setImpact] = useState<ImpactAnalysisResult | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const selectedNode = useMemo(
    () => data?.nodes.find((node) => node.id === selectedId) ?? null,
    [data, selectedId]
  );

  useEffect(() => {
    if (!selectedId || !data || !onImpactRequest) {
      setImpact(null);
      return;
    }

    setImpactLoading(true);
    const selectedPath = data.nodes.find((node) => node.id === selectedId)?.path;
    if (!selectedPath) {
      setImpact(null);
      setImpactLoading(false);
      return;
    }

    void onImpactRequest(selectedPath)
      .then((result) => setImpact(result))
      .catch(() => setImpact(null))
      .finally(() => setImpactLoading(false));
  }, [selectedId, data, onImpactRequest]);

  const connectedIds = useMemo(() => {
    if (!selectedId || !data) return null;
    const connected = new Set<string>([selectedId]);
    data.edges.forEach((edge) => {
      if (edge.source === selectedId) connected.add(edge.target);
      if (edge.target === selectedId) connected.add(edge.source);
    });
    return connected;
  }, [selectedId, data]);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!data) return { flowNodes: [], flowEdges: [] };

    const positions = computeLayeredLayout(data.nodes, data.edges);
    const degreeMap = new Map<string, number>();
    data.nodes.forEach((node) => degreeMap.set(node.id, 0));
    data.edges.forEach((edge) => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
    });

    const flowNodes: Node[] = data.nodes.map((n) => {
      const isDimmed = connectedIds !== null && !connectedIds.has(n.id);
      const isSelected = n.id === selectedId;
      const degree = degreeMap.get(n.id) ?? 0;
      const nodeLabel = (
        <div
          title={`${n.path}\nLanguage: ${n.language ?? "unknown"}\nCentrality: ${degree} connections`}
          className="flex flex-col items-start gap-1"
        >
          <span className="truncate text-[11px] font-semibold text-current">{n.label}</span>
          <span className="text-[10px] opacity-75">{degree} links</span>
        </div>
      );

      return {
        id: n.id,
        position: positions.get(n.id) ?? { x: 0, y: 0 },
        data: { label: nodeLabel, path: n.path, language: n.language, degree },
        style: {
          ...BASE_NODE_STYLE,
          opacity: isDimmed ? 0.2 : 1,
          borderColor: isSelected ? "#60a5fa" : "#2b3d56",
          borderWidth: isSelected ? 2 : 1,
          background: isSelected
            ? "linear-gradient(135deg, #13233f 0%, #1a335f 100%)"
            : BASE_NODE_STYLE.background,
          boxShadow: isSelected
            ? "0 0 0 1px rgba(96, 165, 250, 0.5), 0 18px 28px rgba(37, 99, 235, 0.25)"
            : BASE_NODE_STYLE.boxShadow,
        },
      };
    });

    const flowEdges: Edge[] = data.edges.map((e) => {
      const isHighlighted =
        connectedIds !== null && (e.source === selectedId || e.target === selectedId);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? "#60a5fa" : "#334155",
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          opacity: connectedIds !== null && !isHighlighted ? 0.18 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? "#60a5fa" : "#334155",
          width: 16,
          height: 16,
        },
      };
    });

    return { flowNodes, flowEdges };
  }, [data, connectedIds, selectedId]);

  if (status === "loading" || status === "idle") {
    return (
      <Card className="animate-fadeIn">
        <SkeletonBlock lines={4} />
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="animate-fadeIn border-red-900/50">
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No dependency edges found"
          description="RepoLens couldn't resolve any in-repository imports for this project."
        />
      </Card>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background-elevated/80 px-3 py-2 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          Node = file
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0 w-5 border-t border-blue-400" />
          Edge = imports relationship
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Selected node = focus
        </span>
      </div>

      <CycleWarningBanner cycles={data.cycles} />

      <Card className="!p-0 overflow-hidden">
        <div className="border-b border-border bg-background-elevated/70 px-4 py-3 text-xs text-text-secondary">
          {selectedNode ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-medium text-text-primary">Selected:</span> {selectedNode.path}
              </div>
              <div className="text-right">
                <span className="font-medium text-text-primary">Language:</span>{" "}
                {selectedNode.language ?? "unknown"}
                <div className="mt-1">
                  <span className="font-medium text-text-primary">Centrality:</span>{" "}
                  {data.edges.filter(
                    (edge) =>
                      edge.source === selectedNode.id || edge.target === selectedNode.id
                  ).length} connections
                </div>
              </div>
            </div>
          ) : (
            <span>Click a node to inspect its connected files and impact surface.</span>
          )}
        </div>

        <div className="h-[560px]">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodeClick={(_, node) =>
              setSelectedId((prev) => (prev === node.id ? null : node.id))
            }
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            minZoom={0.25}
            maxZoom={1.4}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1f2637" gap={20} />
            <Controls className="!bg-background-elevated !border-border !fill-text-primary" />
            <MiniMap
              className="!bg-background-elevated"
              maskColor="rgba(10,14,20,0.7)"
              nodeColor="#3182f6"
            />
          </ReactFlow>
        </div>

        {(selectedNode || impactLoading || impact) && (
          <div className="border-t border-border bg-background-elevated/70 px-4 py-3 text-sm text-text-secondary">
            {impactLoading ? (
              <span>Computing impact analysis…</span>
            ) : impact ? (
              <div>
                <div className="mb-2 font-medium text-text-primary">
                  Impact on {impact.sourceFile}
                </div>
                {impact.affectedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {impact.affectedFiles.slice(0, 8).map((file) => (
                      <span
                        key={file}
                        className="rounded-full border border-border bg-background px-2 py-1 text-xs"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>No downstream files were affected.</span>
                )}
              </div>
            ) : (
              <span>No impact analysis for this selection.</span>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
