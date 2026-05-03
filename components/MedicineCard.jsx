"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

export default function MedicineCard({
  medicineName,
  usedFor,
  whenToTake,
  dosageAdult,
  dosageChild,
  sideEffects = [],
  hasDangerousInteractions = false,
}) {
  if (
    !medicineName &&
    !usedFor &&
    !whenToTake &&
    !dosageAdult &&
    !dosageChild &&
    (!sideEffects || sideEffects.length === 0)
  ) {
    return null;
  }

  return (
    <Card className="mt-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {medicineName || "Medicine"}
            </h3>
            {usedFor ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                <span className="font-medium text-slate-700 dark:text-slate-300">Used for:</span> {usedFor}
              </p>
            ) : null}
          </div>
        </div>

        {hasDangerousInteractions && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 px-3 py-2 text-xs flex gap-2 animate-pulse">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-bold">Caution: Interaction Warning</div>
              <div className="mt-0.5 text-[11px]">
                This medicine may have dangerous interactions. Please consult a doctor before use.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {whenToTake ? (
            <div className="rounded-xl border border-blue-100/50 dark:border-blue-900/20 bg-blue-50/20 dark:bg-blue-900/10 px-3 py-2.5">
              <div className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider">
                When to take
              </div>
              <div className="text-xs text-blue-900 dark:text-blue-100 mt-1 font-semibold leading-snug">
                {whenToTake}
              </div>
            </div>
          ) : null}

          {(dosageAdult || dosageChild) ? (
            <div className="rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 bg-indigo-50/20 dark:bg-indigo-900/10 px-3 py-2.5">
              <div className="text-[10px] font-bold text-indigo-600/80 dark:text-indigo-400/80 uppercase tracking-wider">
                Dosage Instructions
              </div>
              <div className="text-xs text-indigo-950 dark:text-indigo-50 mt-1.5 space-y-2">
                {dosageAdult ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-indigo-500/70 dark:text-indigo-400/50 uppercase font-bold">Adult</span>
                    <span className="font-semibold leading-tight">{dosageAdult}</span>
                  </div>
                ) : null}
                {dosageChild ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-indigo-500/70 dark:text-indigo-400/50 uppercase font-bold">Child</span>
                    <span className="font-semibold leading-tight">{dosageChild}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {sideEffects?.length ? (
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider px-1">
              Side effects to watch for
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sideEffects.slice(0, 8).map((s) => (
                <span
                  key={s}
                  className="text-[11px] px-3 py-1 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/20 shadow-sm font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

