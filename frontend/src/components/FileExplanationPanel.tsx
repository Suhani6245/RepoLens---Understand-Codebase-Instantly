import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import { SkeletonBlock } from "@/components/Skeleton";
import type { FileExplanation } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-border bg-background-elevated px-2 py-0.5 font-mono text-xs text-text-secondary">
      {children}
    </span>
  );
}

interface FileExplanationPanelProps {
  status: RequestStatus;
  error: string | null;
  data: FileExplanation | null;
  selectedFileName: string | null;
}

export default function FileExplanationPanel({
  status,
  error,
  data,
  selectedFileName,
}: FileExplanationPanelProps) {
  if (status === "idle") {
    return (
      <Card>
        <EmptyState
          title="Select a file to explain"
          description="Pick any file in the folder explorer on the left to get an AI-generated breakdown of its purpose, responsibilities, and key functions."
        />
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="animate-fadeIn">
        <p className="mb-4 text-sm text-text-secondary">
          Explaining <span className="font-mono text-text-primary">{selectedFileName}</span>…
        </p>
        <SkeletonBlock lines={5} />
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

  if (!data) return null;

  return (
    <Card className="animate-fadeIn">
      <p className="font-mono text-sm text-accent-400">{data.path}</p>

      <section className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Purpose
        </h3>
        <p className="mt-1.5 text-sm text-text-primary">{data.purpose}</p>
      </section>

      {data.responsibilities.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Responsibilities
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-text-primary">
            {data.responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {data.keyFunctions.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Key Functions
          </h3>
          <div className="mt-1.5 space-y-2">
            {data.keyFunctions.map((fn, i) => (
              <div key={i} className="rounded-lg border border-border-subtle bg-background-elevated/50 p-3">
                <p className="font-mono text-sm text-accent-300">{fn.name}</p>
                <p className="mt-0.5 text-sm text-text-secondary">{fn.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Imports
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.imports.length > 0 ? (
              data.imports.map((imp) => <Pill key={imp}>{imp}</Pill>)
            ) : (
              <p className="text-sm text-text-muted">None</p>
            )}
          </div>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Exports
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.exports.length > 0 ? (
              data.exports.map((exp) => <Pill key={exp}>{exp}</Pill>)
            ) : (
              <p className="text-sm text-text-muted">None</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 border-t border-border-subtle pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Summary
        </h3>
        <p className="mt-1.5 text-sm text-text-secondary">{data.summary}</p>
      </section>
    </Card>
  );
}
