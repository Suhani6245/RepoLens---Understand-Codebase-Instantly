import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/Skeleton";
import type { RequestStatus } from "@/types/api";

interface QaEntry {
  id: string;
  question: string;
  answer: string;
  referencedFiles: string[];
}

interface AskAIPanelProps {
  status: RequestStatus;
  error: string | null;
  entries: QaEntry[];
  onAsk: (question: string) => void;
  onFileClick?: (path: string) => void;
}

const SUGGESTIONS = [
  "Where is authentication implemented?",
  "How does routing work?",
  "What's the entry point of this app?",
];

export default function AskAIPanel({
  status,
  error,
  entries,
  onAsk,
  onFileClick,
}: AskAIPanelProps) {
  const [question, setQuestion] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || status === "loading") return;
    onAsk(question.trim());
    setQuestion("");
  }

  return (
    <Card className="flex animate-fadeIn flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {entries.length === 0 && status !== "loading" && (
          <EmptyState
            title="Ask anything about this repository"
            description="e.g. “Where is authentication implemented?” or “Which files manage invoices?”"
          />
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-2">
            <p className="text-sm font-medium text-text-primary">{entry.question}</p>
            <div className="rounded-lg border border-border-subtle bg-background-elevated/50 p-3">
              <p className="text-sm text-text-secondary">{entry.answer}</p>
              {entry.referencedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.referencedFiles.map((file) => (
                    <button
                      key={file}
                      onClick={() => onFileClick?.(file)}
                      className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-accent-400 hover:border-accent-700"
                    >
                      {file}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {status === "loading" && (
          <div className="rounded-lg border border-border-subtle bg-background-elevated/50 p-3">
            <SkeletonBlock lines={2} />
          </div>
        )}

        {status === "error" && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>

      {entries.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary hover:border-accent-700 hover:text-text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this repository…"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5
            text-sm text-text-primary placeholder:text-text-muted outline-none
            focus:border-accent-600 focus:ring-2 focus:ring-accent-600/30"
        />
        <Button type="submit" isLoading={status === "loading"}>
          Ask
        </Button>
      </form>
    </Card>
  );
}
