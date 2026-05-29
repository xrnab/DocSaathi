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
  getRegisteredAshas
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
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UnifiedEmergencyPage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Patient trigger states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submittingSOS, setSubmittingSOS] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Admin/ASHA monitor states
  const [emergencies, setEmergencies] = useState([]);
  const [emergenciesLoading, setEmergenciesLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [ashas, setAshas] = useState([]);
  const [messageToast, setMessageToast] = useState(null);

  const showToast = (text, type = "success") => {
    setMessageToast({ text, type });
    setTimeout(() => setMessageToast(null), 5000);
  };

  const loadProfile = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setDbUser(u);
    } catch (e) {
      console.error("Failed to load user profile:", e);
    } finally {
      setPageLoading(false);
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
    const isStaff = dbUser && ["ADMIN", "OWNER", "ASHA_WORKER"].includes(dbUser.role);
    if (isStaff) {
      fetchStaffData();

      const pusher = getPusherClient();
      if (pusher) {
        const channel = pusher.subscribe("emergency-channel");

        channel.bind("new-emergency", (data) => {
          showToast(`🚨 ALERT: New critical emergency from ${data.patientName}!`, "error");
          fetchStaffData();
        });

        channel.bind("emergency-assigned", () => {
          fetchStaffData();
        });

        return () => {
          channel.unbind_all();
          pusher.unsubscribe("emergency-channel");
        };
      }
    }
  }, [dbUser, fetchStaffData]);

  // Capture patient geolocation
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

  // Update Status
  const handleUpdateStatus = async (emergencyId, status) => {
    try {
      const res = await updateEmergencyStatus(emergencyId, status);
      if (res.success) {
        showToast(`Emergency status updated to ${status}`);
        fetchStaffData();
      }
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
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
  const isAdministrative = ["ADMIN", "OWNER", "ASHA_WORKER"].includes(role);

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

      {/* ADMIN OR ASHA DISPATCH CENTER */}
      {isAdministrative ? (
        <div className="space-y-6">
          <Card className="border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-500/10 to-transparent shadow-md rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-rose-600 animate-pulse" />
            <CardHeader className="pl-6 sm:pl-8 py-6">
              <div className="flex items-center gap-3">
                <HeartPulse className="h-8 w-8 text-rose-500 animate-pulse shrink-0" />
                <CardTitle className="text-2xl font-black text-rose-900 dark:text-rose-400 uppercase tracking-wide">
                  Live SOS Dispatch Hub
                </CardTitle>
              </div>
              <CardDescription className="font-semibold text-rose-800/80 dark:text-rose-300/80 mt-1">
                Role: {role === "ASHA_WORKER" ? "ASHA Health Worker" : "Public Health Administrator"}. Coordinate active emergencies and dispatch responders immediately.
              </CardDescription>
            </CardHeader>
          </Card>

          {emergenciesLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">Resolving live active SOS dispatches...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border bg-slate-50/20 dark:bg-slate-900/10 rounded-3xl">
              <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-foreground">Zero Active SOS Alerts</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">No emergency broadcasts have been registered or active in Nabha area today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencies.map((em) => (
                <div 
                  key={em.id} 
                  className={`border rounded-3xl p-6 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card border-border relative overflow-hidden`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 animate-pulse" />
                  
                  {/* Left patient info */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border-none bg-rose-600 animate-pulse`}>
                        {em.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(em.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <h4 className="text-xl font-black text-foreground">{em.patient?.name || "Patient Needs Assistance"}</h4>
                    
                    <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 capitalize">
                      📍 Village: <strong className="text-foreground">{em.patient?.village || "Sauja"}</strong>
                      {em.address && <span className="text-xs">({em.address})</span>}
                    </p>

                    {em.message && (
                      <div className="bg-muted/40 border border-border/50 p-4 rounded-2xl max-w-2xl text-xs sm:text-sm font-semibold leading-relaxed text-foreground/80 italic">
                        "{em.message}"
                      </div>
                    )}

                    {(em.latitude && em.longitude) && (
                      <a 
                        href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1"
                      >
                        🗺️ View Patient Location on Google Maps →
                      </a>
                    )}
                  </div>

                  {/* Right Dispatches console */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 shrink-0 w-full sm:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-border">
                    
                    {/* ASHA dispatcher selector (ADMIN only) */}
                    {["ADMIN", "OWNER"].includes(role) && (
                      <div className="space-y-1.5 w-full sm:w-56">
                        <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                          ASHA Worker Dispatch
                        </label>
                        
                        {em.assignedAsha ? (
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-xs font-bold flex flex-col gap-0.5">
                            <span>👩‍⚕️ Assigned: {em.assignedAsha.name}</span>
                            <span className="text-[9px] font-black opacity-80 uppercase tracking-widest mt-0.5">Block: {em.assignedAsha.block}</span>
                          </div>
                        ) : (
                          <Select onValueChange={(val) => handleAssignAsha(em.id, val)}>
                            <SelectTrigger className="bg-white dark:bg-slate-950 border border-border/80 text-xs rounded-xl shadow-xs font-bold h-10 w-full cursor-pointer">
                              <SelectValue placeholder="Dispatch ASHA Worker..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ashas.length === 0 ? (
                                <SelectItem value="demo-asha">Gurpreet Kaur (Sauja)</SelectItem>
                              ) : (
                                ashas.map((as) => (
                                  <SelectItem key={as.id} value={as.id}>
                                    {as.name} ({as.village})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* Doctor Referral Select */}
                    <div className="space-y-1.5 w-full sm:w-56">
                      <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        Medical Specialist Refer
                      </label>
                      
                      {em.assignedDoctor ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold flex flex-col gap-0.5">
                          <span>👨‍⚕️ Referred: Dr. {em.assignedDoctor.name}</span>
                          <span className="text-[9px] font-black opacity-80 uppercase tracking-widest mt-0.5">{em.assignedDoctor.specialty}</span>
                        </div>
                      ) : (
                        <Select onValueChange={(val) => handleAssignDoctor(em.id, val)}>
                          <SelectTrigger className="bg-white dark:bg-slate-950 border border-border/80 text-xs rounded-xl shadow-xs font-bold h-10 w-full cursor-pointer">
                            <SelectValue placeholder="Assign Specialist..." />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length === 0 ? (
                              <SelectItem value="demo-doc">Dr. Amritpal Singh (GP)</SelectItem>
                            ) : (
                              doctors.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>
                                  Dr. {doc.name} ({doc.specialty})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Actions Status buttons */}
                    <div className="flex gap-2 w-full sm:w-auto mt-2">
                      {em.status === "ACTIVE" && (
                        <Button 
                          onClick={() => handleUpdateStatus(em.id, "RESPONDING")}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 px-4 flex-1 sm:flex-initial cursor-pointer shadow-sm shadow-amber-500/10"
                        >
                          Respond
                        </Button>
                      )}
                      <Button 
                        onClick={() => handleUpdateStatus(em.id, "RESOLVED")}
                        variant="outline"
                        size="sm"
                        className="border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/20 text-rose-600 font-bold rounded-xl h-10 px-4 flex-1 sm:flex-initial cursor-pointer"
                      >
                        Resolve
                      </Button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* PATIENT OR PUBLIC TRIGGER TERMINAL */
        <div className="max-w-2xl mx-auto space-y-6">
          
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
                  <div className="bg-emerald-500/10 text-emerald-600 p-4 rounded-2xl border border-emerald-500/20 inline-flex font-bold">
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
                <form onSubmit={handleSubmitSOS} className="space-y-6">
                  
                  {/* Geolocation Lock Button */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-border/80 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Lock coordinates automatically</h4>
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
                      required
                      placeholder="e.g. Elderly patient chest pain and breathing difficulty, or pesticide burn accident..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="bg-slate-50/30 dark:bg-slate-900/20 min-h-[90px]"
                    />
                  </div>

                  {/* Critical SOS Trigger Button */}
                  <Button 
                    type="submit" 
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

                </form>
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
