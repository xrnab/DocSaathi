"use client";

import { useOfflineSyncCtx } from "@/components/offline-sync-provider";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export default function OfflineFirstBadge() {
  const { isOnline, pendingCount } = useOfflineSyncCtx();

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      <Badge
        variant="outline"
        className="hidden md:inline-flex items-center gap-1 px-3 py-1 font-bold text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-slate-100 dark:border-slate-800 rounded-full"
      >
        ⚡ Works Offline
      </Badge>
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 py-0.5 px-1.5 sm:py-1 sm:px-2.5 text-[9px] sm:text-xs font-bold rounded-full transition-all border ${
          isOnline
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/40"
            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-250 dark:border-amber-900/40 animate-pulse shadow-md"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Offline • {pendingCount} Pending</span>
          </>
        )}
      </Badge>
    </div>
  );
}
