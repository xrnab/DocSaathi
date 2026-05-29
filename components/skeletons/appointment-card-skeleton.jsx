export default function AppointmentCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5 rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full shrink-0" />
      </div>
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-8 bg-muted rounded-xl w-full" />
    </div>
  );
}
