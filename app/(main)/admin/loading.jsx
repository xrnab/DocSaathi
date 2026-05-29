import StatsCardSkeleton from "@/components/skeletons/stats-card-skeleton";
import TableSkeleton from "@/components/skeletons/table-skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 animate-pulse">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      {/* Table Skeleton */}
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
