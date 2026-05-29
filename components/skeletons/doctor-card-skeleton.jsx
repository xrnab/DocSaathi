export default function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between h-[280px]">
      <div className="space-y-4">
        {/* Top: Avatar, Name & Specialty */}
        <div className="flex items-center gap-3.5">
          <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        
        {/* Middle: Pill bars */}
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-24 bg-muted rounded-full" />
        </div>
        
        {/* Description bar */}
        <div className="space-y-1.5 pt-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
        </div>
      </div>

      {/* Bottom button bar */}
      <div className="h-10 bg-muted rounded-xl w-full" />
    </div>
  );
}
