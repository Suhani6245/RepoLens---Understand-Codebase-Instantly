import { useCallback, useState } from "react";
import { getArchitectureSummary } from "@/services/repositoryService";
import type { ArchitectureSummary } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

export function useArchitectureSummary() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ArchitectureSummary | null>(null);

  const fetchSummary = useCallback(async (repositoryId: string) => {
    setStatus("loading");
    setError(null);

    try {
      const result = await getArchitectureSummary(repositoryId);
      setData(result);
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load architecture summary."
      );
      setStatus("error");
    }
  }, []);

  return { status, error, data, fetchSummary };
}
