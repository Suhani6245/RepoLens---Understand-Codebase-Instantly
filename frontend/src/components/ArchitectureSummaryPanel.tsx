import Card from "@/components/Card";
import { SkeletonBlock } from "@/components/Skeleton";
import type { ArchitectureSummary } from "@/types/repository";
import type { RequestStatus } from "@/types/api";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-elevated/50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </h3>
      <p className="mt-1.5 text-sm text-text-primary">{value ?? "Not evident from the repository structure"}</p>
    </div>
  );
}

interface ArchitectureSummaryPanelProps {
  status: RequestStatus;
  error: string | null;
  data: ArchitectureSummary | null;
}

export default function ArchitectureSummaryPanel({
  status,
  error,
  data,
}: ArchitectureSummaryPanelProps) {
  if (status === "loading" || status === "idle") {
    return (
      <Card className="animate-fadeIn">
        <SkeletonBlock lines={6} />
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
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-accent-500/15 px-2.5 py-1 text-xs font-medium text-accent-300">
          {data.framework}
        </span>
      </div>
      <p className="text-sm text-text-primary">{data.pattern}</p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Authentication" value={data.authentication} />
        <Field label="Database" value={data.database} />
        <Field label="API Structure" value={data.apiStructure} />
        <Field label="State Management" value={data.stateManagement} />
      </div>

      <div className="mt-3">
        <Field label="Folder Organization" value={data.folderOrganization} />
      </div>
    </Card>
  );
}
