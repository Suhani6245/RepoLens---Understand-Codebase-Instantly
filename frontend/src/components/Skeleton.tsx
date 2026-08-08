interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulseSoft rounded-md bg-background-elevated ${className}`}
    />
  );
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
