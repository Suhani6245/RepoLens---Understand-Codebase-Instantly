import Card from "@/components/Card";
import type { RepositoryOverview } from "@/types/repository";

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export default function RepositoryOverviewPanel({
  overview,
}: {
  overview: RepositoryOverview;
}) {
  return (
    <Card className="animate-fadeIn">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {overview.fullName}
          </h2>
          {overview.description && (
            <p className="mt-1 text-sm text-text-secondary">{overview.description}</p>
          )}
        </div>
        <a
          href={overview.url}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary shrink-0 !px-3 !py-2 text-xs"
        >
          View on GitHub
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-subtle pt-5 sm:grid-cols-4">
        <Stat label="Stars" value={overview.stars.toLocaleString()} />
        <Stat label="Forks" value={overview.forks.toLocaleString()} />
        <Stat label="Language" value={overview.primaryLanguage ?? "—"} />
        <Stat label="Framework" value={overview.detectedFramework ?? "—"} />
        <Stat label="Files" value={overview.fileCount.toLocaleString()} />
        <Stat label="Folders" value={overview.folderCount.toLocaleString()} />
        <Stat label="Default branch" value={overview.defaultBranch} />
        <Stat label="Architecture" value={overview.estimatedArchitecture} />
      </div>
    </Card>
  );
}
