"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HealthTimeline({ visits = [] }) {
  const [showAll, setShowAll] = useState(false);

  const displayedVisits = showAll ? visits : visits.slice(0, 5);

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Calendar className="h-10 w-10 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium">No consultation history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {displayedVisits.map((visit, index) => {
          const dateStr = visit.startTime
            ? format(new Date(visit.startTime), "MMM d, yyyy")
            : "N/A";

          // Dot color mappings
          let dotColor = "bg-sky-500";
          if (visit.status === "COMPLETED") dotColor = "bg-emerald-500";
          if (visit.status === "CANCELLED") dotColor = "bg-rose-500";

          // Badge mappings
          const getStatusBadge = (status) => {
            switch (status) {
              case "COMPLETED":
                return <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] hover:bg-emerald-100">COMPLETED</Badge>;
              case "CANCELLED":
                return <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[10px] hover:bg-red-100">CANCELLED</Badge>;
              default:
                return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] hover:bg-blue-100">{status}</Badge>;
            }
          };

          // Notes snippet (first 100 chars)
          const notesRaw = visit.notes || "No consultation notes recorded.";
          const notesSnippet =
            notesRaw.length > 100
              ? `${notesRaw.substring(0, 100)}...`
              : notesRaw;

          const isLastItem = index === displayedVisits.length - 1;

          return (
            <div key={visit.id || index} className="flex gap-4 relative">
              {/* Left Column (40px wide) */}
              <div className="w-10 flex flex-col items-center shrink-0">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${dotColor}`} />
                {!isLastItem && (
                  <div className="absolute left-4.5 top-4 bottom-0 w-px bg-border" />
                )}
              </div>

              {/* Right Column */}
              <div className="flex-1 pb-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{dateStr}</span>
                  {getStatusBadge(visit.status)}
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Dr. {visit.doctor?.name || "General Practitioner"}
                  {visit.doctor?.specialty && ` · ${visit.doctor.specialty}`}
                </h4>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  &ldquo;{notesSnippet}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && visits.length > 5 && (
        <div className="pt-2 flex justify-start pl-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer"
          >
            Show all {visits.length} visits ↓
          </Button>
        </div>
      )}
    </div>
  );
}
