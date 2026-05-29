export default function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border overflow-hidden">
      {/* Header color bar */}
      <div className="h-2 w-full bg-muted" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-3/5" />
            <div className="h-3 bg-muted rounded w-2/5" />
            <div className="h-5 bg-muted rounded-full w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
        </div>
        <div className="h-10 bg-muted rounded-xl w-full" />
      </div>
    </div>
  );
}
