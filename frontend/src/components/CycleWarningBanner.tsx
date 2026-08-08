interface CycleWarningBannerProps {
  cycles: string[][];
}

export default function CycleWarningBanner({ cycles }: CycleWarningBannerProps) {
  if (cycles.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-800/50 bg-amber-950/30 p-4">
      <p className="text-sm font-medium text-amber-300">
        {cycles.length} circular import{cycles.length > 1 ? "s" : ""} detected
      </p>
      <ul className="mt-2 space-y-1">
        {cycles.slice(0, 5).map((cycle, i) => (
          <li key={i} className="font-mono text-xs text-amber-200/80">
            {cycle.join(" → ")}
          </li>
        ))}
      </ul>
      {cycles.length > 5 && (
        <p className="mt-1 text-xs text-amber-200/60">
          +{cycles.length - 5} more
        </p>
      )}
    </div>
  );
}
