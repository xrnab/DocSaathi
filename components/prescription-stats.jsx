"use client";

import { useMemo } from "react";
import { Pill, Activity, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrescriptionStats({ prescriptions = [] }) {
  const activePrescriptions = useMemo(() => {
    return prescriptions.filter((p) => p.active);
  }, [prescriptions]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const active = activePrescriptions.length;
    
    let lastUpdated = "N/A";
    if (prescriptions.length > 0) {
      const dates = prescriptions.map((p) => new Date(p.createdAt));
      const latestDate = new Date(Math.max(...dates));
      lastUpdated = format(latestDate, "MMM d, yyyy");
    }

    return { total, active, lastUpdated };
  }, [prescriptions, activePrescriptions]);

  // Helper to determine dosage width and label based on frequency string
  const getFrequencyProgress = (frequency = "") => {
    const freq = frequency.toLowerCase();
    if (freq.includes("thrice") || freq.includes("three times") || freq.includes("3x")) {
      return { width: "w-full", color: "bg-emerald-500", count: "3x daily" };
    }
    if (freq.includes("twice") || freq.includes("two times") || freq.includes("2x")) {
      return { width: "w-2/3", color: "bg-sky-500", count: "2x daily" };
    }
    return { width: "w-1/3", color: "bg-amber-500", count: "1x daily" };
  };

  return (
    <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-xl sm:rounded-2xl bg-card hover:shadow-md transition-all">
      <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 py-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-4 w-4 sm:h-5 w-5 text-sky-500" />
          Medication Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Three inline stat pills */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <Pill className="h-3.5 w-3.5" />
            <span>{stats.active} Active Medicines</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <Activity className="h-3.5 w-3.5" />
            <span>{stats.total} Total Prescribed</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border border-border/50">
            <Calendar className="h-3.5 w-3.5" />
            <span>Last Updated: {stats.lastUpdated}</span>
          </div>
        </div>

        {/* Horizontal bars reflecting dosage frequencies */}
        {activePrescriptions.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dosage Frequencies</p>
            <div className="space-y-3.5">
              {activePrescriptions.map((med) => {
                const { width, color, count } = getFrequencyProgress(med.frequency || med.dosage);
                return (
                  <div key={med.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[70%]">{med.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-md">{count} ({med.dosage})</span>
                    </div>
                    <div className="h-2 w-full bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} ${width} rounded-full transition-all duration-500`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
