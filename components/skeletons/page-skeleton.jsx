import StatsCardSkeleton from "./stats-card-skeleton";

export default function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  );
}
