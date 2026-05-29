"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, User, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HealthTimeline({ visits = [] }) {
  const [expanded, setExpanded] = useState(false);

  // Filter completed and cancelled visits or display all with correct dot coloring
  const validVisits = visits.filter(
    (v) => v.status === "COMPLETED" || v.status === "CANCELLED"
  );

  const displayedVisits = expanded ? validVisits : validVisits.slice(0, 5);

  return (
    <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-xl sm:rounded-2xl bg-card hover:shadow-md transition-all">
      <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 py-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 w-5 text-sky-500" />
          Health Consultation Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {validVisits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm font-semibold">
            No consultation history yet
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-muted dark:before:bg-slate-800">
            {displayedVisits.map((visit, index) => {
              const dateStr = visit.startTime
                ? format(new Date(visit.startTime), "MMM d, yyyy")
                : "N/A";
              
              const isCompleted = visit.status === "COMPLETED";
              const dotColor = isCompleted ? "bg-emerald-500" : "bg-amber-500";
              const dotRing = isCompleted ? "ring-emerald-100 dark:ring-emerald-950" : "ring-amber-100 dark:ring-amber-950";

              // Truncate notes to 80 chars
              const notesRaw = visit.notes || "No consultation notes recorded.";
              const notesSnippet =
                notesRaw.length > 80
                  ? `${notesRaw.substring(0, 80)}...`
                  : notesRaw;

              return (
                <div
                  key={visit.id || index}
                  className="relative pl-8 animate-in fade-in slide-in-from-top-3 duration-300 select-none"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline indicator dot */}
                  <div className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full ${dotColor} ring-4 ${dotRing} z-10`} />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-100/30">
                        {dateStr}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/20"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100/20"
                        }`}
                      >
                        {visit.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {visit.doctor?.name || "General Practitioner"}
                      {visit.doctor?.specialty && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({visit.doctor.specialty})
                        </span>
                      )}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed pl-5 italic mt-1 border-l-2 border-slate-100 dark:border-slate-800">
                      &ldquo;{notesSnippet}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}

            {validVisits.length > 5 && (
              <div className="pt-2 pl-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 flex items-center gap-1.5 rounded-xl cursor-pointer"
                >
                  {expanded ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Collapse Timeline
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show all {validVisits.length} visits
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
