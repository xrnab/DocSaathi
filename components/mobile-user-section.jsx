"use client";

import React from "react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeAwareUserButton, Show } from "./clerk-elements";
import { SignInButton } from "@clerk/nextjs";
import { useOfflineSyncCtx } from "@/components/offline-sync-provider";

/**
 * Mobile User Profile & Status Component (Vertical Stack)
 * This is a Client Component because it uses hooks.
 */
export default function MobileUserSection({ dbUser }) {
  const { isOnline, pendingCount } = useOfflineSyncCtx();
  
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Offline/Online Status */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
        isOnline 
          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
          : "bg-amber-500/5 border-amber-500/20 text-amber-400 animate-pulse"
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          <span className="font-bold text-sm uppercase tracking-wider">
            {isOnline ? "System Online" : `Offline • ${pendingCount} Pending`}
          </span>
        </div>
        <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"}`} />
      </div>

      {/* User Profile Button */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <ThemeAwareUserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
              afterSignOutUrl="/"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{dbUser?.name || "User"}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{dbUser?.role || "Patient"}</span>
            </div>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10 text-white rounded-xl">
                <Activity className="h-5 w-5 text-sky-400" />
                <span className="font-bold">Sign In</span>
              </Button>
            </SignInButton>
          </Show>
        </div>
      </div>
    </div>
  );
}
