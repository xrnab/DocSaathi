"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SlotPicker({ days, onSelectSlot }) {
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const confirmSelection = () => {
    if (selectedSlot) {
      onSelectSlot(selectedSlot);
    }
  };

  // Find next available slot
  const nextAvailableDay = days.find((day) => day.slots.length > 0);
  const nextAvailableText = nextAvailableDay ? (() => {
    const dateObj = new Date(nextAvailableDay.date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = format(dateObj, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    const isTomorrow = format(dateObj, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd");
    
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return format(dateObj, "EEEE, d MMM");
  })() : null;

  const getDateHeader = (dateStr) => {
    const dateObj = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = format(dateObj, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    const isTomorrow = format(dateObj, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd");

    // Check if it's next week
    const diffTime = dateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let prefix = "";
    if (isToday) prefix = "Today — ";
    else if (isTomorrow) prefix = "Tomorrow — ";
    else if (diffDays >= 4) prefix = "Next Week — ";
    else prefix = "This Week — ";

    return `${prefix}${format(dateObj, "EEE d MMM")}`;
  };

  const daysWithSlots = days.filter(d => d.slots.length > 0);

  return (
    <div className="space-y-6">
      {/* Soonest Available Slot Highlight Banner */}
      {nextAvailableText && (
        <div className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest leading-none">Soonest Consultation</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              Next available: <span className="text-sky-600 dark:text-sky-400 font-extrabold">{nextAvailableText}</span>
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}

      {/* Grouped Time Slots by Date with Visual Separators */}
      {daysWithSlots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-sky-100 dark:border-sky-900/30 rounded-3xl">
          No available slots for the upcoming week.
        </div>
      ) : (
        <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
          {daysWithSlots.map((day, idx) => (
            <div 
              key={day.date} 
              className={`space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 ${
                idx > 0 ? "pt-2" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {getDateHeader(day.date)}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {day.slots.map((slot) => (
                  <Card
                    key={slot.startTime}
                    className={`border-sky-100 dark:border-sky-900/20 cursor-pointer transition-all rounded-xl ${
                      selectedSlot?.startTime === slot.startTime
                        ? "bg-sky-500/10 dark:bg-sky-500/20 border-sky-500"
                        : "hover:border-sky-300 dark:hover:border-sky-700/50 bg-slate-50/50 dark:bg-slate-900/30"
                    }`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <CardContent className="p-3 flex items-center">
                      <Clock
                        className={`h-4 w-4 mr-2 ${
                          selectedSlot?.startTime === slot.startTime
                            ? "text-sky-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${
                          selectedSlot?.startTime === slot.startTime
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {format(new Date(slot.startTime), "h:mm a")}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Area with Selected Slot Date Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 gap-4">
        <div className="text-center sm:text-left">
          {selectedSlot ? (
            <p className="text-xs text-muted-foreground font-medium">
              Selected Slot:{" "}
              <span className="font-extrabold text-sky-600 dark:text-sky-400 block sm:inline">
                {format(new Date(selectedSlot.startTime), "EEEE, d MMM 'at' h:mm a")}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic font-medium">No slot selected yet</p>
          )}
        </div>
        <Button
          onClick={confirmSelection}
          disabled={!selectedSlot}
          className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold px-6 h-11"
        >
          Confirm & Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
