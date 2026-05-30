"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getCurrentUser } from "@/actions/onboarding";
import { 
  createEmergencyRequest, 
  getActiveEmergencies, 
  updateEmergencyStatus, 
  assignDoctorToEmergency,
  assignAshaToEmergency,
  getRegisteredAshas,
  resolveEmergencyByAsha,
  resolveEmergencyByDoctor,
  getLatestPatientEmergency
} from "@/actions/emergency";
import { getVerifiedDoctors } from "@/actions/asha";
import { getPusherClient } from "@/lib/pusher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  HeartPulse, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  PhoneCall, 
  Users, 
  Loader2, 
  ShieldAlert, 
  Check, 
  Stethoscope, 
  Info,
  Clock,
  Compass,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UnifiedEmergencyPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Patient active emergency states
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [activeEmergencyLoading, setActiveEmergencyLoading] = useState(true);

  // Patient trigger states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submittingSOS, setSubmittingSOS] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Admin/ASHA/Doctor monitor states
  const [emergencies, setEmergencies] = useState([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [ashas, setAshas] = useState([]);
  const [messageToast, setMessageToast] = useState(null);

  const showToast = (text, type = "success") => {
    setMessageToast({ text, type });
    setTimeout(() => setMessageToast(null), 5000);
  };

  const fetchActiveEmergency = useCallback(async () => {
    try {
      setActiveEmergencyLoading(true);
      const res = await getLatestPatientEmergency();
      if (res && res.emergency) {
        setActiveEmergency(res.emergency);
      } else {
        setActiveEmergency(null);
      }
    } catch (err) {
      console.error("Failed to fetch active patient emergency:", err);
    } finally {
      setActiveEmergencyLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setDbUser(u);
      
      const userRole = u?.role || "UNASSIGNED";
      const isStaff = ["ADMIN", "OWNER", "ASHA_WORKER", "DOCTOR"].includes(userRole);
      if (!isStaff && u) {
        const res = await getLatestPatientEmergency();
        if (res && res.emergency) {
          setActiveEmergency(res.emergency);
        }
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
    } finally {
      setPageLoading(false);
      setActiveEmergencyLoading(false);
    }
  }, []);

  const fetchStaffData = useCallback(async () => {
    try {
      const res = await getActiveEmergencies();
      if (res.emergencies) {
        setEmergencies(res.emergencies);
      }
      
      const docs = await getVerifiedDoctors();
      setDoctors(docs || []);

      const userRole = dbUser?.role || "UNASSIGNED";
      if (["ADMIN", "OWNER"].includes(userRole)) {
        const ashaRes = await getRegisteredAshas();
        setAshas(ashaRes.ashas || []);
      }
    } catch (e) {
      console.error("Failed to fetch administrative data:", e);
    } finally {
      setEmergenciesLoading(false);
    }
  }, [dbUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!dbUser) return;

    const isStaff = ["ADMIN", "OWNER", "ASHA_WORKER", "DOCTOR"].includes(dbUser.role);
    
    // Initial data fetch based on role
    if (isStaff) {
      fetchStaffData();
    } else {
      fetchActiveEmergency();
    }

    const pusher = getPusherClient();
    if (pusher) {
      // 1. Subscribe to personal channel for direct updates/notifications (applicable for all roles)
      const personalChannel = pusher.subscribe(`user-${dbUser.id}`);
      
      personalChannel.bind("appointment-updated", (data) => {
        showToast(`🚨 STATUS UPDATE: ${data.message || "Emergency status updated!"}`);
        if (isStaff) {
          fetchStaffData();
        } else {
          fetchActiveEmergency();
        }
      });

      // 2. Staff members additionally subscribe to the global emergency-channel for dispatches
      let globalChannel = null;
      if (isStaff) {
        globalChannel = pusher.subscribe("emergency-channel");

        globalChannel.bind("new-emergency", (data) => {
          showToast(`🚨 ALERT: New critical emergency from ${data.patientName}!`, "error");
          fetchStaffData();
        });

        globalChannel.bind("emergency-assigned", () => {
          fetchStaffData();
        });
      }

      return () => {
        personalChannel.unbind_all();
        pusher.unsubscribe(`user-${dbUser.id}`);
        if (globalChannel) {
          globalChannel.unbind_all();
          pusher.unsubscribe("emergency-channel");
        }
      };
    }
  }, [dbUser, fetchStaffData, fetchActiveEmergency]);

  // Capture patient geolocation
  // Capture patient geolocation and instantly trigger SOS in one click
  const handleQuickSOSTrigger = async () => {
    setSubmittingSOS(true);
    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Could not retrieve GPS coordinates for quick SOS:", err);
      }
    }

    try {
      const res = await createEmergencyRequest(
        lat,
        lng,
        "One-Click Quick Trigger",
        "🚨 Critical SOS alert triggered instantly via one-click emergency button."
      );
      if (res.success) {
        showToast("🚨 SOS CRITICAL ALERT DISPATCHED SUCCESS!");
        fetchActiveEmergency();
      }
    } catch (err) {
      showToast(err.message || "Failed to trigger SOS", "error");
    } finally {
      setSubmittingSOS(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setFetchingLocation(false);
        showToast("Location successfully locked!");
      },
      (err) => {
        console.error(err);
        setFetchingLocation(false);
        setLocationError("Could not retrieve coordinates. Please enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit emergency SOS
  const handleSubmitSOS = async (e) => {
    e.preventDefault();
    setSubmittingSOS(true);
    try {
      const res = await createEmergencyRequest(latitude, longitude, address, message);
      if (res.success) {
        setTriggerSuccess(true);
        setMessage("");
        setAddress("");
        setLatitude(null);
        setLongitude(null);
        showToast("🚨 SOS CRITICAL ALERT DISPATCHED SUCCESS!");
        fetchActiveEmergency();
      }
    } catch (err) {
      showToast(err.message || "Failed to trigger SOS", "error");
    } finally {
      setSubmittingSOS(false);
    }
  };

  // Assign Doctor Referral
  const handleAssignDoctor = async (emergencyId, docId) => {
    try {
      const res = await assignDoctorToEmergency(emergencyId, docId);
      if (res.success) {
        showToast("Verified Doctor successfully assigned & directed!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Failed to assign doctor", "error");
    }
  };

  // Assign ASHA worker (Admin only)
  const handleAssignAsha = async (emergencyId, ashaId) => {
    try {
      const res = await assignAshaToEmergency(emergencyId, ashaId);
      if (res.success) {
        showToast("ASHA Community health worker dispatched!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Failed to dispatch ASHA", "error");
    }
  };

  // ASHA arrives check-in
  const handleAshaArrived = async (emergencyId) => {
    try {
      const res = await resolveEmergencyByAsha(emergencyId);
      if (res.success) {
        showToast("Successfully notified Doctor and Admins that you have reached the location and directed the doctor!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Arrival notification failed", "error");
    }
  };

  // Doctor resolution (conduct operation)
  const handleDoctorResolved = async (emergencyId) => {
    try {
      const res = await resolveEmergencyByDoctor(emergencyId);
      if (res.success) {
        showToast("Emergency situation successfully conducted and resolved!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Resolution failed", "error");
    }
  };

  // Acknowledge ACTIVE emergency status
  const handleAcknowledge = async (emergencyId) => {
    try {
      const res = await updateEmergencyStatus(emergencyId, "RESPONDING");
      if (res.success) {
        showToast("Emergency SOS successfully acknowledged!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Acknowledge failed", "error");
    }
  };

  // Resolve emergency overall
  const handleForceResolve = async (emergencyId) => {
    try {
      const res = await updateEmergencyStatus(emergencyId, "RESOLVED");
      if (res.success) {
        showToast("Emergency forcefully marked as fully resolved!");
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Force resolve failed", "error");
    }
  };

  if (pageLoading || !clerkLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-red-500 animate-spin" />
        <p className="text-muted-foreground font-semibold animate-pulse">Initializing unified emergency terminal...</p>
      </div>
    );
  }

  const role = dbUser?.role || "UNASSIGNED";
  const isAdministrative = ["ADMIN", "OWNER", "ASHA_WORKER", "DOCTOR"].includes(role);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl animate-in fade-in duration-500">
      
      {/* Toast banner */}
      {messageToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-xl border ${
          messageToast.type === "error" 
            ? "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
            : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        }`}>
          <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
          <span className="text-sm font-semibold">{messageToast.text}</span>
        </div>
      )}

      {/* STAFF DISPATCH AND EMERGENCY TRACKING MONITOR */}
      {isAdministrative ? (
        <div className="space-y-6">
          <Card className="border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-500/10 to-transparent shadow-md rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-rose-600 animate-pulse" />
            <CardHeader className="pl-6 sm:pl-8 py-6">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-8 w-8 text-rose-500 animate-pulse shrink-0" />
                <CardTitle className="text-2xl font-black text-rose-900 dark:text-rose-400 uppercase tracking-wide">
                  {role === "DOCTOR" ? "Priority Emergency Operations" : "SOS dispatch board"}
                </CardTitle>
              </div>
              <CardDescription className="font-semibold text-rose-800/80 dark:text-rose-300/80 mt-1">
                {role === "DOCTOR" 
                  ? "Conduct critical operations or consultations assigned to you."
                  : role === "ASHA_WORKER"
                  ? "Accredited village responder board. Coordinate dispatches and notify when arrived & directed doctor."
                  : "Nabha district healthcare controller. Dispatch ASHA workers and specialize refer doctor pathways."
                }
              </CardDescription>
            </CardHeader>
          </Card>

          {emergenciesLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">Resolving active directives...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border bg-slate-50/20 dark:bg-slate-900/10 rounded-3xl">
              <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-foreground">Zero ActiveSOS Cases</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">There are no critical directives registered in the region today.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {emergencies.map((em) => {
                const canAshaCheckIn = role === "ASHA_WORKER" && em.assignedAshaId && !em.ashaResolved;
                const canDoctorConduct = role === "DOCTOR" && em.assignedDoctorId === dbUser.id && !em.doctorResolved;

                return (
                  <div 
                    key={em.id} 
                    className="border border-border/80 bg-card rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 animate-pulse" />
                    
                    {/* Patient Triage details */}
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border-none bg-rose-600 animate-pulse">
                          {em.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(em.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xl font-black text-foreground">{em.patient?.name || "Anonymous Patient"}</h4>
                        <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 capitalize">
                          📍 Location: <strong className="text-foreground">{em.patient?.village || "Sauja"}</strong>
                          {em.address && <span className="text-xs">({em.address})</span>}
                        </p>
                      </div>

                      {em.message && (
                        <div className="bg-muted/40 border border-border/50 p-4 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed text-foreground/80 italic">
                          "{em.message}"
                        </div>
                      )}

                      {/* Map Location Link */}
                      {(em.latitude && em.longitude) && (
                        <a 
                          href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          🗺️ Location coordinates: {em.latitude.toFixed(5)}, {em.longitude.toFixed(5)} (Google Maps) →
                        </a>
                      )}

                      {/* STAGE STEPPER PROCESS TRACKER (ADMIN AND ALL ROLES MONITOR) */}
                      <div className="pt-4 border-t border-border space-y-3">
                        <h5 className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Live tracking stages</h5>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          {/* Step 1: SOS Triggered */}
                          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 border border-emerald-500/20 rounded-xl flex items-center gap-2 font-bold">
                            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span>1. SOS Triggered</span>
                          </div>

                          {/* Step 2: ASHA Worker Dispatched & Arrived */}
                          <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                            em.ashaResolved
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                              : em.assignedAsha
                              ? "bg-amber-500/5 border-amber-500/20 text-amber-600 animate-pulse"
                              : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                          }`}>
                            {em.ashaResolved ? (
                              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                            ) : em.assignedAsha ? (
                              <Compass className="w-4 h-4 shrink-0 text-amber-500 animate-spin" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate">2. ASHA: {em.ashaResolved ? "Arrived & Directed" : em.assignedAsha ? "Heading" : "Pending"}</p>
                              {em.assignedAsha && <p className="text-[9px] font-normal truncate">({em.assignedAsha.name})</p>}
                            </div>
                          </div>

                          {/* Step 3: Doctor Refer Directive */}
                          <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                            em.assignedDoctor
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                              : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                          }`}>
                            {em.assignedDoctor ? (
                              <Stethoscope className="w-4 h-4 shrink-0 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate">3. Doctor: {em.assignedDoctor ? "Directed" : "Pending"}</p>
                              {em.assignedDoctor && <p className="text-[9px] font-normal truncate">({em.assignedDoctor.name})</p>}
                            </div>
                          </div>

                          {/* Step 4: Medical Operation Conducted */}
                          <div className={`p-3 border rounded-xl flex items-center gap-2 font-bold ${
                            em.doctorResolved
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                              : em.assignedDoctor && em.ashaResolved
                              ? "bg-rose-500/5 border-rose-500/20 text-rose-600 animate-pulse"
                              : "bg-slate-50 dark:bg-slate-900/30 border-border text-muted-foreground"
                          }`}>
                            {em.doctorResolved ? (
                              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>4. Triage Conducted</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Operational Assign / Resolve console */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 shrink-0 w-full sm:w-56 border-t lg:border-t-0 pt-4 lg:pt-0 border-border justify-center">
                      
                      {/* ADMIN console: Assign ASHA or Doctor */}
                      {["ADMIN", "OWNER"].includes(role) && (
                        <div className="space-y-4 w-full">
                          
                          {/* ASHA dispatcher selector */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">ASHA responder</label>
                            {em.assignedAsha ? (
                              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-xl border border-indigo-100 text-xs font-bold">
                                👩‍⚕️ Assigned: {em.assignedAsha.name}
                              </div>
                            ) : (
                              <Select onValueChange={(val) => handleAssignAsha(em.id, val)}>
                                <SelectTrigger className="bg-white dark:bg-slate-950 border border-border text-xs rounded-xl shadow-xs font-bold h-9">
                                  <SelectValue placeholder="Dispatch ASHA..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {ashas.map((as) => (
                                    <SelectItem key={as.id} value={as.id}>
                                      {as.name} ({as.village})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Doctor assignment selector */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Specialist referral</label>
                            {em.assignedDoctor ? (
                              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 text-xs font-bold">
                                👨‍⚕️ Directed: Dr. {em.assignedDoctor.name}
                              </div>
                            ) : (
                              <Select onValueChange={(val) => handleAssignDoctor(em.id, val)}>
                                <SelectTrigger className="bg-white dark:bg-slate-950 border border-border text-xs rounded-xl shadow-xs font-bold h-9">
                                  <SelectValue placeholder="Direct Doctor..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                      Dr. {doc.name} ({doc.specialty})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Force Resolve */}
                          <Button 
                            onClick={() => handleForceResolve(em.id)}
                            variant="destructive"
                            size="sm"
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-10 cursor-pointer shadow-sm shadow-rose-500/10"
                          >
                            Resolve Case
                          </Button>
                        </div>
                      )}

                      {/* ASHA console: Assign Doctor and Reached Scene */}
                      {role === "ASHA_WORKER" && (
                        <div className="space-y-4 w-full">
                          
                          {/* Doctor refer */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Refer doctor specialist</label>
                            {em.assignedDoctor ? (
                              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 text-xs font-bold">
                                👨‍⚕️ Referred: Dr. {em.assignedDoctor.name}
                              </div>
                            ) : (
                              <Select onValueChange={(val) => handleAssignDoctor(em.id, val)}>
                                <SelectTrigger className="bg-white dark:bg-slate-950 border border-border text-xs rounded-xl shadow-xs font-bold h-9 cursor-pointer">
                                  <SelectValue placeholder="Assign priority Doctor..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {doctors.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                      Dr. {doc.name} ({doc.specialty})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* ASHA Arrived trigger */}
                          {canAshaCheckIn ? (
                            <Button 
                              onClick={() => handleAshaArrived(em.id)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl h-11 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 animate-pulse cursor-pointer"
                            >
                              <MapPin className="w-4 h-4 shrink-0" /> Reached Location & Directed Doctor
                            </Button>
                          ) : (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100/50 text-xs font-bold text-center">
                              {em.ashaResolved ? "👩‍⚕️ Arrived & Directed Doctor" : "Pending dispatch..."}
                            </div>
                          )}

                          {/* Status responders Acknowledge */}
                          {em.status === "ACTIVE" && (
                            <Button 
                              onClick={() => handleAcknowledge(em.id)}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-9 cursor-pointer"
                            >
                              Acknowledge SOS
                            </Button>
                          )}
                        </div>
                      )}

                      {/* DOCTOR console: Conduct and check resolved */}
                      {role === "DOCTOR" && (
                        <div className="space-y-4 w-full">
                          <Card className="border-rose-100 bg-rose-500/5 p-3.5 rounded-xl border-l-4 border-l-rose-500">
                            <h5 className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest leading-none">Directive status</h5>
                            <p className="text-xs font-bold text-muted-foreground mt-1.5 leading-relaxed">
                              {em.ashaResolved 
                                ? "ASHA worker has arrived at scene. You are authorized to conduct the operation." 
                                : "Waiting for ASHA worker to arrive at location and check in first..."
                              }
                            </p>
                          </Card>

                          {canDoctorConduct ? (
                            <Button 
                              onClick={() => handleDoctorResolved(em.id)}
                              disabled={!em.ashaResolved}
                              className={`w-full text-white font-extrabold rounded-xl h-11 flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                                em.ashaResolved 
                                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10 animate-pulse" 
                                  : "bg-slate-300 hover:bg-slate-300 dark:bg-slate-800 text-muted-foreground cursor-not-allowed shadow-none"
                              }`}
                            >
                              <Stethoscope className="w-4 h-4 shrink-0" /> Conduct & Resolve
                            </Button>
                          ) : (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100/50 text-xs font-bold text-center">
                              {em.doctorResolved ? "👨‍⚕️ Emergency Conducted" : "Assigned Priority Triage"}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* PATIENT OR UNASSIGNED SOS DISPATCH TERMINAL */
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          {activeEmergency ? (
            <div className="space-y-6">
              <Card className="border-rose-250 dark:border-rose-950 bg-gradient-to-br from-rose-500/5 to-rose-600/10 dark:from-rose-950/20 dark:to-transparent shadow-2xl rounded-[2.25rem] overflow-hidden relative border-2">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 animate-pulse" />
                
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="bg-rose-500/10 p-4 rounded-full inline-flex mx-auto mb-4 border border-rose-500/20 animate-bounce">
                    <HeartPulse className="h-10 w-10 text-rose-600" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-black text-rose-950 dark:text-rose-400 uppercase tracking-wide">
                    Live SOS Status Tracker
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold text-muted-foreground max-w-md mx-auto mt-2">
                    Your emergency request is active in our regional system. Responders are coordinate-tracking your position.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-6 pb-8 space-y-6">
                  {/* Stepper Status Monitor */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Live dispatch milestones</h4>
                    
                    <div className="space-y-3.5">
                      {/* Step 1: SOS Dispatched */}
                      <div className="flex items-center gap-3.5 p-3.5 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 border border-emerald-500/25 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xs">
                        <Check className="h-5 w-5 text-emerald-500 shrink-0 bg-emerald-500/10 rounded-full p-0.5" />
                        <div>
                          <p>1. Emergency Alert Dispatched</p>
                          <p className="text-[10px] font-normal text-muted-foreground mt-0.5">Surveillance team alerted & coordinate beacon locked.</p>
                        </div>
                      </div>

                      {/* Step 2: ASHA Responder Status */}
                      <div className={`flex items-center gap-3.5 p-3.5 border rounded-2xl font-extrabold text-xs sm:text-sm shadow-xs transition-all ${
                        activeEmergency.ashaResolved
                          ? "bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 border-emerald-500/25"
                          : activeEmergency.assignedAsha
                          ? "bg-amber-500/5 dark:bg-amber-950/10 text-amber-600 border-amber-500/25 animate-pulse"
                          : "bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground border-border/80"
                      }`}>
                        {activeEmergency.ashaResolved ? (
                          <Check className="h-5 w-5 text-emerald-500 shrink-0 bg-emerald-500/10 rounded-full p-0.5" />
                        ) : activeEmergency.assignedAsha ? (
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-800 shrink-0" />
                        )}
                        <div>
                          <p>
                            2. Local ASHA Worker:{" "}
                            {activeEmergency.ashaResolved
                              ? "Arrived & Directed Doctor! 👩‍⚕️"
                              : activeEmergency.assignedAsha
                              ? "Dispatched & Coming! 🏃‍♀️"
                              : "Assigning Nearest Community Worker..."}
                          </p>
                          <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                            {activeEmergency.ashaResolved
                              ? `ASHA worker ${activeEmergency.assignedAsha?.name || "Responder"} has reached your place and directed the doctor.`
                              : activeEmergency.assignedAsha
                              ? `${activeEmergency.assignedAsha?.name || "ASHA worker"} has been directed and is on their way now.`
                              : "District team is mapping the closest active ASHA worker to dispatch immediately."}
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Specialist Doctor Status */}
                      <div className={`flex items-center gap-3.5 p-3.5 border rounded-2xl font-extrabold text-xs sm:text-sm shadow-xs transition-all ${
                        activeEmergency.assignedDoctor
                          ? "bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 border-emerald-500/25"
                          : activeEmergency.assignedAsha
                          ? "bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground border-border/80"
                          : "bg-slate-50/50 dark:bg-slate-900/30 text-muted-foreground border-border/80"
                      }`}>
                        {activeEmergency.assignedDoctor ? (
                          <Check className="h-5 w-5 text-emerald-500 shrink-0 bg-emerald-500/10 rounded-full p-0.5" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-800 shrink-0" />
                        )}
                        <div>
                          <p>
                            3. Specialist Doctor Referral:{" "}
                            {activeEmergency.assignedDoctor
                              ? "Directed & Coming! 👨‍⚕️"
                              : "Doctor referral on standby..."}
                          </p>
                          <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
                            {activeEmergency.assignedDoctor
                              ? `Dr. ${activeEmergency.assignedDoctor.name} (${activeEmergency.assignedDoctor.specialty}) has been directed and is responding.`
                              : "Referral pathway stands ready once the ASHA worker commences clinical check-in."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Protocols guidelines */}
                  <div className="bg-slate-50/80 dark:bg-slate-900/40 p-5 rounded-[1.5rem] border border-border/80 space-y-4">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-wider">
                      <Info className="h-5 w-5 animate-pulse shrink-0" />
                      <span>First Aid Protocols: What to do right now</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-border/50 space-y-1 shadow-sm">
                        <span className="text-xl">🧘</span>
                        <p className="font-extrabold text-foreground">1. Keep Calm & Breathe</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">Take slow, deep breaths. Sitting or lying down lowers cardiac stress and maintains oxygenation.</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-border/50 space-y-1 shadow-sm">
                        <span className="text-xl">🛑</span>
                        <p className="font-extrabold text-foreground">2. Control Any Bleeding</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">If active bleeding is present, apply firm, continuous direct pressure with a clean cloth or towel.</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-border/50 space-y-1 shadow-sm">
                        <span className="text-xl">💨</span>
                        <p className="font-extrabold text-foreground">3. Keep Airway Clear</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">Ensure breathing is free. If the patient is unconscious, roll them onto their side (recovery position).</p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-border/50 space-y-1 shadow-sm">
                        <span className="text-xl">💡</span>
                        <p className="font-extrabold text-foreground">4. Prepare for Arrival</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">Turn on outside front home lights so responders spot your home instantly. Keep the main gate/door unlocked.</p>
                      </div>
                    </div>
                  </div>

                  {/* Immediate speed dials */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {activeEmergency.assignedAsha && (
                      <a
                        href={`tel:${activeEmergency.assignedAsha.phone || "108"}`}
                        className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-center text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer uppercase tracking-wider"
                      >
                        📞 Call ASHA ({activeEmergency.assignedAsha.name})
                      </a>
                    )}
                    <a
                      href="tel:108"
                      className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-center text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 cursor-pointer uppercase tracking-wider"
                    >
                      📞 Ring 108 Ambulance
                    </a>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  onClick={() => setActiveEmergency(null)}
                  variant="ghost"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Dismiss HUD & file another SOS Alert request
                </Button>
              </div>
            </div>
          ) : (
            <Card className="border-rose-100 dark:border-rose-950 bg-gradient-to-br from-rose-600/10 to-transparent shadow-xl rounded-[2rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <HeartPulse className="w-48 h-48 text-rose-600" />
              </div>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="bg-red-500/10 p-4 rounded-full inline-flex mx-auto mb-4 border border-red-500/20 animate-pulse">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <CardTitle className="text-3xl font-black text-foreground">SOS Emergency Triage</CardTitle>
                <CardDescription className="text-sm font-semibold text-muted-foreground mt-2 max-w-md mx-auto">
                  Trigger a critical alert immediately to regional public health admins and village ASHA workers.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8 pt-4">
                
                {triggerSuccess ? (
                  <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300">
                    <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl border border-emerald-500/20 inline-flex font-bold uppercase tracking-wider">
                      🚨 SOS ALERT DISPATCHED SUCCESS
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                      ASHA community health workers and district medical surveillance teams have been notified. Stay calm. Speed-dial help services below if needed.
                    </p>
                    <Button onClick={() => setTriggerSuccess(false)} variant="outline" className="rounded-xl">
                      File another request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 flex flex-col items-center">
                    {/* Large pulsing circular SOS button */}
                    <div className="relative group cursor-pointer flex justify-center py-6">
                      <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse scale-90" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-red-500/30 animate-ping opacity-60" style={{ animationDuration: '3s' }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-red-500/20 animate-ping opacity-45" style={{ animationDuration: '2s' }} />
                      
                      <button
                        type="button"
                        disabled={submittingSOS}
                        onClick={handleQuickSOSTrigger}
                        className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-red-500 to-red-700 dark:from-red-600 dark:to-red-800 hover:from-red-600 hover:to-red-800 dark:hover:from-red-700 dark:hover:to-red-900 border-4 border-white/10 shadow-2xl flex flex-col items-center justify-center text-center p-4 transition-all duration-300 transform active:scale-95 group-hover:scale-102 cursor-pointer select-none"
                      >
                        {submittingSOS ? (
                          <Loader2 className="h-10 w-10 text-white animate-spin" />
                        ) : (
                          <>
                            <PhoneCall className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-bounce shrink-0" />
                            <span className="text-white font-black text-xl sm:text-2xl mt-1.5 uppercase tracking-widest leading-none drop-shadow-md">SOS</span>
                            <span className="text-white/80 font-black text-[8px] sm:text-[9px] uppercase tracking-wider mt-0.5 leading-none">TAP TO DISPATCH</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center space-y-1.5 max-w-sm">
                      <p className="font-extrabold text-foreground text-sm uppercase tracking-wider">TAP SOS TO TRIGGER DISPATCH INSTANTLY</p>
                      <p className="text-xs text-muted-foreground leading-normal">
                        This will automatically capture your GPS coordinates and send a priority alert to regional ASHA workers and public health controllers. **No typing required.**
                      </p>
                    </div>

                    {/* Collapsible custom input drawer */}
                    <div className="w-full pt-4 border-t border-border/80">
                      <details className="group">
                        <summary className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:underline select-none">
                          <span>Or report custom village details / symptoms (Optional)</span>
                          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                        </summary>
                        
                        <div className="pt-4 space-y-4 text-left animate-in slide-in-from-top-2 duration-300">
                          {/* Geolocation Coordinate Lock Button */}
                          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-border/80 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-foreground">Lock coordinates manually</h4>
                              <p className="text-xs text-muted-foreground">Allows responders to locate your coordinates in Nabha fields/villages.</p>
                            </div>

                            {(latitude && longitude) ? (
                              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 animate-pulse">
                                📍 Coordinates Locked: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                onClick={handleGetLocation} 
                                disabled={fetchingLocation}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl gap-2 cursor-pointer shadow-sm shadow-sky-600/10"
                              >
                                {fetchingLocation ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Locking location...
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="h-4 w-4 shrink-0" />
                                    Lock GPS Location
                                  </>
                                )}
                              </Button>
                            )}

                            {locationError && (
                              <p className="text-xs font-bold text-red-500">{locationError}</p>
                            )}
                          </div>

                          {/* Manual Address Input */}
                          <div className="space-y-1.5">
                            <Label htmlFor="address">Address / Village / landmark (Optional)</Label>
                            <Input
                              id="address"
                              placeholder="e.g. Sauja village, fields near Nabha Patiala highway..."
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="bg-slate-50/30 dark:bg-slate-900/20"
                            />
                          </div>

                          {/* SOS Notes */}
                          <div className="space-y-1.5">
                            <Label htmlFor="message">Describe the emergency situation (Briefly)</Label>
                            <Textarea
                              id="message"
                              placeholder="e.g. Elderly patient chest pain and breathing difficulty, or pesticide burn accident..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="bg-slate-50/30 dark:bg-slate-900/20 min-h-[90px]"
                            />
                          </div>

                          {/* Critical SOS Trigger Button */}
                          <Button 
                            onClick={handleSubmitSOS}
                            disabled={submittingSOS}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black h-12 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer animate-pulse"
                          >
                            {submittingSOS ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <PhoneCall className="h-5 w-5 animate-bounce shrink-0" />
                                TRIGGER EMERGENCY SOS DISPATCH
                              </>
                            )}
                          </Button>
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {/* Direct Speed Dials */}
                <div className="mt-8 border-t border-border pt-6 text-center space-y-4">
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest pl-1">Direct Help Services</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href="tel:108" className="px-5 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-red-500/5">
                      📞 Call 108 Ambulance
                    </a>
                    <a href="tel:112" className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl border border-border transition-all flex items-center gap-1.5">
                      📞 Call 112 Police Help
                    </a>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 p-4 bg-muted/40 rounded-xl border border-border/50 text-[10px] text-muted-foreground select-none leading-relaxed">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-500" />
            <span>
              <strong>Triage Warning:</strong> DocSaathi Emergency SOS routes critical notifications directly to accredited local ASHA workers and public health officers. Do not trigger false alerts. False reports can lead to penalties under public safety codes.
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
