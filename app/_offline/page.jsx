"use client";

import { useEffect, useState } from "react";
import { getPendingCount } from "@/lib/offline-db";
import { NABHA_EMERGENCY_CONTACTS } from "@/lib/nabha-emergency";
import { WifiOff, PhoneCall, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OfflinePage() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const count = await getPendingCount();
        setPendingCount(count);
      } catch (e) {
        console.error("Failed to read pending offline sync count:", e);
      }
    }
    fetchCount();
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 animate-in fade-in duration-300">
        
        {/* Core Offline Panel */}
        <Card className="border-border/60 bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden text-center p-8 sm:p-12 relative">
          <div className="absolute top-0 right-0 transform translate-x-20 -translate-y-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center">
            {/* WifiOff icon in amber circle */}
            <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/5 mb-6">
              <WifiOff className="h-10 w-10 animate-pulse" />
            </div>

            <h1 className="text-3xl font-black text-foreground tracking-tight leading-none mb-3">
              You&apos;re Offline
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-6">
              Nabha&apos;s network seems patchy right now. Don&apos;t worry — your offline features are fully active and protected.
            </p>

            {pendingCount > 0 && (
              <Badge className="mb-8 bg-amber-500 hover:bg-amber-600 text-white font-extrabold uppercase text-[10px] tracking-wider py-1.5 px-4 rounded-xl flex items-center gap-1.5 border-0">
                <AlertTriangle className="h-3.5 w-3.5" />
                {pendingCount} action{pendingCount !== 1 ? "s" : ""} queued for sync
              </Badge>
            )}

            <Button
              onClick={handleReload}
              className="w-full sm:w-64 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Button>
          </div>
        </Card>

        {/* Emergency contacts list */}
        <Card className="border-border/60 bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              🚑 Nabha Regional Emergency Contacts
            </CardTitle>
            <CardDescription className="text-xs">
              These contacts are saved on your phone and are always accessible, even without any internet.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {NABHA_EMERGENCY_CONTACTS.map((contact, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg select-none">{contact.icon}</span>
                    <span className="font-extrabold text-foreground text-sm sm:text-base leading-tight">{contact.name}</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-normal mt-1 max-w-xs">{contact.description}</p>
                </div>

                <Button
                  asChild
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-10 px-4 flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10"
                >
                  <a href={`tel:${contact.number}`}>
                    <PhoneCall className="h-4 w-4" />
                    <span>Call {contact.number}</span>
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
