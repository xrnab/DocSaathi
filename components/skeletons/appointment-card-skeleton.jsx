export default function AppointmentCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5 rounded-2xl border border-border">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-8 bg-muted rounded-xl w-full" />
    </div>
  );
}
