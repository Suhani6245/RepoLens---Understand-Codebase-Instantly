import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 text-text-muted">{icon}</div>}
      <p className="font-medium text-text-primary">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
