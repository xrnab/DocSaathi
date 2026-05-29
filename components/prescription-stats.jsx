"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PrescriptionStats({ prescriptions = [] }) {
  const activeCount = useMemo(() => {
    return prescriptions.filter((p) => p.active).length;
  }, [prescriptions]);

  const totalCount = prescriptions.length;

  const lastUpdatedText = useMemo(() => {
    if (prescriptions.length === 0) return "N/A";
    const dates = prescriptions.map((p) => new Date(p.createdAt));
    const latestDate = new Date(Math.max(...dates));
    return formatDistanceToNow(latestDate, { addSuffix: true });
  }, [prescriptions]);

  const activePrescriptions = useMemo(() => {
    return prescriptions.filter((p) => p.active);
  }, [prescriptions]);

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-2xl shadow-xs">
      {/* 3 inline stat pills using Badge */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="success" className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100">
          {activeCount} active
        </Badge>
        <Badge variant="secondary">
          {totalCount} total prescribed
        </Badge>
        <Badge variant="outline" className="text-muted-foreground font-medium">
          Updated {lastUpdatedText}
        </Badge>
      </div>

      {/* Frequency bars for active prescriptions */}
      {activePrescriptions.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border/55">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Prescription Frequencies</p>
          <div className="space-y-2">
            {activePrescriptions.map((med) => {
              const freq = (med.frequency || "").toLowerCase();
              let progressWidth = "33%";
              if (freq.includes("thrice") || freq.includes("three")) {
                progressWidth = "100%";
              } else if (freq.includes("twice") || freq.includes("two")) {
                progressWidth = "66%";
              }

              return (
                <div key={med.id} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate font-medium text-foreground">{med.name}</span>
                  <div className="flex-1 bg-muted dark:bg-slate-800 rounded-full h-1.5">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: progressWidth }} 
                    />
                  </div>
                  <span className="text-muted-foreground w-16 text-right truncate">
                    {med.frequency}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
