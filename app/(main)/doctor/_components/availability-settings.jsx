"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { setAvailabilitySlots } from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function AvailabilitySettings({ slots }) {
  const [showForm, setShowForm] = useState(false);

  const { loading, fn: submitSlots, data } = useFetch(setAvailabilitySlots);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { startTime: "", endTime: "" },
  });

  function createLocalDateFromTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  }

  const onSubmit = async (formValues) => {
    if (loading) return;
    const formData = new FormData();
    const startDate = createLocalDateFromTime(formValues.startTime);
    const endDate = createLocalDateFromTime(formValues.endTime);

    if (startDate >= endDate) {
      toast.error("End time must be after start time");
      return;
    }

    formData.append("startTime", startDate.toISOString());
    formData.append("endTime", endDate.toISOString());
    await submitSlots(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowForm(false);
      reset();
      toast.success("Availability slots updated successfully");
    }
  }, [data]);

  const formatTimeString = (dateString) => {
    try { return format(new Date(dateString), "h:mm a"); }
    catch { return "Invalid time"; }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-sky-500" />
          Availability Settings
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Set your daily availability window for patient appointments
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Current Slots */}
        {!showForm && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                Current Availability
              </h3>
              {slots.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-muted/40 border border-border">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No availability slots set yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
                    >
                      <div className="bg-sky-50 dark:bg-sky-900/20 p-2 rounded-full border border-sky-100 dark:border-sky-800 shrink-0">
                        <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground font-semibold text-sm">
                          {formatTimeString(slot.startTime)} &mdash; {formatTimeString(slot.endTime)}
                        </p>
                      </div>
                      {slot.appointment ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Booked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Available
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Availability Time
            </Button>
          </>
        )}

        {/* Add Slot Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 bg-muted/40 border border-border rounded-xl p-5"
          >
            <h3 className="text-base font-semibold text-foreground">
              Set Daily Availability
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-foreground">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register("startTime", { required: "Start time is required" })}
                  className="bg-background border-border focus-visible:ring-sky-500"
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-foreground">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register("endTime", { required: "End time is required" })}
                  className="bg-background border-border focus-visible:ring-sky-500"
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); reset(); }}
                disabled={loading}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : "Save Availability"}
              </Button>
            </div>
          </form>
        )}

        {/* Info Box */}
        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 rounded-xl">
          <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            How Availability Works
          </h4>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Setting your daily availability allows patients to book appointments during those hours.
            The same window applies to all days. Existing booked appointments won&apos;t be affected by changes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
