import { useCallback, useState } from "react";
import { analyzeRepository } from "@/services/repositoryService";
import type { AnalyzeRepositoryResponse } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

interface UseAnalyzeRepositoryResult {
  status: RequestStatus;
  error: string | null;
  data: AnalyzeRepositoryResponse | null;
  analyze: (repoUrl: string) => Promise<void>;
  reset: () => void;
}

export function useAnalyzeRepository(): UseAnalyzeRepositoryResult {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeRepositoryResponse | null>(null);

  const analyze = useCallback(async (repoUrl: string) => {
    setStatus("loading");
    setError(null);

    try {
      const result = await analyzeRepository(repoUrl);
      setData(result);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setData(null);
  }, []);

  return { status, error, data, analyze, reset };
}
