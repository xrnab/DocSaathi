"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { enqueueAction, getPendingCount } from "@/lib/offline-db";
import { startSyncEngine, stopSyncEngine } from "@/lib/sync-engine";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isStartedRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (e) {
      console.error("Failed to read pending count:", e);
    }
  }, []);

  const enqueue = useCallback(async (type, payload, optimistic = null) => {
    const localId = await enqueueAction(type, payload, optimistic);
    await refreshCount();
    // Dispatch a synthetic online event to attempt immediate flush if online
    if (navigator.onLine) {
      window.dispatchEvent(new Event("online"));
    }
    return localId;
  }, [refreshCount]);

  const forceSync = useCallback(() => {
    if (typeof window !== "undefined") {
      setIsSyncing(true);
      window.dispatchEvent(new Event("online"));
      // Reset syncing loader slightly later
      setTimeout(() => setIsSyncing(false), 2000);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      refreshCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    refreshCount();

    // Start sync engine exactly once using useRef guard
    if (!isStartedRef.current) {
      isStartedRef.current = true;
      startSyncEngine(({ synced, failed }) => {
        setLastSynced(Date.now());
        setIsSyncing(false);
        refreshCount();
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // Clean up sync engine on unmount if appropriate, or keep it singleton
      // We keep it running as a singleton since it has a 30s interval poller
    };
  }, [refreshCount]);

  return {
    isOnline,
    pendingCount,
    lastSynced,
    isSyncing,
    enqueue,
    forceSync,
    refreshCount
  };
}
