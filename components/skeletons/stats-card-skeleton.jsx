export default function StatsCardSkeleton() {
  return (
    <div className="animate-pulse bg-card border border-border rounded-2xl p-5 border-l-4 border-l-muted min-h-[120px] flex flex-col justify-between">
      <div className="flex justify-between items-start w-full">
        {/* Number bar (wide, short) */}
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-5 w-5 bg-muted rounded-full" />
      </div>
      {/* Label bar */}
      <div className="h-4 bg-muted rounded w-32 mt-2" />
    </div>
  );
}
