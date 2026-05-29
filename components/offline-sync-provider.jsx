"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { WifiOff, RefreshCw, CloudUpload, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

import { getPendingActions } from "@/lib/offline-db";
import { toast } from "sonner";

const OfflineSyncContext = createContext(null);

export function OfflineSyncProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  const syncValue = useOfflineSync(({ synced, failed }) => {
    if (synced > 0) {
      toast.success(`✅ Synced ${synced} items successfully`);
      router.refresh();
    }
  });

  const updateCount = React.useCallback(async () => {
    try {
      const pending = await getPendingActions();
      setPendingCount(pending.length);
    } catch (e) {
      console.error("Failed to fetch pending actions count:", e);
    }
  }, []);

  useEffect(() => {
    updateCount();
    const interval = setInterval(updateCount, 10000);
    return () => clearInterval(interval);
  }, [updateCount]);

  const mergedValue = {
    ...syncValue,
    pendingCount
  };

  return (
    <OfflineSyncContext.Provider value={mergedValue}>
      {children}
      <SyncStatusBar />
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncCtx() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error("useOfflineSyncCtx must be used within an OfflineSyncProvider");
  }
  return context;
}

function SyncStatusBar() {
  const { isOnline, pendingCount, lastSynced, isSyncing, forceSync } = useOfflineSyncCtx();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (lastSynced && pendingCount === 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSynced, pendingCount]);

  // Hide the bar entirely if online, no actions pending, not syncing, and not showing success state
  if (isOnline && pendingCount === 0 && !isSyncing && !showSuccess) {
    return null;
  }

  let statusConfig = {
    bgColor: "bg-amber-600 text-white border-amber-500",
    icon: <WifiOff className="h-5 w-5 animate-pulse" />,
    text: `Offline — ${pendingCount} action${pendingCount !== 1 ? "s" : ""} queued`,
    action: null
  };

  if (isSyncing) {
    statusConfig = {
      bgColor: "bg-sky-600 text-white border-sky-500",
      icon: <RefreshCw className="h-5 w-5 animate-spin" />,
      text: "Synchronizing data with server...",
      action: null
    };
  } else if (showSuccess) {
    statusConfig = {
      bgColor: "bg-emerald-600 text-white border-emerald-500",
      icon: <CheckCircle2 className="h-5 w-5" />,
      text: "All local updates successfully synced!",
      action: null
    };
  } else if (isOnline && pendingCount > 0) {
    statusConfig = {
      bgColor: "bg-amber-500 text-white border-amber-400",
      icon: <CloudUpload className="h-5 w-5" />,
      text: `Online — ${pendingCount} pending update${pendingCount !== 1 ? "s" : ""} unsynced`,
      action: (
        <Button
          onClick={forceSync}
          size="sm"
          className="ml-3 bg-white text-amber-700 hover:bg-slate-50 font-bold px-3 py-1 text-xs rounded-full h-7 shrink-0 cursor-pointer shadow-sm"
        >
          Retry Now
        </Button>
      )
    };
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-20 sm:pb-8 animate-in slide-in-from-bottom-8 duration-300">
      <div className={`flex items-center justify-between gap-3 px-5 py-3.5 rounded-[1.5rem] shadow-2xl border text-sm max-w-lg w-full ${statusConfig.bgColor} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          {statusConfig.icon}
          <span className="font-bold tracking-wide text-xs sm:text-sm select-none">{statusConfig.text}</span>
        </div>
        {statusConfig.action}
      </div>
    </div>
  );
}
