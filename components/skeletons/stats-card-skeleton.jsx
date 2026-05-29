export default function StatsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-8 w-8 rounded-xl bg-muted" />
      </div>
      <div className="h-8 bg-muted rounded w-1/2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}
