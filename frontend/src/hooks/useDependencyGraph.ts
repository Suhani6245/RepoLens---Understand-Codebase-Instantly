import { useCallback, useState } from "react";
import { getDependencyGraph, getImpactAnalysis } from "@/services/repositoryService";
import type { DependencyGraphResponse } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

export function useDependencyGraph() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DependencyGraphResponse | null>(null);

  const fetchGraph = useCallback(async (repositoryId: string) => {
    setStatus("loading");
    setError(null);

    try {
      const result = await getDependencyGraph(repositoryId);
      setData(result);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dependency graph."
      );
      setStatus("error");
    }
  }, []);

  const fetchImpact = useCallback(
    (repositoryId: string, path: string) => getImpactAnalysis(repositoryId, path),
    []
  );

  return { status, error, data, fetchGraph, fetchImpact };
}
