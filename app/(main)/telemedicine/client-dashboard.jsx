"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Users, Activity, Pill, Clock, Video, FileText, Send, Wifi, ChevronRight, UserCircle, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { submitPrescription } from "@/actions/telemedicine";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import VideoCall from "../video-call/video-call-ui"; // Using a placeholder for the demo to avoid WebRTC errors if no key

import { useRouter } from "next/navigation";

export default function TelemedicineDashboardClient({ initialAppointments }) {
  const router = useRouter();
  const [activeAppointment, setActiveAppointment] = useState(initialAppointments[0] || null);
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rxForm, setRxForm] = useState({ name: "", dosage: "", frequency: "", duration: "" });
  
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(format(new Date(), "EEEE, MMM do"));
  }, []);

  const canJoinVideoCall = (appointment) => {
    if (!appointment) return false;

    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);
    const joinWindowStart = new Date(startTime.getTime() - 30 * 60 * 1000);
    const joinWindowEnd = new Date(endTime.getTime() + 60 * 60 * 1000);

    return now >= joinWindowStart && now <= joinWindowEnd;
  };

  const handleJoinCall = () => {
    if (!activeAppointment) return;
    if (!canJoinVideoCall(activeAppointment)) {
      toast.error("Video calls open 30 minutes before the appointment time.");
      return;
    }

    setIsJoining(true);
    router.push(`/video-call?appointmentId=${activeAppointment.id}&from=telemedicine`);
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    if (!rxForm.name || !rxForm.dosage) return toast.error("Name and Dosage required");
    
    setIsPrescribing(true);
    const res = await submitPrescription({
      appointmentId: activeAppointment.id,
      ...rxForm
    });
    setIsPrescribing(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Prescription digitally sent to patient!");
      setRxForm({ name: "", dosage: "", frequency: "", duration: "" });
      // Optimistically add to active patient's list
      if (activeAppointment) {
        setActiveAppointment({
          ...activeAppointment,
          patient: {
            ...activeAppointment.patient,
            prescriptions: [...activeAppointment.patient.prescriptions, res.data]
          }
        });
      }
    }
  };

  const getAge = (dob) => {
    if (!dob) return "N/A";
    const diff = new Date() - new Date(dob);
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + " yrs";
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 pb-20 h-full min-h-[90vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8 text-sky-500" />
            Telemedicine Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your live consultations and patients</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 px-4 py-2 rounded-full border border-sky-100 dark:border-sky-800">
          <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
            {currentDate}
          </span>
        </div>
      </div>

      {initialAppointments.length === 0 ? (
        <Card className="border-sky-200 bg-sky-50/50 p-12 text-center flex flex-col items-center justify-center">
          <Users className="h-16 w-16 text-sky-300 mb-4" />
          <CardTitle className="text-2xl text-foreground">No Appointments Today</CardTitle>
          <p className="text-muted-foreground mt-2">You have no scheduled telemedicine sessions for today. Enjoy your day!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* PATIENT QUEUE: Horizontal on mobile, Vertical on LG */}
          <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Waiting Queue ({initialAppointments.length})
            </h2>
            <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 no-scrollbar" style={{ maxHeight: "calc(100vh - 250px)" }}>
              {initialAppointments.map((app) => {
                const isActive = activeAppointment?.id === app.id;
                return (
                  <Card 
                    key={app.id} 
                    className={`cursor-pointer transition-all flex-shrink-0 w-[280px] lg:w-full ${isActive ? 'border-sky-500 ring-1 ring-sky-500 shadow-md bg-sky-50/50 dark:bg-sky-900/10' : 'hover:border-sky-300'} rounded-xl overflow-hidden`}
                    onClick={() => {
                      setActiveAppointment(app);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="p-4 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-sky-100">
                        {app.patient.imageUrl && <AvatarImage src={app.patient.imageUrl} />}
                        <AvatarFallback className="bg-sky-100 text-sky-700 font-bold">{app.patient.name ? app.patient.name.charAt(0) : "P"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{app.patient.name}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3 mr-1" /> {format(new Date(app.startTime), "h:mm a")}
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 ${isActive ? 'text-sky-500' : 'text-slate-300'}`} />
                    </div>
                    {app.patientDescription && (
                      <div className="bg-muted/50 px-4 py-2 text-xs text-muted-foreground truncate border-t border-border">
                        <span className="font-semibold text-foreground">Issue:</span> {app.patientDescription}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* CENTER STAGE: VIDEO & PRESCRIPTION (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* Video Panel */}
            <Card className="border-sky-200 dark:border-sky-800 shadow-lg rounded-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-900 w-full aspect-video relative flex flex-col items-center justify-center group">
                
                {/* Connection Monitor */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full z-10 border border-white/10">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </div>
                  <Wifi className="h-3 w-3 text-amber-400" />
                  <span className="text-white text-[10px] sm:text-xs font-medium tracking-wide">
                    Waiting to join
                  </span>
                </div>

                {/* Video Placeholder Area */}
                <div className="text-center z-10 p-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-slate-800">
                    {activeAppointment?.patient.imageUrl && <AvatarImage src={activeAppointment.patient.imageUrl} />}
                    <AvatarFallback className="bg-slate-800 text-slate-400 text-3xl font-bold">{activeAppointment?.patient.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-white text-xl font-bold">{activeAppointment?.patient.name}</h3>
                  <p className="text-slate-400 mt-1 mb-6">Scheduled for {format(new Date(activeAppointment?.startTime), "h:mm a")}</p>
                  <Button 
                    size="lg" 
                    onClick={handleJoinCall}
                    disabled={isJoining || !canJoinVideoCall(activeAppointment)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-lg shadow-emerald-900/50"
                  >
                    {isJoining ? "Joining..." : canJoinVideoCall(activeAppointment) ? <><Video className="h-5 w-5 mr-2" /> Join Call</> : "Available 30 min before start"}
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-4 border-t border-border flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  Session Status: <span className="font-mono font-normal text-muted-foreground uppercase">Ready</span>
                </div>
              </div>
            </Card>


            {/* Prescription Form */}
            <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl">
              <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Pill className="h-5 w-5 text-sky-500" />
                  Quick Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePrescribe} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Medicine Name</label>
                      <Input 
                        placeholder="e.g. Amoxicillin" 
                        value={rxForm.name} 
                        onChange={(e) => setRxForm({...rxForm, name: e.target.value})} 
                        className="bg-muted/50 border-sky-100 focus-visible:ring-sky-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Dosage</label>
                      <Input 
                        placeholder="e.g. 500mg" 
                        value={rxForm.dosage} 
                        onChange={(e) => setRxForm({...rxForm, dosage: e.target.value})}
                        className="bg-muted/50 border-sky-100 focus-visible:ring-sky-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Frequency</label>
                      <Input 
                        placeholder="e.g. Twice daily after meals" 
                        value={rxForm.frequency} 
                        onChange={(e) => setRxForm({...rxForm, frequency: e.target.value})}
                        className="bg-muted/50 border-sky-100 focus-visible:ring-sky-500" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                      <Input 
                        placeholder="e.g. 7 Days" 
                        value={rxForm.duration} 
                        onChange={(e) => setRxForm({...rxForm, duration: e.target.value})}
                        className="bg-muted/50 border-sky-100 focus-visible:ring-sky-500" 
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isPrescribing} className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md">
                    {isPrescribing ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Digitally to Patient</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT SIDEBAR: PATIENT HISTORY (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
             {/* Profile Snapshot */}
             <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 to-blue-500"></div>
              <CardContent className="p-6 pt-8">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4 border-4 border-background shadow-md">
                    {activeAppointment?.patient.imageUrl && <AvatarImage src={activeAppointment.patient.imageUrl} />}
                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-600 text-white text-2xl font-bold">
                      {activeAppointment?.patient.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold text-foreground mb-1">{activeAppointment?.patient.name}</h3>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-muted text-xs">Age: {getAge(activeAppointment?.patient.dateOfBirth)}</Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400 border-red-200 text-xs">
                      Blood: {activeAppointment?.patient.bloodType || "N/A"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Past Visits Timeline */}
            <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
              <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 py-4">
                <CardTitle className="text-sm flex items-center gap-2 font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4 text-sky-500" /> Medical Context
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: "400px" }}>
                
                {/* Active Meds */}
                <div className="p-4 border-b border-border">
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center"><Pill className="h-3 w-3 mr-1 text-sky-500"/> Active Medications</h4>
                  {activeAppointment?.patient.prescriptions?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No active prescriptions.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeAppointment?.patient.prescriptions?.map(rx => (
                        <div key={rx.id} className="bg-muted rounded-md p-2 text-xs flex justify-between items-center">
                          <span className="font-semibold">{rx.name}</span>
                          <span className="text-muted-foreground">{rx.dosage}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Visits */}
                <div className="p-4">
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center"><Clock className="h-3 w-3 mr-1 text-sky-500"/> Past Consultations</h4>
                  {activeAppointment?.patient.patientAppointments?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">First time visit.</p>
                  ) : (
                    <div className="space-y-4 border-l-2 border-sky-100 ml-2 pl-4">
                      {activeAppointment?.patient.patientAppointments?.map(visit => (
                        <div key={visit.id} className="relative">
                          <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-sky-400 border border-white"></div>
                          <p className="text-[10px] font-semibold text-sky-600 uppercase mb-0.5">{format(new Date(visit.startTime), "MMM d, yyyy")}</p>
                          <p className="text-xs font-medium text-foreground">{visit.patientDescription || "General Checkup"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
