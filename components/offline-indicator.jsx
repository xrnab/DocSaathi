"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isFirstMount = useRef(true);

  useEffect(() => {
    function handleOnline() {
      toast.success("Connection restored", {
        description: "DocSaathi is back online and sync is active.",
        icon: <Wifi className="h-4 w-4 text-emerald-500" />,
        duration: 4000
      });
    }

    function handleOffline() {
      toast.warning("Offline Mode Active", {
        description: "You are offline. Saved data and emergency contacts remain fully available.",
        icon: <WifiOff className="h-4 w-4 text-amber-500 animate-pulse" />,
        duration: 5000
      });
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check (only show if actually offline on initial boot)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Delay slightly to allow toaster to mount
        setTimeout(() => {
          handleOffline();
        }, 1500);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
