"use client";

import React from "react";
import { useOfflineSyncCtx } from "./offline-sync-provider";
import { CloudUpload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function PendingSyncBadge({ label = "Pending sync", className }) {
  const { isOnline, isSyncing, forceSync } = useOfflineSyncCtx();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOnline && !isSyncing) {
      forceSync();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider select-none transition-all duration-300",
        isOnline 
          ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 cursor-pointer hover:scale-105 active:scale-95" 
          : "bg-slate-100 text-slate-500 border border-slate-200",
        className
      )}
      title={isOnline ? "Online — click to sync now!" : "Offline — will sync when back online"}
    >
      {isSyncing ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CloudUpload className="h-3.5 w-3.5" />
      )}
      <span>{isSyncing ? "Syncing..." : label}</span>
    </div>
  );
}
