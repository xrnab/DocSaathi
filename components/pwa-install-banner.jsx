"use client";

import React, { useState, useEffect } from "react";
import { X, Smartphone, ArrowDownToLine, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [visitCount, setVisitCount] = useState(1);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Safe Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Session-Based Multi-Visit Tracker
    if (typeof window !== "undefined") {
      const storedVisits = localStorage.getItem("docsaathi_visit_count");
      const currentSession = sessionStorage.getItem("docsaathi_session_active");
      
      let visits = storedVisits ? parseInt(storedVisits, 10) : 0;
      
      if (!currentSession) {
        // New session! Increment the visit count
        visits += 1;
        localStorage.setItem("docsaathi_visit_count", visits.toString());
        sessionStorage.setItem("docsaathi_session_active", "true");
      }
      
      setVisitCount(visits);

      // Check if already installed
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone ||
        localStorage.getItem("docsaathi_pwa_installed") === "true"
      ) {
        setIsInstalled(true);
      }
    }

    // 3. Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default bar
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      
      // Retrieve visit count and dismissed state
      const visits = parseInt(localStorage.getItem("docsaathi_visit_count") || "1", 10);
      const isDismissed = localStorage.getItem("docsaathi_pwa_dismissed") === "true";
      const alreadyInstalled = localStorage.getItem("docsaathi_pwa_installed") === "true";

      // Show banner if visit count is >= 2, not dismissed, and not already installed
      if (visits >= 2 && !isDismissed && !alreadyInstalled) {
        // A brief delay to make the entrance slide animation feel premium
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      console.log("[PWA] DocSaathi installed successfully!");
      localStorage.setItem("docsaathi_pwa_installed", "true");
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      toast.success("DocSaathi added to your home screen! You can now use it offline.", {
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);

    if (outcome === "accepted") {
      localStorage.setItem("docsaathi_pwa_installed", "true");
      setIsInstalled(true);
      setShowBanner(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("docsaathi_pwa_dismissed", "true");
    toast.info("Install request hidden. You can still install DocSaathi anytime from your browser menu.");
  };

  if (!mounted || !showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[999] animate-in slide-in-from-bottom-8 duration-500 ease-out">
      <div className="relative overflow-hidden bg-background/90 backdrop-blur-xl border border-sky-500/20 shadow-2xl shadow-sky-500/10 rounded-[2rem] p-5 sm:p-6 transition-all">
        {/* Glow Background Accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 dark:bg-sky-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close install banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start pr-6">
          {/* App Icon Mock */}
          <div className="relative flex-shrink-0 bg-gradient-to-br from-sky-400 to-blue-600 p-3 rounded-2xl shadow-lg shadow-sky-500/20">
            <Smartphone className="h-6 w-6 text-white animate-bounce duration-1000" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Add DocSaathi to Home Screen
              </h3>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              Install our app on your phone for instant, high-speed loading and continuous offline access to symptom triage & emergency directories.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-full h-11 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-xs"
          >
            <ArrowDownToLine className="h-4 w-4" /> Add to Home Screen
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-sky-500/20 hover:bg-sky-500/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full h-11 text-xs font-bold transition-all px-4"
          >
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
