"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatName, formatDoctorName } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  addAppointmentNotes,
  markAppointmentCompleted,
  rejectAppointment,
} from "@/actions/doctor";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertTriangle } from "lucide-react";

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [notes, setNotes] = useState(appointment.notes || "");
  const [grading, setGrading] = useState("");
  const [improvementStatus, setImprovementStatus] = useState("Stable");
  const [doctorSummary, setDoctorSummary] = useState("");
  const router = useRouter();

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: rejectLoading,
    fn: submitReject,
    data: rejectData,
  } = useFetch(rejectAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);
  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  // Format date and time
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format time only
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Check if appointment can be marked as completed
  const canMarkCompleted = () => {
    if (userRole !== "DOCTOR" || appointment.status !== "SCHEDULED") {
      return false;
    }
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return now >= appointmentEndTime;
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitCancel(formData);
    }
  };

  // Handle reject appointment (doctor only)
  const handleRejectAppointment = async () => {
    if (rejectLoading) return;

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitReject(formData);
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    // Check if appointment end time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      toast.error(
        "Cannot mark appointment as completed before the scheduled end time."
      );
      return;
    }

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("grading", grading);
    formData.append("improvementStatus", improvementStatus);
    formData.append("doctorSummary", doctorSummary);
    await submitMarkCompleted(formData);
  };

  // Handle save notes (doctor only)
  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("notes", notes);
    await submitNotes(formData);
  };

  // Handle join video call
  const handleJoinVideoCall = () => {
    if (isJoiningCall) return;

    setIsJoiningCall(true);
    router.push(
      `/video-call?appointmentId=${appointment.id}&from=${
        userRole === "DOCTOR" ? "doctor" : "appointments"
      }`
    );
  };

  // Handle successful operations
  useEffect(() => {
    if (cancelData?.success) {
      toast.success("Appointment cancelled successfully");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (rejectData?.success) {
      toast.success("Appointment rejected and credits refunded");
      setAction(null);
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [rejectData, refetchAppointments, router]);

  useEffect(() => {
    if (completeData?.success) {
      toast.success("Appointment marked as completed");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [completeData, refetchAppointments, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success("Notes saved successfully");
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [notesData, refetchAppointments, router]);

  // Check if appointment is expired (scheduled but end time passed)
  const isExpired = () => {
    if (appointment.status !== "SCHEDULED") return false;
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return now > appointmentEndTime;
  };

  // Determine if appointment is active (within 30 minutes of start time)
  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    // Can join 10 minutes before start until the scheduled end time
    return (
      (appointmentTime.getTime() - now.getTime() <= 10 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  // Determine other party information based on user role
  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;

  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon = userRole === "DOCTOR" ? <User /> : <Stethoscope />;

  return (
    <>
      <Card className="border-sky-200 dark:border-sky-900/20 hover:border-sky-700/30 transition-all">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/20 rounded-full p-2 mt-1">
                {otherPartyIcon}
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {userRole === "DOCTOR"
                    ? formatName(otherParty.name)
                    : formatDoctorName(otherParty.name)}
                </h3>
                {userRole === "DOCTOR" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.gender} • {otherParty.email}
                  </p>
                )}
                {userRole === "PATIENT" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.specialty} • {otherParty.gender}
                  </p>
                )}
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </span>
                </div>
                {appointment.status === "COMPLETED" && appointment.grading && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-100/50 dark:bg-sky-900/20 px-2 py-1 rounded-lg w-fit">
                    <TrendingUp className="h-3 w-3" />
                    Medical Report Card Available
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 self-end md:self-start">
              <Badge
                variant="outline"
                className={
                  appointment.status === "COMPLETED"
                    ? "bg-sky-100 dark:bg-sky-900/20 border-sky-900/30 text-sky-500 dark:text-sky-400"
                    : appointment.status === "CANCELLED" || appointment.status === "REJECTED"
                    ? "bg-red-900/20 border-red-900/30 text-red-400"
                    : isExpired()
                    ? "bg-slate-200 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                }
              >
                {appointment.status === "COMPLETED" ? "COMPLETED" : isExpired() ? "SESSION ENDED" : appointment.status}
              </Badge>
              <div className="flex gap-2 mt-2 flex-wrap">
                {userRole === "DOCTOR" && appointment.status === "SCHEDULED" && !isExpired() && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-900/30 text-red-400 hover:bg-red-900/10"
                    onClick={() => setAction("reject")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                )}
                {canMarkCompleted() && (
                  <Button
                    size="sm"
                    onClick={() => setAction("complete")}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete Your Feedback
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-sky-900/30"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={action === "complete"} onOpenChange={(isOpen) => !isOpen && setAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Complete Consultation
            </DialogTitle>
            <DialogDescription>
              Provide feedback for the patient's medical report card.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Improvement Status</Label>
              <Select value={improvementStatus} onValueChange={setImprovementStatus}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Improving">Improving</SelectItem>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                  <SelectItem value="Excellent Progress">Excellent Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grading (e.g. A+, 8.5, Good)</Label>
              <Input 
                value={grading} 
                onChange={(e) => setGrading(e.target.value)}
                placeholder="Grade the patient's recovery..."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Doctor's Summary / Feedback</Label>
              <Textarea 
                value={doctorSummary}
                onChange={(e) => setDoctorSummary(e.target.value)}
                placeholder="Describe patient's progress and next steps..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={completeLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkCompleted} 
              className="bg-sky-600 hover:bg-sky-700"
              disabled={completeLoading || !grading || !doctorSummary}
            >
              {completeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Save & Complete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={action === "reject"} onOpenChange={(isOpen) => !isOpen && setAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Reject Appointment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this appointment? The patient will be automatically refunded their credits.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setAction(null)} disabled={rejectLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectAppointment} 
              className="bg-red-600 hover:bg-red-700"
              disabled={rejectLoading}
            >
              {rejectLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                "Yes, Reject Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "SCHEDULED"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Other Party Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {otherPartyLabel}
              </h4>
              <div className="flex items-center">
                <div className="h-5 w-5 text-sky-500 dark:text-sky-400 mr-2">
                  {otherPartyIcon}
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {userRole === "DOCTOR"
                      ? formatName(otherParty.name)
                      : formatDoctorName(otherParty.name)}
                  </p>
                  {userRole === "DOCTOR" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.gender} • {otherParty.email}
                    </p>
                  )}
                  {userRole === "PATIENT" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.specialty} • {otherParty.gender}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Time */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Scheduled Time
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-sky-500 dark:text-sky-400 mr-2" />
                  <p className="text-foreground">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-sky-500 dark:text-sky-400 mr-2" />
                  <p className="text-foreground">
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <Badge
                variant="outline"
                className={
                  appointment.status === "COMPLETED"
                    ? "bg-sky-100 dark:bg-sky-900/20 border-sky-900/30 text-sky-500 dark:text-sky-400"
                    : appointment.status === "CANCELLED"
                    ? "bg-red-900/20 border-red-900/30 text-red-400"
                    : isExpired()
                    ? "bg-slate-200 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                }
              >
                {isExpired() ? "EXPIRED" : appointment.status}
              </Badge>
            </div>

            {/* Patient Description */}
            {appointment.patientDescription && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  {userRole === "DOCTOR"
                    ? "Patient's Clinical Concern"
                    : "Your Consultation Topic"}
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-sky-200 dark:border-sky-900/20">
                  <p className="text-foreground whitespace-pre-line">
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Join Video Call Button */}
            {appointment.status === "SCHEDULED" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Video Consultation
                </h4>
                <Button
                  className={cn(
                    "w-full transition-all duration-300",
                    isAppointmentActive() 
                      ? "bg-sky-600 hover:bg-sky-700 shadow-md" 
                      : "bg-muted text-muted-foreground cursor-not-allowed border-none shadow-none"
                  )}
                  disabled={!isAppointmentActive() || isJoiningCall}
                  onClick={handleJoinVideoCall}
                >
                  {isJoiningCall ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening Video Call...
                    </>
                  ) : isAppointmentActive() ? (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Join Video Call Now
                    </>
                  ) : new Date() < new Date(appointment.startTime) ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Available {format(new Date(appointment.startTime), "h:mm a")}
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Consultation Time Ended
                    </>
                  )}
                </Button>
                {!isAppointmentActive() && new Date() < new Date(appointment.startTime) && (
                  <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-medium">
                    The join button will activate 10 minutes before the scheduled time.
                  </p>
                )}
              </div>
            )}

            {/* Doctor Notes (Doctor can view/edit, Patient can only view) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Doctor Notes
                </h4>
                {userRole === "DOCTOR" &&
                  action !== "notes" &&
                  appointment.status !== "CANCELLED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAction("notes")}
                      className="h-7 text-sky-500 dark:text-sky-400 hover:text-sky-300 hover:bg-sky-100 dark:bg-sky-900/20"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      {appointment.notes ? "Edit" : "Add"}
                    </Button>
                  )}
              </div>

              {userRole === "DOCTOR" && action === "notes" ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your clinical notes here..."
                    className="bg-background border-sky-200 dark:border-sky-900/20 min-h-[100px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || "");
                      }}
                      disabled={notesLoading}
                      className="border-sky-900/30"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={notesLoading}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      {notesLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted/20 border border-sky-200 dark:border-sky-900/20 min-h-[80px]">
                  {appointment.notes ? (
                    <p className="text-foreground whitespace-pre-line">
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No notes added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex gap-2">
              {/* Mark as Complete Button - Only for doctors */}
              {canMarkCompleted() && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {/* Cancel Button - For scheduled appointments */}
              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10 mt-3 sm:mt-0"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Report Card / Feedback (Visible to both if completed) */}
            {appointment.status === "COMPLETED" && appointment.grading && (
              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Medical Report Card
                </h4>
                <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Grade:</span>
                      <Badge className="bg-sky-500 text-white font-bold">{appointment.grading}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">Status:</span>
                      <Badge variant="outline" className="border-sky-200 text-sky-700 dark:text-sky-300">
                        {appointment.improvementStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Doctor's Summary:</span>
                    <p className="text-sm text-foreground leading-relaxed italic">
                      "{appointment.doctorSummary}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setOpen(false)}
              className="bg-sky-600 hover:bg-sky-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
