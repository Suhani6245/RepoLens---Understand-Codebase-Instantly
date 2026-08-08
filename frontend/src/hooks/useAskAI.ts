import { useCallback, useState } from "react";
import { askAI } from "@/services/repositoryService";
import type { RequestStatus } from "@/types/api";

interface QaEntry {
  id: string;
  question: string;
  answer: string;
  referencedFiles: string[];
}

export function useAskAI(repositoryId: string) {
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<QaEntry[]>([]);

  const ask = useCallback(
    async (question: string) => {
      setStatus("loading");
      setError(null);

      try {
        const result = await askAI({ repositoryId, question });
        setEntries((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            question,
            answer: result.answer,
            referencedFiles: result.referencedFiles,
          },
        ]);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get an answer.");
        setStatus("error");
      }
    },
    [repositoryId]
  );

  return { status, error, entries, ask };
}
