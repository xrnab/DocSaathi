"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAshaWorkerProfile, 
  getAshaFamilies, 
  createAshaFamily, 
  addAshaFamilyMember, 
  updateMemberImmunisations, 
  createOutbreakReport, 
  getAshaAppointments, 
  getVerifiedDoctors,
  bookAshaPatientAppointment,
  getAshaDashboardStats
} from "@/actions/asha";
import { 
  getActiveEmergencies, 
  updateEmergencyStatus, 
  assignDoctorToEmergency 
} from "@/actions/emergency";
import { getAshaEarnings, getAshaPayouts } from "@/actions/payout";
import { 
  getAshaPregnancies, 
  registerPregnancy, 
  searchPatientsForPregnancy, 
  logANCVisit 
} from "@/actions/pregnancy";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { AshaEarnings } from "./_components/asha-earnings";
import { AshaProfile } from "./_components/asha-profile";
import { getPusherClient } from "@/lib/pusher";
import { useOfflineAsha } from "@/hooks/use-offline-asha";
import { useOfflineSyncCtx } from "@/components/offline-sync-provider";
import { PendingSyncBadge } from "@/components/pending-sync-badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import StatsCardSkeleton from "@/components/skeletons/stats-card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Plus, 
  Calendar, 
  Check, 
  AlertCircle, 
  MapPin, 
  Activity, 
  Heart, 
  Stethoscope, 
  CheckCircle,
  Loader2,
  QrCode,
  AlertTriangle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const VACCINE_LIST = [
  { name: "BCG (Tuberculosis)", code: "BCG" },
  { name: "Hepatitis B - Birth", code: "HEPB_0" },
  { name: "OPV - 1, 2, 3 (Polio)", code: "OPV_123" },
  { name: "Rotavirus (RVV)", code: "RVV" },
  { name: "Pentavalent (DPT+HepB+Hib)", code: "PENTA" },
  { name: "Measles & Rubella (MR) 1st Dose", code: "MR_1" },
  { name: "DPT Booster", code: "DPT_BOOST" },
];

