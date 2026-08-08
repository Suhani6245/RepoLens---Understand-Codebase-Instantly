import { useCallback, useState } from "react";
import { explainFile } from "@/services/repositoryService";
import type { FileExplanation } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

export function useFileExplanation() {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FileExplanation | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);

  const fetchExplanation = useCallback(
    async (repositoryId: string, path: string) => {
      setStatus("loading");
      setError(null);
      setActivePath(path);

      try {
        const result = await explainFile(repositoryId, path);
        setData(result);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to explain file.");
        setStatus("error");
      }
    },
    []
  );

  return { status, error, data, activePath, fetchExplanation };
}
