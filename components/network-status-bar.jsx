"use client";

import { useState, useEffect } from "react";
import { getPendingActions } from "@/lib/offline-db";
import { WifiOff, Check } from "lucide-react";

export default function NetworkStatusBar() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = async () => {
    try {
      const pending = await getPendingActions();
      setPendingCount(pending.length);
    } catch (e) {
      console.error("Failed to update status bar pending count:", e);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      updatePendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowStatus(true);
      updatePendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    updatePendingCount();
    if (!navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
      setShowStatus(true);
    }

    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      // Show "back online" green bar for 3 seconds, then hide
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (showStatus) {
        document.documentElement.classList.add("status-bar-active");
      } else {
        document.documentElement.classList.remove("status-bar-active");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("status-bar-active");
      }
    };
  }, [showStatus]);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 text-center py-2 px-4 shadow-md transition-all duration-500 transform translate-y-0 ${
      isOnline 
        ? "bg-emerald-600 text-white" 
        : "bg-amber-500 text-slate-900 font-bold"
    }`}>
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm">
        {isOnline ? (
          <>
            <Check className="h-4 w-4 shrink-0" />
            <span>✅ Back online — syncing your data...</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 shrink-0 animate-pulse text-slate-800" />
            <span>
              📵 You're offline — DocSaathi continues to work. 
              {pendingCount > 0 && ` (${pendingCount} action${pendingCount !== 1 ? "s" : ""} pending sync)`} Changes sync when connection returns.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