export default function AshaWorkerDashboard() {
  const searchParams = useSearchParams();
  const prefillName = searchParams ? searchParams.get("prefillName") : null;

  const { isOnline, enqueue } = useOfflineSyncCtx();
  const {
    families,
    loading: offlineAshaLoading,
    createFamily,
    addMember,
    recordVaccination
  } = useOfflineAsha();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ familiesCount: 0, membersCount: 0, outbreakReports: 0, proxyAppointments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [earnings, setEarnings] = useState({ thisMonthEarnings: 0, completedAppointments: 0, averageEarningsPerMonth: 0, availableCredits: 0, availablePayout: 0 });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("registry");

  // Form states
  const [newFamily, setNewFamily] = useState({ headName: "", village: "", block: "", pincode: "" });
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [newMember, setNewMember] = useState({ name: "", age: "", gender: "Male", relation: "Son", immunisations: [] });
  const [outbreak, setOutbreak] = useState({ symptoms: [], village: "", block: "", caseCount: "", notes: "" });
  const [appointmentForm, setAppointmentForm] = useState({ doctorId: "", startTime: "", memberName: "", notes: "" });

  // Action states
  const [submittingFamily, setSubmittingFamily] = useState(false);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingOutbreak, setSubmittingOutbreak] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [message, setMessage] = useState(null);

  // Emergency States
  const [emergencies, setEmergencies] = useState([]);
  const [emergencyLoading, setEmergencyLoading] = useState(true);

  // Pregnancy States
  const [pregnancies, setPregnancies] = useState([]);
  const [pregnanciesLoading, setPregnanciesLoading] = useState(true);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientForPregnancy, setSelectedPatientForPregnancy] = useState(null);
  const [registerPregnancyForm, setRegisterPregnancyForm] = useState({
    lmpDate: "",
    weight: "",
    bloodPressure: "",
    hemoglobin: ""
  });
  const [submittingPregnancy, setSubmittingPregnancy] = useState(false);
  const [selectedPregnancyForANC, setSelectedPregnancyForANC] = useState(null);
  const [ancVisitForm, setAncVisitForm] = useState({
    visitNumber: "1",
    visitDate: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    bloodPressure: "",
    hemoglobin: "",
    bloodSugar: "",
    fundalHeight: "",
    fetalHeartRate: "",
    notes: ""
  });
  const [submittingANC, setSubmittingANC] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isANCDialogOpen, setIsANCDialogOpen] = useState(false);

  const fetchPregnancies = useCallback(async () => {
    if (!isOnline) return;
    setPregnanciesLoading(true);
    try {
      const res = await getAshaPregnancies();
      if (res && !res.error) {
        setPregnancies(res);
        setHighRiskCount(res.filter(p => p.isHighRisk).length);
      }
    } catch (e) {
      console.error("Failed to load pregnancies:", e);
    } finally {
      setPregnanciesLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchedPatients([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await searchPatientsForPregnancy(searchQuery);
        if (res?.patients) {
          setSearchedPatients(res.patients);
        }
      } catch (err) {
        console.error("Error searching patients:", err);
      } finally {
        setSearchingPatients(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await getActiveEmergencies();
      if (res.emergencies) {
        setEmergencies(res.emergencies);
      }
    } catch (e) {
      console.error("Failed to load active emergencies:", e);
    } finally {
      setEmergencyLoading(false);
    }
  }, []);

  const handleAssignDoctor = async (emergencyId, doctorId) => {
    if (!doctorId) return;
    try {
      const res = await assignDoctorToEmergency(emergencyId, doctorId);
      if (res.success) {
        showNotification("Verified doctor successfully assigned & directed!");
        fetchEmergencies();
      }
    } catch (err) {
      showNotification(err.message || "Failed to direct doctor", "error");
    }
  };

  const handleUpdateStatus = async (emergencyId, newStatus) => {
    try {
      const res = await updateEmergencyStatus(emergencyId, newStatus);
      if (res.success) {
        showNotification(`Emergency status updated to ${newStatus}`);
        fetchEmergencies();
      }
    } catch (err) {
      showNotification(err.message || "Failed to update status", "error");
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchEmergencies();

      const pusher = getPusherClient();
      if (pusher) {
        const channel = pusher.subscribe("emergency-channel");

        channel.bind("new-emergency", (data) => {
          showNotification(`🚨 CRITICAL EMERGENCY SOS: ${data.patientName} needs help!`, "error");
          fetchEmergencies();
        });

        channel.bind("emergency-assigned", () => {
          fetchEmergencies();
        });

        return () => {
          channel.unbind_all();
          pusher.unsubscribe("emergency-channel");
        };
      }
    }
  }, [isOnline, fetchEmergencies]);

  useEffect(() => {
    if (prefillName) {
      setAppointmentForm(prev => ({
        ...prev,
        memberName: prefillName
      }));
      setActiveTab("proxy");
    }
  }, [prefillName]);

  useEffect(() => {
    const tabParam = searchParams ? searchParams.get("tab") : null;
    if (tabParam && ["registry", "immunisation", "outbreak", "proxy", "emergency", "earnings", "profile", "pregnancy"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        const prof = await getAshaWorkerProfile();
        if (!prof) {
          // Fallback demo profile if clerk is mock or not set up
          setProfile({
            name: "Gurpreet Kaur",
            ashaId: "ASHA-PB-14785",
            village: "Sauja",
            block: "Nabha, Patiala",
            credits: 20
          });
        } else {
          setProfile(prof);
        }

        let apps = [];
        let docs = [];
        if (isOnline) {
          fetchPregnancies();
          try {
            apps = await getAshaAppointments();
          } catch (e) {
            console.error(e);
          }
          try {
            setStatsLoading(true);
            const dashboardStats = await getAshaDashboardStats();
            if (dashboardStats) {
              setStats(dashboardStats);
              setLastSynced(new Date());
            }
          } catch (e) {
            console.error(e);
          } finally {
            setStatsLoading(false);
          }
          try {
            const earnRes = await getAshaEarnings();
            if (earnRes?.earnings) {
              setEarnings(earnRes.earnings);
            }
            const payRes = await getAshaPayouts();
            if (payRes?.payouts) {
              setPayouts(payRes.payouts);
            }
          } catch (e) {
            console.error("Failed to load ASHA financial data:", e);
          }
        }
        try {
          docs = await getVerifiedDoctors();
        } catch (e) {
          console.error(e);
        }
        setAppointments(apps || []);
        setDoctors(docs || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOnline, fetchPregnancies]);

  const showNotification = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setSubmittingFamily(true);
    try {
      const familyPayload = {
        ...newFamily,
        village: newFamily.village || profile?.village || "Sauja",
        block: newFamily.block || profile?.block || "Nabha"
      };

      const res = await createFamily(familyPayload);

      if (res.queued) {
        showNotification("Saved locally, will sync when online");
      } else if (res.result?.success) {
        showNotification("Household registry created successfully!");
        if (isOnline) {
          const fresh = await getAshaDashboardStats();
          if (fresh) setStats(fresh);
        }
      }
      setNewFamily({ headName: "", village: "", block: "", pincode: "" });
    } catch (err) {
      showNotification(err.message || "Failed to create household", "error");
    } finally {
      setSubmittingFamily(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedFamilyId) {
      showNotification("Please select a household family first", "error");
      return;
    }
    setSubmittingMember(true);
    try {
      const memberPayload = {
        name: newMember.name,
        age: parseInt(newMember.age, 10),
        gender: newMember.gender,
        relation: newMember.relation,
        immunisations: JSON.stringify(newMember.immunisations)
      };

      const res = await addMember(selectedFamilyId, memberPayload);

      if (res.queued) {
        showNotification("Saved locally, will sync when online");
      } else if (res.result?.success) {
        showNotification("All updates successfully synced!");
        if (isOnline) {
          const fresh = await getAshaDashboardStats();
          if (fresh) setStats(fresh);
        }
      }
      setNewMember({ name: "", age: "", gender: "Male", relation: "Son", immunisations: [] });
    } catch (err) {
      showNotification(err.message || "Failed to add family member", "error");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleToggleVaccine = async (member, vaccineCode) => {
    let currentVaccines = [];
    try {
      currentVaccines = member.immunisations ? JSON.parse(member.immunisations) : [];
    } catch (e) {
      currentVaccines = [];
    }

    const updated = currentVaccines.includes(vaccineCode)
      ? currentVaccines.filter(v => v !== vaccineCode)
      : [...currentVaccines, vaccineCode];

    try {
      const res = await recordVaccination({
        memberId: member.id,
        immunisations: JSON.stringify(updated)
      });

      if (res.queued) {
        showNotification("Saved locally, will sync when online");
      } else if (res.result?.success) {
        showNotification("Vaccination record updated successfully!");
        if (isOnline) {
          const fresh = await getAshaDashboardStats();
          if (fresh) setStats(fresh);
        }
      }
    } catch (err) {
      showNotification("Failed to update immunisation", "error");
    }
  };

  const handleToggleOutbreakSymptom = (sym) => {
    const current = outbreak.symptoms;
    const updated = current.includes(sym)
      ? current.filter(s => s !== sym)
      : [...current, sym];
    setOutbreak(prev => ({ ...prev, symptoms: updated }));
  };

  const handleSubmitOutbreak = async (e) => {
    e.preventDefault();
    if (outbreak.symptoms.length === 0) {
      showNotification("Please select at least one active symptom", "error");
      return;
    }
    setSubmittingOutbreak(true);
    try {
      const outbreakPayload = {
        symptoms: outbreak.symptoms,
        village: outbreak.village || profile?.village || "Sauja",
        block: outbreak.block || profile?.block || "Nabha",
        caseCount: parseInt(outbreak.caseCount, 10),
        notes: outbreak.notes
      };

      if (isOnline) {
        const res = await createOutbreakReport(outbreakPayload);
        if (res.success) {
          showNotification("CRITICAL ALERT DISPATCHED: Outbreak reported to District Surveillance Office!");
          const fresh = await getAshaDashboardStats();
          if (fresh) setStats(fresh);
        }
      } else {
        await enqueue("CREATE_OUTBREAK_REPORT", outbreakPayload);
        showNotification("Saved locally, will sync when online");
      }
      setOutbreak({ symptoms: [], village: "", block: "", caseCount: "", notes: "" });
    } catch (err) {
      showNotification(err.message || "Failed to submit report", "error");
    } finally {
      setSubmittingOutbreak(false);
    }
  };

  const handleBookProxyAppointment = async (e) => {
    e.preventDefault();
    setSubmittingBooking(true);
    try {
      const start = new Date(appointmentForm.startTime);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins

      const bookingPayload = {
        doctorId: appointmentForm.doctorId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        memberName: appointmentForm.memberName,
        notes: appointmentForm.notes
      };

      if (isOnline) {
        const res = await bookAshaPatientAppointment(bookingPayload);
        if (res.success) {
          showNotification(`Telemedicine consultation scheduled for ${appointmentForm.memberName}!`);
          const apps = await getAshaAppointments();
          setAppointments(apps);
          const prof = await getAshaWorkerProfile();
          if (prof) setProfile(prof);
        }
      } else {
        await enqueue("BOOK_ASHA_APPOINTMENT", bookingPayload);
        showNotification("Saved locally, will sync when online");
        
        const optimisticApp = {
          id: `local-app-${Date.now()}`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          patientDescription: `Booked by ASHA Worker (Offline Queue) for family member: ${appointmentForm.memberName}. Notes: ${appointmentForm.notes || "None"}`,
          doctor: doctors.find(d => d.id === appointmentForm.doctorId) || { name: "Selected Doctor", specialty: "Specialist" },
          _pendingSync: true
        };
        setAppointments(prev => [optimisticApp, ...prev]);
      }
      setAppointmentForm({ doctorId: "", startTime: "", memberName: "", notes: "" });
    } catch (err) {
      showNotification(err.message || "Failed to book appointment", "error");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleRegisterPregnancy = async (e) => {
    e.preventDefault();
    if (!selectedPatientForPregnancy) {
      showNotification("Please select a patient first", "error");
      return;
    }
    setSubmittingPregnancy(true);
    try {
      const payload = {
        patientId: selectedPatientForPregnancy.id,
        lmpDate: registerPregnancyForm.lmpDate,
        weight: registerPregnancyForm.weight || null,
        bloodPressure: registerPregnancyForm.bloodPressure || null,
        hemoglobin: registerPregnancyForm.hemoglobin || null,
      };

      const res = await registerPregnancy(payload);
      if (res.success) {
        showNotification("Maternal health registry created successfully!");
        setIsRegisterDialogOpen(false);
        setRegisterPregnancyForm({
          lmpDate: "",
          weight: "",
          bloodPressure: "",
          hemoglobin: ""
        });
        setSelectedPatientForPregnancy(null);
        fetchPregnancies();
      } else {
        showNotification(res.error || "Failed to register pregnancy", "error");
      }
    } catch (err) {
      showNotification(err.message || "Failed to register pregnancy", "error");
    } finally {
      setSubmittingPregnancy(false);
    }
  };

  const handleLogANCSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPregnancyForANC) {
      showNotification("No pregnancy case selected", "error");
      return;
    }
    setSubmittingANC(true);
    try {
      const payload = {
        visitNumber: ancVisitForm.visitNumber,
        visitDate: ancVisitForm.visitDate,
        weight: ancVisitForm.weight || null,
        bloodPressure: ancVisitForm.bloodPressure || null,
        hemoglobin: ancVisitForm.hemoglobin || null,
        bloodSugar: ancVisitForm.bloodSugar || null,
        fundalHeight: ancVisitForm.fundalHeight || null,
        fetalHeartRate: ancVisitForm.fetalHeartRate || null,
        notes: ancVisitForm.notes || null,
      };

      const res = await logANCVisit(selectedPregnancyForANC.id, payload);
      if (res.success) {
        showNotification("Antenatal checkup logged successfully!");
        setIsANCDialogOpen(false);
        setAncVisitForm({
          visitNumber: "1",
          visitDate: format(new Date(), "yyyy-MM-dd"),
          weight: "",
          bloodPressure: "",
          hemoglobin: "",
          bloodSugar: "",
          fundalHeight: "",
          fetalHeartRate: "",
          notes: ""
        });
        setSelectedPregnancyForANC(null);
        fetchPregnancies();
      } else {
        showNotification(res.error || "Failed to log checkup", "error");
      }
    } catch (err) {
      showNotification(err.message || "Failed to log checkup", "error");
    } finally {
      setSubmittingANC(false);
    }
  };

  if (loading || offlineAshaLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading ASHA Health Hub...</p>
      </div>
    );
  }

  const totalMembers = families.reduce((sum, f) => sum + (f.members?.length || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl animate-in fade-in duration-300">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3 shadow-xs select-none animate-in slide-in-from-top duration-300">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500 animate-pulse" />
          <div className="text-xs sm:text-sm font-semibold">
            You're offline. Family registry, vaccinations, and outbreak reports are saved locally and will sync automatically.
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-xl transition-all border ${
          message.type === "error" 
            ? "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
            : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        }`}>
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-8 md:p-12 shadow-lg border border-sky-400/20">
        <div className="absolute top-0 right-0 transform translate-x-20 -translate-y-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 transform -translate-x-20 translate-y-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 mr-1.5 fill-red-400 text-red-400" /> Government Accredited ASHA
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Sat Sri Akaal, {profile?.name || "Gurpreet Kaur"}
            </h1>
            <p className="text-sky-100 max-w-xl text-sm md:text-base leading-relaxed">
              Your dedication secures the health of <strong>{profile?.village || "Sauja"}</strong>. Track households, manage vaccines, and book doctor calls here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
            <div>
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider">ASHA ID</p>
              <p className="text-lg font-mono font-bold text-white">{profile?.ashaId || "ASHA-PB-14785"}</p>
            </div>
            <div>
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider">Region</p>
              <p className="text-lg font-bold text-white leading-tight">{profile?.village || "Sauja"} ({profile?.block?.split(",")[0] || "Nabha"})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <StatsCardSkeleton key={idx} />
          ))
        ) : (
          [
            { title: "Families Registered", count: stats.familiesCount || families.length, color: "sky", icon: Users },
            { title: "Members Tracked", count: stats.membersCount || totalMembers, color: "emerald", icon: Heart },
            { title: "Outbreak Reports", count: stats.outbreakReports, color: "rose", icon: AlertTriangle },
            { title: "Proxy Bookings", count: stats.proxyAppointments, color: "purple", icon: Calendar }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className={`bg-card border border-border rounded-2xl p-5 border-l-4 border-l-${card.color}-500 flex flex-col justify-between min-h-[120px] relative hover:shadow-md transition-all duration-300`}
              >
                <Icon className="absolute top-5 right-5 h-5 w-5 text-muted-foreground/60" />
                <div className="flex flex-col justify-between h-full pt-1">
                  <span className="text-3xl font-black text-foreground">{card.count}</span>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-2">{card.title}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Last Sync Timestamp */}
      {lastSynced && (
        <p className="text-xs text-muted-foreground italic -mt-2 mb-6 pl-1 select-none animate-in fade-in duration-300">
          Last sync: {formatDistanceToNow(lastSynced, { addSuffix: true })}
        </p>
      )}

      {/* Tabs Switcher */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-border/80 gap-2 scroll-smooth whitespace-nowrap pb-1">
        <button 
          onClick={() => setActiveTab("registry")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "registry" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Village Households Registry
        </button>
        <button 
          onClick={() => setActiveTab("immunisation")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "immunisation" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Immunisation Tracking
        </button>
        <button 
          onClick={() => setActiveTab("outbreak")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "outbreak" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Epidemiological Outbreak Alerts
        </button>
        <button 
          onClick={() => setActiveTab("proxy")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "proxy" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Proxy Book Doctor
        </button>
        <button 
          onClick={() => setActiveTab("emergency")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "emergency" 
              ? "border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          Emergency SOS Alerts
          {emergencies.filter(e => e.status === "ACTIVE").length > 0 && (
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("pregnancy")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "pregnancy" 
              ? "border-pink-500 text-pink-600 dark:text-pink-400 font-extrabold" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500/20" />
          Pregnancy Cases
          {highRiskCount > 0 && (
            <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full dark:bg-pink-900/30 dark:text-pink-300">
              {highRiskCount} High Risk
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("earnings")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "earnings" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Financials & Payouts
        </button>
        <button 
          onClick={() => setActiveTab("profile")}
          className={`pb-4 px-4 text-sm font-bold border-b-2 transition-all shrink-0 ${
            activeTab === "profile" 
              ? "border-sky-500 text-sky-600 dark:text-sky-400 font-bold" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Manage Profile
        </button>
        <Link href="/asha/scan" className="pb-4 px-4 text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 ml-auto shrink-0">
          <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5 font-bold rounded-xl h-8 cursor-pointer shadow-md shadow-sky-600/10">
            <QrCode className="w-4 h-4" /> Scan Patient
          </Button>
        </Link>
      </div>

      {/* Registry Tab Content */}
      {activeTab === "registry" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Household Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Add New Household</CardTitle>
                <CardDescription>Register a new village family registry card.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateFamily} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="headName">Head of Household</Label>
                    <Input
                      id="headName"
                      required
                      placeholder="e.g. Baldev Singh"
                      value={newFamily.headName}
                      onChange={(e) => setNewFamily(p => ({ ...p, headName: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 147201"
                      value={newFamily.pincode}
                      onChange={(e) => setNewFamily(p => ({ ...p, pincode: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="village">Village</Label>
                      <Input
                        id="village"
                        placeholder={profile?.village || "Sauja"}
                        value={newFamily.village}
                        onChange={(e) => setNewFamily(p => ({ ...p, village: e.target.value }))}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="block">Block</Label>
                      <Input
                        id="block"
                        placeholder={profile?.block?.split(",")[0] || "Nabha"}
                        value={newFamily.block}
                        onChange={(e) => setNewFamily(p => ({ ...p, block: e.target.value }))}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={submittingFamily} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold">
                    {submittingFamily ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Family Record
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add Member Form */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Add Family Member</CardTitle>
                <CardDescription>Register citizens into an existing household.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Select Household</Label>
                    <Select onValueChange={(v) => setSelectedFamilyId(v)} value={selectedFamilyId}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/30">
                        <SelectValue placeholder="Choose a household..." />
                      </SelectTrigger>
                      <SelectContent>
                        {families.map((fam) => (
                          <SelectItem key={fam.id} value={fam.id}>
                            {fam.headName}&apos;s Family ({fam.village})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="memberName">Member Name</Label>
                    <Input
                      id="memberName"
                      required
                      placeholder="e.g. Jaspreet Kaur"
                      value={newMember.name}
                      onChange={(e) => setNewMember(p => ({ ...p, name: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="memberAge">Age (Years)</Label>
                      <Input
                        id="memberAge"
                        type="number"
                        required
                        placeholder="e.g. 4"
                        value={newMember.age}
                        onChange={(e) => setNewMember(p => ({ ...p, age: e.target.value }))}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="memberGender">Gender</Label>
                      <Select onValueChange={(v) => setNewMember(p => ({ ...p, gender: v }))} value={newMember.gender}>
                        <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="memberRelation">Relation to Head</Label>
                    <Select onValueChange={(v) => setNewMember(p => ({ ...p, relation: v }))} value={newMember.relation}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self (Head)</SelectItem>
                        <SelectItem value="Wife">Wife</SelectItem>
                        <SelectItem value="Husband">Husband</SelectItem>
                        <SelectItem value="Son">Son</SelectItem>
                        <SelectItem value="Daughter">Daughter</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={submittingMember} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold">
                    {submittingMember ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Register Citizen
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Households Display List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">Active Village Registry</CardTitle>
                  <CardDescription>Explore houses and registered family members.</CardDescription>
                </div>
                <Users className="w-6 h-6 text-sky-400" />
              </CardHeader>
              <CardContent className="space-y-6">
                {families.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                    <Users className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-foreground">No Households Registered</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Begin by submitting the &quot;Add New Household&quot; form on the left.</p>
                  </div>
                ) : (
                  families.map((fam) => (
                    <div key={fam.id} className="border border-border/80 rounded-2xl p-5 hover:border-sky-400/40 transition-colors bg-slate-50/20 dark:bg-slate-900/10 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-foreground">{fam.headName}&apos;s Household</h4>
                            {fam._pendingSync && <PendingSyncBadge label="Sync Pending" />}
                          </div>
                          <div className="flex items-center text-muted-foreground text-xs font-semibold gap-3 mt-1">
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {fam.village}, {fam.block}</span>
                            {fam.pincode && <span>PIN: {fam.pincode}</span>}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-bold w-fit">
                          {fam.members?.length || 0} Registered Members
                        </span>
                      </div>

                      {/* Family Members Grid */}
                      {(!fam.members || fam.members.length === 0) ? (
                        <p className="text-sm text-muted-foreground italic pl-2">No members registered in this family yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {fam.members.map((mem) => (
                            <div key={mem.id} className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-border/50 shadow-xs flex justify-between items-center">
                              <div>
                                <p className="font-bold text-foreground text-sm">{mem.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{mem.relation} • {mem.gender} • {mem.age} Yrs</p>
                              </div>
                              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/30">
                                Active
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Immunisation Tab Content */}
      {activeTab === "immunisation" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Immunisation Tracker</CardTitle>
              <CardDescription>Administer and record vaccine records for children and expectant mothers.</CardDescription>
            </div>
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" />
          </CardHeader>
          <CardContent className="space-y-6">
            {families.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Please register households and family members first to track immunisations.</p>
              </div>
            ) : (
              families.map((fam) => {
                const pediatricMembers = fam.members?.filter(m => m.age <= 5 || m.relation === "Wife" || m.relation === "Self") || [];
                if (pediatricMembers.length === 0) return null;

                return (
                  <div key={fam.id} className="border border-border/80 rounded-2xl p-6 bg-slate-50/20 dark:bg-slate-900/10 space-y-6">
                    <div className="border-b border-border/60 pb-3">
                      <h4 className="text-lg font-bold text-foreground">{fam.headName}&apos;s Family Immunisations</h4>
                      <p className="text-xs text-muted-foreground mt-1">Village: {fam.village} • Children &amp; Expectant Mothers Registry</p>
                    </div>

                    <div className="space-y-6">
                      {pediatricMembers.map((mem) => {
                        let activeVaccines = [];
                        try {
                          activeVaccines = mem.immunisations ? JSON.parse(mem.immunisations) : [];
                        } catch (e) {
                          activeVaccines = [];
                        }

                        return (
                          <div key={mem.id} className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-border/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-extrabold text-foreground text-base">{mem.name}</span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-3 font-semibold">
                                  {mem.relation} • Age: {mem.age}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-sky-500">
                                {activeVaccines.length} / {VACCINE_LIST.length} Completed
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                              {VACCINE_LIST.map((vac) => {
                                const isChecked = activeVaccines.includes(vac.code);
                                return (
                                  <button
                                    key={vac.code}
                                    onClick={() => handleToggleVaccine(mem, vac.code)}
                                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between gap-2 min-h-[90px] ${
                                      isChecked
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                        : "bg-slate-50 dark:bg-slate-900/40 text-muted-foreground border-border/60 hover:border-sky-300/40"
                                    }`}
                                  >
                                    <span className="text-[10px] font-black leading-tight uppercase select-none">{vac.code}</span>
                                    <div className={`p-1.5 rounded-full border ${isChecked ? "bg-emerald-500 text-white" : "bg-transparent text-muted-foreground/30 border-dashed"}`}>
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[9px] font-medium leading-none select-none">{vac.name.split(" ")[0]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Outbreak Alert Tab Content */}
      {activeTab === "outbreak" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Trigger Outbreak Alert</CardTitle>
                <CardDescription>Send early-warning symptom alerts to the District Medical Officer immediately.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOutbreak} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Active Symptoms Observed</Label>
                    <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                      {["Fever", "Cough", "Rash", "Diarrhea", "Vomiting", "Jaundice"].map((sym) => {
                        const isSelected = outbreak.symptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => handleToggleOutbreakSymptom(sym)}
                            className={`p-2.5 rounded-xl border text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                : "bg-slate-50 dark:bg-slate-900/30 border-border/60 text-muted-foreground hover:bg-slate-100"
                            }`}
                          >
                            {sym}
                            {isSelected && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="outbreakVillage">Village</Label>
                      <Input
                        id="outbreakVillage"
                        placeholder={profile?.village || "Sauja"}
                        value={outbreak.village}
                        onChange={(e) => setOutbreak(p => ({ ...p, village: e.target.value }))}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="outbreakBlock">Block</Label>
                      <Input
                        id="outbreakBlock"
                        placeholder={profile?.block?.split(",")[0] || "Nabha"}
                        value={outbreak.block}
                        onChange={(e) => setOutbreak(p => ({ ...p, block: e.target.value }))}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="caseCount">Identified Patient Case Count</Label>
                    <Input
                      id="caseCount"
                      type="number"
                      required
                      placeholder="e.g. 5"
                      value={outbreak.caseCount}
                      onChange={(e) => setOutbreak(p => ({ ...p, caseCount: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="outbreakNotes">Additional Field Notes</Label>
                    <Textarea
                      id="outbreakNotes"
                      placeholder="Mention water source issues, sudden onset details, etc."
                      value={outbreak.notes}
                      onChange={(e) => setOutbreak(p => ({ ...p, notes: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30 min-h-[90px]"
                    />
                  </div>

                  <Button type="submit" disabled={submittingOutbreak} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold">
                    {submittingOutbreak ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                    Dispatch Outbreak Alert
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-border bg-card shadow-sm border-l-4 border-l-rose-500">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="text-rose-500 w-5 h-5" /> Epidemiological Monitoring
                </CardTitle>
                <CardDescription>
                  Your alerts directly seed the Nabha public health Early-Warning surveillance system, identifying local anomalies before outbreaks escalate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-5 rounded-2xl space-y-3 text-rose-800 dark:text-rose-300 text-sm leading-relaxed">
                  <h4 className="font-bold flex items-center gap-2 text-base text-rose-900 dark:text-rose-200">
                    <Activity className="w-4 h-4 animate-pulse" /> Outbreak Early Warning Parameters
                  </h4>
                  <p>
                    When you report cases here, DocSaathi&apos;s epidemiological system immediately monitors specific village and pincode trends. If symptom reports spike over <strong>200% within 48 hours</strong>, the platform triggers an automatic notification on the public health surveillance dashboard.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-200 dark:border-rose-800/40">Village-Level Surveillance</span>
                    <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-200 dark:border-rose-800/40">Symptom Trend Analysis</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Proxy Book Doctor Tab Content */}
      {activeTab === "proxy" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Booking Form */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Proxy Book Consult</CardTitle>
                <CardDescription>Schedule a specialist video consult for any village member.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookProxyAppointment} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="memberSelect">Select Patient</Label>
                    <Select onValueChange={(v) => setAppointmentForm(p => ({ ...p, memberName: v }))} value={appointmentForm.memberName}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/30">
                        <SelectValue placeholder="Choose family citizen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {families.flatMap(f => f.members || []).map((mem) => (
                          <SelectItem key={mem.id} value={mem.name}>
                            {mem.name} (Age: {mem.age}, {mem.relation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="doctorSelect">Select Verified Doctor</Label>
                    <Select onValueChange={(v) => setAppointmentForm(p => ({ ...p, doctorId: v }))} value={appointmentForm.doctorId}>
                      <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/30">
                        <SelectValue placeholder="Choose specialist..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <SelectItem value="demo-doc">Dr. Amritpal Singh (General Physician)</SelectItem>
                        ) : (
                          doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name} ({doc.specialty})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bookingTime">Preferred Time Slot</Label>
                    <Input
                      id="bookingTime"
                      type="datetime-local"
                      required
                      value={appointmentForm.startTime}
                      onChange={(e) => setAppointmentForm(p => ({ ...p, startTime: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bookingNotes">Consultation Symptoms / Reason</Label>
                    <Textarea
                      id="bookingNotes"
                      required
                      placeholder="Describe symptoms briefly (e.g. chest pain, stomach ache)..."
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm(p => ({ ...p, notes: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30 min-h-[90px]"
                    />
                  </div>

                  <Button type="submit" disabled={submittingBooking} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold">
                    {submittingBooking ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Stethoscope className="w-4 h-4 mr-2" />}
                    Confirm Appointment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booked Consultations Logs */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Proxy Scheduled Logs</CardTitle>
                <CardDescription>Monitor upcoming appointments booked on behalf of villagers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                    <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="font-bold text-lg text-foreground">No proxy consultations scheduled</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Book slots using the form on the left for low-connectivity villagers.</p>
                  </div>
                ) : (
                  appointments.map((app) => (
                    <div key={app.id} className="border border-border/80 rounded-2xl p-5 hover:border-sky-400/40 transition-all bg-slate-50/20 dark:bg-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Approved Scheduled Consultation
                        </span>
                        <h4 className="text-lg font-extrabold text-foreground">
                          {app.patientDescription?.split("member: ")[1]?.split(".")[0] || "Registered Villager"}
                        </h4>
                        <p className="text-sm font-semibold text-muted-foreground">
                          Doctor: <strong className="text-foreground">{app.doctor?.name} ({app.doctor?.specialty})</strong>
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed italic max-w-lg mt-1">
                          Notes: {app.patientDescription || "None"}
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <p className="text-sm font-black text-foreground">{format(new Date(app.startTime), "EEEE, MMM d")}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{format(new Date(app.startTime), "h:mm a")} - {format(new Date(app.endTime), "h:mm a")}</p>
                        <span className="inline-block mt-3 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                          Vonage Telehealth Ready
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Emergency SOS Alerts Tab Content */}
      {activeTab === "emergency" && (
        <div className="space-y-6">
          <Card className="border-rose-100 dark:border-rose-950/40 bg-rose-50/5 dark:bg-rose-950/5 shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600 animate-pulse" />
            <CardHeader className="pl-6 sm:pl-8">
              <CardTitle className="text-xl font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Activity className="h-5 w-5 animate-pulse" /> Active Critical SOS Dispatch Monitor
              </CardTitle>
              <CardDescription>
                Acknowledge incoming patient emergencies, locate their coordinates, and immediately refer/direct active verified medical specialist doctors.
              </CardDescription>
            </CardHeader>
          </Card>

          {emergencyLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">Resolving active dispatches...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
              <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-foreground">Zero active alerts in the region</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">No emergency broadcasts have been registered or active in your area today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencies.map((em) => (
                <div 
                  key={em.id} 
                  className={`border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                    em.status === "ACTIVE" 
                      ? "border-rose-200 dark:border-rose-900/50 bg-rose-500/5" 
                      : "border-amber-200 dark:border-amber-900/50 bg-amber-500/5"
                  }`}
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`text-white px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full border-none ${
                        em.status === "ACTIVE" ? "bg-rose-600 animate-pulse animate-duration-1000" : "bg-amber-600"
                      }`}>
                        {em.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Alerted: {formatDistanceToNow(new Date(em.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-foreground">{em.patient?.name || "Patient Needs Assistance"}</h4>
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 capitalize">
                      📍 Village: <strong className="text-foreground">{em.patient?.village || "Sauja"}</strong>
                      {em.address && <span className="text-xs">({em.address})</span>}
                    </p>

                    {em.message && (
                      <div className="bg-white/60 dark:bg-black/30 border border-border/50 p-3 rounded-xl max-w-2xl text-xs sm:text-sm font-semibold leading-relaxed text-foreground/80 italic">
                        "{em.message}"
                      </div>
                    )}

                    {/* Coordinates Map link if active */}
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

                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3.5 shrink-0 w-full sm:w-auto">
                    {/* Direct Doctor Directive Selector */}
                    <div className="space-y-1.5 w-full sm:w-56">
                      <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        {em.assignedDoctor ? "Directed Specialist" : "Direct verified doctor"}
                      </label>
                      
                      {em.assignedDoctor ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold flex flex-col gap-0.5">
                          <span>State: Directed Directive</span>
                          <span className="font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">Dr. {em.assignedDoctor.name}</span>
                          <span className="text-[9px] font-black opacity-80 uppercase tracking-widest mt-0.5">{em.assignedDoctor.specialty}</span>
                        </div>
                      ) : (
                        <Select onValueChange={(val) => handleAssignDoctor(em.id, val)}>
                          <SelectTrigger className="bg-white dark:bg-slate-950 border border-border/80 text-xs rounded-xl shadow-xs font-bold h-10 w-full cursor-pointer">
                            <SelectValue placeholder="Refer priority Doctor..." />
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

                    {/* Emergency Status Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      {em.status === "ACTIVE" && (
                        <Button 
                          onClick={() => handleUpdateStatus(em.id, "RESPONDING")}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 px-4 flex-1 sm:flex-initial cursor-pointer"
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
      )}

      {/* Pregnancy Cases Tab Content */}
      {activeTab === "pregnancy" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Action Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 shadow-md border border-pink-400/20">
            <div className="absolute top-0 right-0 transform translate-x-20 -translate-y-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Heart className="h-5 w-5 fill-white" /> Maternal Care & Case Tracker
                </h3>
                <p className="text-pink-100 text-xs sm:text-sm mt-1 max-w-2xl">
                  Register pregnant mothers, log their routine Antenatal Care (ANC) visits, track risk conditions, and secure healthy deliveries in {profile?.village || "Sauja"}.
                </p>
              </div>
              <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white hover:bg-pink-50 text-pink-600 font-bold rounded-xl h-10 px-5 shadow-xs cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" /> Register Pregnancy
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-pink-600">
                      <Heart className="w-5 h-5 fill-pink-500" /> New Pregnancy Registration
                    </DialogTitle>
                    <DialogDescription>
                      Search for a registered village citizen, then specify pregnancy and baseline health details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterPregnancy} className="space-y-4 pt-2">
                    {/* Search Patient */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Find Village Patient</Label>
                      <Input
                        placeholder="Search patient by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50/50 dark:bg-slate-900/30"
                      />
                      {searchingPatients && (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 mt-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching patients...
                        </p>
                      )}
                      {searchedPatients.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg bg-card divide-y divide-border">
                          {searchedPatients.map((p) => {
                            const isSelected = selectedPatientForPregnancy?.id === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatientForPregnancy(p);
                                  setSearchQuery("");
                                  setSearchedPatients([]);
                                }}
                                className={`w-full text-left p-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 flex justify-between items-center ${
                                  isSelected ? "bg-pink-500/5 text-pink-600" : "text-foreground"
                                }`}
                              >
                                <div>
                                  <p className="font-extrabold">{p.name}</p>
                                  <p className="text-muted-foreground text-[10px] mt-0.5">{p.village} • Age: {p.age}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-pink-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedPatientForPregnancy && (
                      <div className="p-3 bg-pink-500/5 border border-pink-200 dark:border-pink-900/40 rounded-xl text-xs flex justify-between items-center animate-in fade-in duration-300">
                        <div>
                          <p className="font-bold text-pink-700 dark:text-pink-300">Selected: {selectedPatientForPregnancy.name}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">Village: {selectedPatientForPregnancy.village} • Age: {selectedPatientForPregnancy.age}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => setSelectedPatientForPregnancy(null)}
                          className="text-muted-foreground hover:text-red-500 font-bold h-6 cursor-pointer"
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="lmpDate">Last Menstrual Period (LMP)</Label>
                        <Input
                          id="lmpDate"
                          type="date"
                          required
                          value={registerPregnancyForm.lmpDate}
                          onChange={(e) => setRegisterPregnancyForm(p => ({ ...p, lmpDate: e.target.value }))}
                          className="bg-slate-50/50 dark:bg-slate-900/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pregWeight">Baseline Weight (kg)</Label>
                        <Input
                          id="pregWeight"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 54.5"
                          value={registerPregnancyForm.weight}
                          onChange={(e) => setRegisterPregnancyForm(p => ({ ...p, weight: e.target.value }))}
                          className="bg-slate-50/50 dark:bg-slate-900/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pregBP">Baseline Blood Pressure</Label>
                        <Input
                          id="pregBP"
                          placeholder="e.g. 120/80"
                          value={registerPregnancyForm.bloodPressure}
                          onChange={(e) => setRegisterPregnancyForm(p => ({ ...p, bloodPressure: e.target.value }))}
                          className="bg-slate-50/50 dark:bg-slate-900/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pregHb">Baseline Hemoglobin (g/dL)</Label>
                        <Input
                          id="pregHb"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 11.2"
                          value={registerPregnancyForm.hemoglobin}
                          onChange={(e) => setRegisterPregnancyForm(p => ({ ...p, hemoglobin: e.target.value }))}
                          className="bg-slate-50/50 dark:bg-slate-900/30"
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={submittingPregnancy || !selectedPatientForPregnancy} 
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold w-full"
                      >
                        {submittingPregnancy ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Maternal Registry
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Maternal Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: "Total Active Cases", count: pregnancies.length, color: "pink" },
              { title: "High-Risk Cases", count: highRiskCount, color: "rose" },
              { title: "Due in 30 Days", count: pregnancies.filter(p => p.daysUntilDue <= 30 && p.daysUntilDue >= 0).length, color: "amber" }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`bg-card border border-border rounded-xl p-4 border-l-4 border-l-${stat.color}-500 flex flex-col justify-between`}
              >
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{stat.title}</span>
                <span className={`text-2xl font-black text-${stat.color}-600 dark:text-${stat.color}-400 mt-2`}>
                  {pregnanciesLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : stat.count}
                </span>
              </div>
            ))}
          </div>

          {/* Pregnancy Cases Grid */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Active Case Directories</CardTitle>
                <CardDescription>Maternal details, gestational progress, and critical risks for registered patients.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {pregnanciesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-semibold">Loading active cases...</p>
                </div>
              ) : pregnancies.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                  <Heart className="w-12 h-12 text-pink-200 dark:text-pink-900 mx-auto mb-3" />
                  <h3 className="font-extrabold text-lg text-foreground">No active cases assigned</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">Register a patient to track their gestational health progress.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pregnancies.map((preg) => (
                    <div 
                      key={preg.id} 
                      className={`border rounded-2xl p-5 hover:border-pink-400/40 transition-colors bg-slate-50/20 dark:bg-slate-900/10 space-y-4 border-l-4 ${
                        preg.isHighRisk 
                          ? "border-l-rose-500 border-rose-100 dark:border-rose-950/40" 
                          : "border-l-pink-500 border-border/80"
                      }`}
                    >
                      <div className="flex justify-between items-start border-b border-border/60 pb-3 gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-foreground">{preg.patient.name}</h4>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">Village: {preg.patient.village} • Age: {preg.patient.age} years</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                            preg.isHighRisk
                              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 animate-pulse"
                              : "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400"
                          }`}>
                            {preg.isHighRisk ? "High Risk" : "Normal Risk"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            Due in {preg.daysUntilDue} days
                          </span>
                        </div>
                      </div>

                      {/* Trimester progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-foreground leading-none">
                          <span>Trimester {preg.trimester}</span>
                          <span className="text-pink-600 dark:text-pink-400">{preg.weeksPregnant} / 40 Weeks</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all rounded-full"
                            style={{ width: `${Math.min((preg.weeksPregnant / 40) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Vitals overview */}
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-border/50 text-center">
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Weight</p>
                          <p className="text-xs font-extrabold text-foreground mt-0.5">{preg.weight ? `${preg.weight} kg` : "—"}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-border/50 text-center">
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">BP</p>
                          <p className="text-xs font-extrabold text-foreground mt-0.5">{preg.bloodPressure || "—"}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-950 p-2 rounded-xl border border-border/50 text-center">
                          <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Hemoglobin</p>
                          <p className={`text-xs font-extrabold mt-0.5 ${preg.hemoglobin && preg.hemoglobin < 10 ? "text-rose-600" : "text-foreground"}`}>
                            {preg.hemoglobin ? `${preg.hemoglobin} g/dL` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Risk factors list */}
                      {preg.isHighRisk && preg.riskFactors?.length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-2.5 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-400 space-y-1">
                          <p className="text-[10px] font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
                            ⚠️ Risk Factors Detected:
                          </p>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {preg.riskFactors.map((rf, idx) => (
                              <li key={idx}>{rf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Last Checkup log */}
                      <div className="text-xs font-semibold text-muted-foreground flex justify-between items-center py-1">
                        <span>Completed Visits: <strong className="text-foreground">{preg.ancVisits?.length || 0}</strong></span>
                        <span>
                          Last ANC: <strong className="text-foreground">
                            {preg.ancVisits?.[0] ? format(new Date(preg.ancVisits[0].visitDate), "MMM dd, yyyy") : "None recorded"}
                          </strong>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2.5 pt-2">
                        <Button 
                          onClick={() => {
                            setSelectedPregnancyForANC(preg);
                            setAncVisitForm(f => ({
                              ...f,
                              visitNumber: String((preg.ancVisits?.length || 0) + 1),
                              weight: preg.weight ? String(preg.weight) : "",
                              bloodPressure: preg.bloodPressure || "",
                              hemoglobin: preg.hemoglobin ? String(preg.hemoglobin) : "",
                            }));
                            setIsANCDialogOpen(true);
                          }}
                          className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs h-9 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Log ANC Visit
                        </Button>
                        <Link href="/pregnancy" className="flex-1">
                          <Button 
                            variant="outline"
                            className="w-full border-pink-200 hover:bg-pink-50 dark:border-pink-900/60 dark:hover:bg-pink-950/20 text-pink-600 font-bold rounded-xl text-xs h-9 cursor-pointer"
                          >
                            AI Risk Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Log ANC Visit Dialog */}
          <Dialog open={isANCDialogOpen} onOpenChange={setIsANCDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-pink-600">
                  <Heart className="w-5 h-5 fill-pink-500" /> Log Antenatal Care (ANC) Visit
                </DialogTitle>
                <DialogDescription>
                  Log ANC parameters and vitals for <strong className="text-foreground">{selectedPregnancyForANC?.patient?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogANCSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ancNum">Visit Number</Label>
                    <Input
                      id="ancNum"
                      type="number"
                      required
                      value={ancVisitForm.visitNumber}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, visitNumber: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ancDate">Visit Date</Label>
                    <Input
                      id="ancDate"
                      type="date"
                      required
                      value={ancVisitForm.visitDate}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, visitDate: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ancWeight">Weight (kg)</Label>
                    <Input
                      id="ancWeight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 56.2"
                      value={ancVisitForm.weight}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, weight: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ancBP">Blood Pressure</Label>
                    <Input
                      id="ancBP"
                      placeholder="e.g. 130/85"
                      value={ancVisitForm.bloodPressure}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, bloodPressure: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ancHb">Hemoglobin (g/dL)</Label>
                    <Input
                      id="ancHb"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 10.5"
                      value={ancVisitForm.hemoglobin}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, hemoglobin: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ancSugar">Blood Sugar (mg/dL)</Label>
                    <Input
                      id="ancSugar"
                      type="number"
                      placeholder="e.g. 110"
                      value={ancVisitForm.bloodSugar}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, bloodSugar: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ancFundal">Fundal Height (cm)</Label>
                    <Input
                      id="ancFundal"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 24"
                      value={ancVisitForm.fundalHeight}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, fundalHeight: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ancFHR">FHR (bpm)</Label>
                    <Input
                      id="ancFHR"
                      type="number"
                      placeholder="e.g. 140"
                      value={ancVisitForm.fetalHeartRate}
                      onChange={(e) => setAncVisitForm(p => ({ ...p, fetalHeartRate: e.target.value }))}
                      className="bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ancNotes">Consultation Field Notes</Label>
                  <Textarea
                    id="ancNotes"
                    placeholder="E.g. complaint of edema, taking IFA tablets daily..."
                    value={ancVisitForm.notes}
                    onChange={(e) => setAncVisitForm(p => ({ ...p, notes: e.target.value }))}
                    className="bg-slate-50/50 dark:bg-slate-900/30 min-h-[80px]"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={submittingANC} 
                    className="bg-pink-600 hover:bg-pink-700 text-white font-bold w-full"
                  >
                    {submittingANC ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="w-4 h-4 mr-2" />}
                    Confirm & Save ANC Record
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Financials & Payouts Tab Content */}
      {activeTab === "earnings" && (
        <div className="animate-in fade-in duration-300">
          <AshaEarnings earnings={earnings} payouts={payouts} />
        </div>
      )}

      {/* Manage Profile Tab Content */}
      {activeTab === "profile" && profile && (
        <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
          <AshaProfile user={profile} />
        </div>
      )}
    </div>
  );
}
