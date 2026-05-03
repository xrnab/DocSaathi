"use client";

import { useState, useEffect } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OfflineBadge() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 self-start sm:self-auto py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
        <CloudOff className="h-3.5 w-3.5" />
        Offline: Sync Pending
      </Badge>
    );
  }

  return (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 self-start sm:self-auto py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-sm opacity-80">
      <RefreshCw className="h-3 w-3" />
      Synced
    </Badge>
  );
}
