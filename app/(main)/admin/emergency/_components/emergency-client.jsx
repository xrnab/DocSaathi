"use client";

import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  MapPin, 
  Navigation, 
  Siren,
  Clock,
  Compass,
  Stethoscope,
  Users
} from "lucide-react";
import { 
  updateEmergencyStatus, 
  assignDoctorToEmergency, 
  assignAshaToEmergency, 
  getRegisteredAshas 
} from "@/actions/emergency";
import { getVerifiedDoctors } from "@/actions/asha";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function EmergencyClient({ initialEmergencies }) {
  const [emergencies, setEmergencies] = useState(initialEmergencies);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Responders lists for administrative dispatch console
  const [ashas, setAshas] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Load responders lists on mount
  useEffect(() => {
    async function loadResponders() {
      try {
        const ashaRes = await getRegisteredAshas();
        setAshas(ashaRes.ashas || []);

        const docRes = await getVerifiedDoctors();
        setDoctors(docRes.doctors || []);
      } catch (err) {
        console.error("Failed to load responders in admin console:", err);
      }
    }
    loadResponders();
  }, []);

  // Real-time Pusher updates
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("emergency-channel");

    // Listen for new emergency alerts
    channel.bind("new-emergency", (data) => {
      // Create a unified format matching server payloads
      const newEmergency = {
        id: data.id,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        status: "ACTIVE",
        message: data.message,
        createdAt: new Date(data.createdAt),
        patient: {
          name: data.patientName,
          village: data.address || "Live Coordinates",
        },
      };

      toast.error(`🚨 EMERGENCY SOS: ${data.patientName} needs urgent help!`, {
        duration: 12000,
        description: data.message || "No description provided.",
      });

      // Attempt to play an alert tone if user interaction allowed
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      setEmergencies((prev) => [newEmergency, ...prev]);
    });

    // Listen for assignments, ASHA check-ins, and doctor resolution updates in real-time
    channel.bind("emergency-assigned", (data) => {
      setEmergencies((prev) =>
        prev
          .map((item) => {
            if (item.id === data.id) {
              return {
                ...item,
                status: data.status,
                assignedDoctor: data.assignedDoctor,
                assignedAsha: data.assignedAsha,
                ashaResolved: data.ashaResolved,
                doctorResolved: data.doctorResolved,
              };
            }
            return item;
          })
          .filter((item) => item.status !== "RESOLVED")
      );
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("emergency-channel");
    };
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await updateEmergencyStatus(id, newStatus);
      if (res.success) {
        toast.success(`Emergency updated to ${newStatus.toLowerCase()}`);
        setEmergencies((prev) =>
          prev
            .map((item) =>
              item.id === id ? { ...item, status: newStatus } : item
            )
            .filter((item) => item.status !== "RESOLVED")
        );
      }
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignAsha = async (emergencyId, ashaId) => {
    try {
      const res = await assignAshaToEmergency(emergencyId, ashaId);
      if (res.success) {
        toast.success("ASHA Community health worker successfully dispatched!");
        // Snappy local state update
        setEmergencies((prev) =>
          prev.map((item) =>
            item.id === emergencyId
              ? {
                  ...item,
                  assignedAshaId: ashaId,
                  assignedAsha: ashas.find((as) => as.id === ashaId),
                  status: item.status === "ACTIVE" ? "RESPONDING" : item.status,
                }
              : item
          )
        );
      }
    } catch (err) {
      toast.error(err.message || "Failed to dispatch ASHA");
    }
  };

  const handleAssignDoctor = async (emergencyId, doctorId) => {
    try {
      const res = await assignDoctorToEmergency(emergencyId, doctorId);
      if (res.success) {
        toast.success("Verified Doctor successfully directed to emergency!");
        // Snappy local state update
        setEmergencies((prev) =>
          prev.map((item) =>
            item.id === emergencyId
              ? {
                  ...item,
                  assignedDoctorId: doctorId,
                  assignedDoctor: doctors.find((doc) => doc.id === doctorId),
                  status: item.status === "ACTIVE" ? "RESPONDING" : item.status,
                }
              : item
          )
        );
      }
    } catch (err) {
      toast.error(err.message || "Failed to assign doctor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Siren className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-wide uppercase">Real-Time Dispatch Console</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Listening live for emergency broadcasts across Nabha</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Live Connection</span>
        </div>
      </div>

      {emergencies.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-3xl">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">All Quiet</h3>
          <p className="text-muted-foreground text-sm mt-1">There are currently no active emergency SOS dispatches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {emergencies.map((item) => (
            <Card 
              key={item.id} 
              className={`border transition-all duration-300 rounded-[2rem] overflow-hidden ${
                item.status === "ACTIVE" 
                  ? "border-red-500 bg-red-500/5 shadow-md shadow-red-500/5 animate-in fade-in zoom-in-95" 
                  : "border-amber-500 bg-amber-500/5 shadow-xs"
              }`}
            >
              <CardContent className="p-6 space-y-6">
                
                {/* Header Information and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-xl text-foreground leading-tight">
                        {item.patient?.name || "Anonymous Patient"}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`font-black uppercase tracking-wider text-[9px] px-2.5 py-0.5 rounded-full border-none ${
                          item.status === "ACTIVE"
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      Reported {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.latitude && item.longitude && (
                      <a
                        href={`https://maps.google.com?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-border cursor-pointer"
                      >
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />
                        Open in Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {item.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, "RESPONDING")}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 rounded-xl px-4 shadow-sm"
                      >
                        Mark Responding
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, "RESOLVED")}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 rounded-xl px-4 shadow-sm"
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>

                {/* SOS Message */}
                {item.message && (
                  <div className="bg-background dark:bg-slate-950/40 p-4 rounded-2xl border border-border/80 text-sm text-foreground italic leading-relaxed font-medium">
                    &ldquo;{item.message}&rdquo;
                  </div>
                )}

                {/* Patient coordinates and region details */}
                <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground font-semibold gap-3 sm:gap-6">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-sky-400" />
                    Coordinates: {item.latitude && item.longitude ? `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}` : "Unavailable"}
                  </span>
                  {item.patient?.village && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      Region: {item.patient.village}
                    </span>
                  )}
                </div>

                {/* STAGE STEPPER PROCESS TRACKER (ADMIN MONITOR) */}
                <div className="pt-5 border-t border-border/80 space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Live tracking stages</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    {/* Step 1: SOS Triggered */}
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 border border-emerald-500/20 rounded-xl flex items-center gap-2 font-bold">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>1. SOS Triggered</span>
                    </div>

                    {/* Step 2: ASHA Worker Dispatched & Arrived */}
                    <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                      item.ashaResolved
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                        : item.assignedAsha
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-600 animate-pulse"
                        : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                    }`}>
                      {item.ashaResolved ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : item.assignedAsha ? (
                        <Compass className="w-4 h-4 shrink-0 text-amber-500 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate">2. ASHA: {item.ashaResolved ? "Arrived & Directed" : item.assignedAsha ? "Heading" : "Pending"}</p>
                        {item.assignedAsha && <p className="text-[9px] font-normal truncate">({item.assignedAsha.name})</p>}
                      </div>
                    </div>

                    {/* Step 3: Doctor Refer Directive */}
                    <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                      item.assignedDoctor
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                        : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                    }`}>
                      {item.assignedDoctor ? (
                        <Stethoscope className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate">3. Doctor: {item.assignedDoctor ? "Directed" : "Pending"}</p>
                        {item.assignedDoctor && <p className="text-[9px] font-normal truncate">({item.assignedDoctor.name})</p>}
                      </div>
                    </div>

                    {/* Step 4: Medical Operation Conducted */}
                    <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                      item.doctorResolved
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                        : item.assignedDoctor && item.ashaResolved
                        ? "bg-rose-500/5 border-rose-500/20 text-rose-600 animate-pulse"
                        : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                    }`}>
                      {item.doctorResolved ? (
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>4. Triage Conducted</span>
                    </div>
                  </div>
                </div>

                {/* ADMIN ACTION DISPATCH CONSOLE */}
                <div className="pt-5 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* ASHA dispatcher selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Dispatch ASHA Responder</label>
                    {item.assignedAsha ? (
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-xl border border-indigo-100 text-xs font-bold flex items-center gap-1.5 h-9">
                        <span>👩‍⚕️ Assigned: <strong>{item.assignedAsha.name}</strong></span>
                        {item.assignedAsha.block && <span className="text-[10px] font-normal">({item.assignedAsha.block})</span>}
                      </div>
                    ) : (
                      <Select onValueChange={(val) => handleAssignAsha(item.id, val)}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border border-border text-xs rounded-xl shadow-xs font-bold h-9 cursor-pointer">
                          <SelectValue placeholder="Select & Dispatch ASHA..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ashas.map((as) => (
                            <SelectItem key={as.id} value={as.id}>
                              {as.name} ({as.village || as.block || "Active Block"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Doctor referral selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Direct Specialist Referral</label>
                    {item.assignedDoctor ? (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 text-xs font-bold flex items-center gap-1.5 h-9">
                        <span>👨‍⚕️ Directed: <strong>Dr. {item.assignedDoctor.name}</strong></span>
                        {item.assignedDoctor.specialty && <span className="text-[10px] font-normal">({item.assignedDoctor.specialty})</span>}
                      </div>
                    ) : (
                      <Select onValueChange={(val) => handleAssignDoctor(item.id, val)}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border border-border text-xs rounded-xl shadow-xs font-bold h-9 cursor-pointer">
                          <SelectValue placeholder="Select & Direct Doctor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              Dr. {doc.name} ({doc.specialty || "Specialist"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
