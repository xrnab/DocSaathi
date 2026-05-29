"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Clock, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { useOfflineBooking } from "@/hooks/use-offline-booking";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

export function AppointmentForm({ doctorId, slot, onBack, onComplete }) {
  const [description, setDescription] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const router = useRouter();

  const { book, isPending } = useOfflineBooking();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPending || localLoading) return;

    setLocalLoading(true);

    // Create form data
    const formData = new FormData();
    formData.append("doctorId", doctorId);
    formData.append("startTime", slot.startTime);
    formData.append("endTime", slot.endTime);
    formData.append("description", description);

    try {
      const result = await book(formData);
      if (result.queued) {
        toast.info("Appointment saved offline — will confirm when back online");
        router.push("/appointments");
      } else if (result.result?.success) {
        toast.success("Appointment confirmed!");
        router.push("/appointments");
      } else if (result.result?.error) {
        const errorMsg = result.result.error;
        if (errorMsg.includes("just booked")) {
          toast.warning("Slot taken! Another patient just booked this time. Refreshing available slots...");
          setTimeout(() => {
            router.refresh();
          }, 1500);
        } else {
          toast.error(errorMsg);
        }
      }
      onComplete();
    } catch (err) {
      toast.error(err.message || "Failed to book appointment");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/20 p-4 rounded-lg border border-sky-900/20 space-y-3">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-sky-400 mr-2" />
          <span className="text-foreground font-medium">
            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-sky-400 mr-2" />
          <span className="text-foreground">{slot.formatted}</span>
        </div>
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-sky-400 mr-2" />
          <span className="text-muted-foreground">
            Cost: <span className="text-foreground font-medium">2 credits</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground font-semibold flex items-center gap-2">
          What are you facing?
          <span className="text-red-500 text-xs font-normal">(Required)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Please describe your symptoms, medical concerns, or what you'd like to discuss with the doctor..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-background border-sky-200 dark:border-sky-900/30 h-32 focus:border-sky-500 transition-colors"
        />
        <p className="text-sm text-muted-foreground italic">
          This vital information will be shared with the doctor to help them prepare for your consultation.
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isPending}
          className="border-sky-900/30"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Time Slot
        </Button>
        <Button
          type="submit"
          disabled={isPending || localLoading}
          className="bg-sky-600 hover:bg-sky-700"
        >
          {isPending || localLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
