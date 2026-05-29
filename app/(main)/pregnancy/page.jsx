"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Calendar,
  Shield,
  Activity,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  MapPin,
  TrendingUp,
  Hospital
} from "lucide-react";
import { 
  registerPregnancy, 
  getMyPregnancy, 
  logANCVisit, 
  generatePregnancyRiskAssessment 
} from "@/actions/pregnancy";
import { toast } from "sonner";

export default function PregnancyPage() {
  const [pregnancy, setPregnancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [loggingVisit, setLoggingVisit] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);

  // Form states
  const [lmpDate, setLmpDate] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [hb, setHb] = useState("");

  // Collapsible controls
  const [showANCForm, setShowANCForm] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // ANC Form states
  const [ancNumber, setAncNumber] = useState("1");
  const [ancDate, setAncDate] = useState("");
  const [ancWeight, setAncWeight] = useState("");
  const [ancBP, setAncBP] = useState("");
  const [ancHb, setAncHb] = useState("");
  const [ancSugar, setAncSugar] = useState("");
  const [ancFundal, setAncFundal] = useState("");
  const [ancFHR, setAncFHR] = useState("");
  const [ancNotes, setAncNotes] = useState("");

  const loadPregnancy = async () => {
    try {
      setLoading(true);
      const res = await getMyPregnancy();
      if (res && !res.error) {
        setPregnancy(res);
      } else {
        setPregnancy(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load your pregnancy records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPregnancy();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!lmpDate) {
      toast.error("LMP Date is required");
      return;
    }
    setRegistering(true);
    try {
      const payload = {
        lmpDate,
        weight: weight ? parseFloat(weight) : null,
        bloodPressure: bp || null,
        hemoglobin: hb ? parseFloat(hb) : null,
      };
      const res = await registerPregnancy(payload);
      if (res.success) {
        toast.success("Pregnancy registered successfully!");
        loadPregnancy();
      } else {
        toast.error(res.error || "Failed to register pregnancy.");
      }
    } catch (err) {
      toast.error("Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  const handleLogVisit = async (e) => {
    e.preventDefault();
    if (!ancDate) {
      toast.error("Visit Date is required");
      return;
    }
    setLoggingVisit(true);
    try {
      const payload = {
        visitNumber: ancNumber,
        visitDate: ancDate,
        weight: ancWeight,
        bloodPressure: ancBP,
        hemoglobin: ancHb,
        bloodSugar: ancSugar,
        fundalHeight: ancFundal,
        fetalHeartRate: ancFHR,
        notes: ancNotes,
      };
      const res = await logANCVisit(pregnancy.id, payload);
      if (res.success) {
        toast.success(`ANC ${ancNumber} Visit logged successfully!`);
        if (res.newRisks && res.newRisks.length > 0) {
          toast.warning(`Warning: New risk flags identified: ${res.newRisks.join(", ")}`);
        }
        setShowANCForm(false);
        // Clear fields
        setAncWeight("");
        setAncBP("");
        setAncHb("");
        setAncSugar("");
        setAncFundal("");
        setAncFHR("");
        setAncNotes("");
        loadPregnancy();
      } else {
        toast.error(res.error || "Failed to log visit.");
      }
    } catch (err) {
      toast.error("Failed to log visit.");
    } finally {
      setLoggingVisit(false);
    }
  };

  const handleAIAssessment = async () => {
    setAssessing(true);
    try {
      const res = await generatePregnancyRiskAssessment(pregnancy.id);
      if (res.success) {
        setAiAssessment(res.assessment);
        toast.success("AI health risk report generated successfully!");
      } else {
        toast.error(res.error || "Failed to query AI assessment.");
      }
    } catch (err) {
      toast.error("Failed to generate AI report.");
    } finally {
      setAssessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading Pregnancy Care Hub...</p>
      </div>
    );
  }

  // A) Registration Form
  if (!pregnancy) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-0">
        <Card className="border-pink-100 dark:border-pink-900 bg-card shadow-lg rounded-3xl overflow-hidden animate-in fade-in duration-300">
          <div className="bg-pink-500 h-2 w-full" />
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500/20" />
              Register Your Pregnancy
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Begin your maternal care tracking. Providing accurate vitals helps customize automatic alerts and schedule warnings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="lmpDate">Last Menstrual Period (LMP) Date *</Label>
                <Input
                  id="lmpDate"
                  type="date"
                  required
                  value={lmpDate}
                  onChange={(e) => setLmpDate(e.target.value)}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight">Current Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 62.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bp">Blood Pressure (Systolic/Diastolic)</Label>
                <Input
                  id="bp"
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hb">Hemoglobin Level (g/dL)</Label>
                <Input
                  id="hb"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 11.5"
                  value={hb}
                  onChange={(e) => setHb(e.target.value)}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
              </div>

              <Button
                type="submit"
                disabled={registering}
                className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-md cursor-pointer mt-2"
              >
                {registering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Begin Pregnancy Tracking"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trimester & EDD variables
  const daysUntilDue = pregnancy.edd 
    ? Math.ceil((new Date(pregnancy.edd) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  // Render Dashboard
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 sm:px-0 animate-in fade-in duration-300">
      
      {/* 1. HERO PROGRESS CARD */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-200 dark:border-pink-900/40 p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-pink-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
              Trimester {pregnancy.trimester} of 3
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground">
              Week {pregnancy.weeksPregnant}
            </h1>
            <p className="text-muted-foreground font-semibold">
              Due: {isValid(new Date(pregnancy.edd)) ? format(new Date(pregnancy.edd), "MMMM d, yyyy") : ""} ({daysUntilDue > 0 ? `${daysUntilDue} days away` : "Due!"})
            </p>
          </div>
          
          {/* Trimester Progress Dots */}
          <div className="flex items-center gap-4 shrink-0 bg-background/40 backdrop-blur-md p-4 rounded-2xl border border-pink-200/20">
            {[1, 2, 3].map((t) => {
              const active = pregnancy.trimester >= t;
              return (
                <div key={t} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                    active 
                      ? "bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/20" 
                      : "border-muted-foreground/30 text-muted-foreground/60"
                  }`}>
                    T{t}
                  </div>
                  {t < 3 && (
                    <div className={`w-6 h-0.5 ml-2 transition-all ${
                      pregnancy.trimester > t ? "bg-pink-500" : "bg-muted-foreground/20"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Week progress bar: (weeksPregnant/40)*100% */}
        <div className="mt-8 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>Week 1</span>
            <span className="text-pink-600 dark:text-pink-400">Week {pregnancy.weeksPregnant} of 40</span>
            <span>Week 40</span>
          </div>
          <div className="w-full bg-pink-100 dark:bg-pink-950/40 rounded-full h-3.5 border border-pink-200/10">
            <div 
              className="bg-pink-500 h-3 rounded-full transition-all duration-700 shadow-md shadow-pink-500/20"
              style={{ width: `${Math.min((pregnancy.weeksPregnant / 40) * 100, 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 2. HIGH RISK ALERT */}
      {pregnancy.isHighRisk && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 dark:bg-rose-950/10 dark:border-rose-900/40 animate-pulse">
          <div className="flex gap-3.5 items-start">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-700 dark:text-rose-400 text-base">
                High Risk Pregnancy Alert — Please consult your ASHA Worker or Doctor immediately
              </h3>
              <ul className="mt-2.5 space-y-1">
                {pregnancy.riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex gap-2">
                    <span>&bull;</span> {factor}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. VITALS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Weight",
            value: pregnancy.weight ? `${pregnancy.weight} kg` : "N/A",
            desc: "Normal BMI target",
            color: "emerald",
            icon: Activity
          },
          {
            label: "Blood Pressure",
            value: pregnancy.bloodPressure || "N/A",
            desc: "Warning if ≥ 140/90",
            color: pregnancy.bloodPressure && parseInt(pregnancy.bloodPressure.split("/")[0]) >= 140 ? "rose" : "sky",
            icon: Shield
          },
          {
            label: "Hemoglobin",
            value: pregnancy.hemoglobin ? `${pregnancy.hemoglobin} g/dL` : "N/A",
            desc: "Anemia warning < 11",
            color: pregnancy.hemoglobin && pregnancy.hemoglobin < 11 ? "amber" : "emerald",
            icon: Heart
          },
          {
            label: "ANC Visits",
            value: `${pregnancy.ancVisits?.length || 0} / 4`,
            desc: "Required Completed",
            color: "purple",
            icon: Calendar
          }
        ].map((vital, i) => {
          const Icon = vital.icon;
          return (
            <Card key={i} className="border-border bg-card shadow-sm">
              <CardContent className="p-5 flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{vital.label}</span>
                  <div className={`p-1.5 rounded-lg bg-${vital.color}-500/10 text-${vital.color}-600 dark:text-${vital.color}-400 border border-${vital.color}-500/20`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-foreground">{vital.value}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-none">{vital.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 4. UPCOMING REMINDERS */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader suppressHydrationWarning>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-500" />
            Upcoming Care Schedule
          </CardTitle>
          <CardDescription>Antenatal checkups, vaccines, and preparation schedules tailored to your trimester.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {pregnancy.reminders && pregnancy.reminders.length > 0 ? (
            <div className="space-y-3.5">
              {pregnancy.reminders.map((rem) => {
                const isAnc = rem.type === "ANC_VISIT";
                const isTt = rem.type === "TT_VACCINE";
                const isPrep = rem.type === "DELIVERY_PREP";
                const isIron = rem.type === "IRON_TABLET";

                const date = new Date(rem.dueDate);
                const formatStr = isValid(date) ? format(date, "MMM d, yyyy") : "";
                const distStr = isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "";

                return (
                  <div key={rem.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border group hover:bg-muted/60 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl border ${
                        isAnc ? "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400" :
                        isTt ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                        isIron ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" :
                        "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      }`}>
                        {isAnc && <Calendar className="h-5 w-5" />}
                        {isTt && <Shield className="h-5 w-5" />}
                        {isIron && <Heart className="h-5 w-5" />}
                        {isPrep && <Heart className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-snug">{rem.title}</p>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">{rem.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatStr}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{distStr}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground text-sm font-medium">All upcoming reminders fully completed!</p>
          )}
        </CardContent>
      </Card>

      {/* ASHA Info Card */}
      {pregnancy.asha && (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-full border border-pink-200 dark:border-pink-800 text-pink-500 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="font-bold text-foreground text-base">Assigned ASHA Worker: {pregnancy.asha.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Block: {pregnancy.asha.block} &bull; ID: {pregnancy.asha.ashaId}
              </p>
            </div>
            <Button asChild variant="outline" className="border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-950/20 text-pink-600 font-bold rounded-xl cursor-pointer">
              <a href="tel:108">Emergency Ambulance</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 5. ANC VISIT HISTORY */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-500" />
              Antenatal Care (ANC) Visit Log
            </CardTitle>
            <CardDescription>Records of your physical checkups, vitals, and maternal reports.</CardDescription>
          </div>
          <Button 
            onClick={() => setShowANCForm(!showANCForm)} 
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl h-9 gap-1 shadow-md shadow-pink-500/10 shrink-0 cursor-pointer"
          >
            Log Visit {showANCForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          
          {/* Collapsible Log Form */}
          {showANCForm && (
            <form onSubmit={handleLogVisit} className="p-5 border border-pink-200 dark:border-pink-900 rounded-3xl bg-pink-50/10 dark:bg-pink-900/5 mb-6 space-y-4 animate-in slide-in-from-top duration-300">
              <h3 className="font-bold text-foreground text-sm">Log New Antenatal Care Checkup</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ancNumber">ANC Visit Number</Label>
                  <Select value={ancNumber} onValueChange={setAncNumber}>
                    <SelectTrigger id="ancNumber" className="rounded-xl">
                      <SelectValue placeholder="Select Visit Number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ANC 1 (12 Weeks)</SelectItem>
                      <SelectItem value="2">ANC 2 (20 Weeks)</SelectItem>
                      <SelectItem value="3">ANC 3 (28 Weeks)</SelectItem>
                      <SelectItem value="4">ANC 4 (36 Weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancDate">Visit Date</Label>
                  <Input 
                    id="ancDate"
                    type="date"
                    required
                    value={ancDate}
                    onChange={(e) => setAncDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancWeight">Weight (kg)</Label>
                  <Input 
                    id="ancWeight"
                    type="number"
                    step="0.1"
                    placeholder="Weight in kg"
                    value={ancWeight}
                    onChange={(e) => setAncWeight(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancBP">Blood Pressure</Label>
                  <Input 
                    id="ancBP"
                    placeholder="e.g. 120/80"
                    value={ancBP}
                    onChange={(e) => setAncBP(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancHb">Hemoglobin (g/dL)</Label>
                  <Input 
                    id="ancHb"
                    type="number"
                    step="0.1"
                    placeholder="g/dL"
                    value={ancHb}
                    onChange={(e) => setAncHb(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancSugar">Blood Sugar (mg/dL)</Label>
                  <Input 
                    id="ancSugar"
                    type="number"
                    step="0.1"
                    placeholder="mg/dL"
                    value={ancSugar}
                    onChange={(e) => setAncSugar(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancFundal">Fundal Height (cm)</Label>
                  <Input 
                    id="ancFundal"
                    type="number"
                    step="0.1"
                    placeholder="Fundal height in cm"
                    value={ancFundal}
                    onChange={(e) => setAncFundal(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ancFHR">Fetal Heart Rate (bpm)</Label>
                  <Input 
                    id="ancFHR"
                    type="number"
                    placeholder="Fetal Heart Rate"
                    value={ancFHR}
                    onChange={(e) => setAncFHR(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ancNotes">Consultation Notes / Recommendations</Label>
                <Textarea 
                  id="ancNotes"
                  placeholder="Doctor or ASHA worker notes..."
                  value={ancNotes}
                  onChange={(e) => setAncNotes(e.target.value)}
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              <Button 
                type="submit"
                disabled={loggingVisit}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-md cursor-pointer h-11"
              >
                {loggingVisit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Visit...
                  </>
                ) : (
                  "Log ANC Visit"
                )}
              </Button>
            </form>
          )}

          {/* Visits Table */}
          {pregnancy.ancVisits && pregnancy.ancVisits.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 font-bold border-b border-border">
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Visit #</th>
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Weight</th>
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">BP</th>
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Hb</th>
                    <th className="p-3 text-xs uppercase tracking-wider text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pregnancy.ancVisits.map((visit) => (
                    <tr key={visit.id} className="border-b border-border hover:bg-muted/20 transition-all font-medium">
                      <td className="p-3">
                        <Badge variant="outline" className="bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 font-bold">
                          ANC {visit.visitNumber}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {isValid(new Date(visit.visitDate)) ? format(new Date(visit.visitDate), "MMM d, yyyy") : ""}
                      </td>
                      <td className="p-3">{visit.weight ? `${visit.weight} kg` : "N/A"}</td>
                      <td className="p-3">{visit.bloodPressure || "N/A"}</td>
                      <td className="p-3">{visit.hemoglobin ? `${visit.hemoglobin} g/dL` : "N/A"}</td>
                      <td className="p-3 text-muted-foreground text-xs font-semibold max-w-[200px] truncate" title={visit.notes}>
                        {visit.notes || "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm font-semibold">No Antenatal visits logged yet.</p>
              <Button 
                onClick={() => setShowANCForm(true)} 
                variant="outline" 
                className="mt-3 border-pink-250 dark:border-pink-900/60 hover:bg-pink-50/50 dark:hover:bg-pink-950/10 text-pink-600 font-bold rounded-xl h-9"
              >
                Log Your First ANC Visit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. AI RISK ASSESSMENT */}
      <Card className="border-pink-200 dark:border-pink-900 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
              AI Pregnancy Health Risk Assessment
            </CardTitle>
            <CardDescription>Instant baseline safety report powered by Groq Llama-3.</CardDescription>
          </div>
          <Button 
            onClick={() => setShowAIPanel(!showAIPanel)}
            variant="ghost" 
            size="sm"
            className="text-pink-600 font-bold cursor-pointer shrink-0"
          >
            {showAIPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          
          {showAIPanel && (
            <div className="space-y-6 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-pink-100 dark:border-pink-900 rounded-2xl bg-pink-500/5">
                <p className="text-sm font-semibold text-muted-foreground max-w-sm">
                  Evaluates latest maternal vitals, hemoglobin levels, history, and weekly status to compile recommendations.
                </p>
                <Button 
                  onClick={handleAIAssessment} 
                  disabled={assessing}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl h-11 gap-1.5 cursor-pointer shadow-md shadow-pink-500/10 shrink-0"
                >
                  {assessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Vitals...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get AI Health Assessment
                    </>
                  )}
                </Button>
              </div>

              {aiAssessment && (
                <div className="space-y-4 pt-4 border-t border-border/80">
                  
                  {/* Hospital Referral Warning */}
                  {aiAssessment.referToHospital && (
                    <div className="p-4 bg-rose-500/10 border-2 border-rose-500 text-rose-800 dark:text-rose-400 rounded-2xl flex items-start gap-3">
                      <Hospital className="h-5 w-5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                      <div className="text-xs sm:text-sm font-bold">
                        ⚠️ High-Risk Referral Alert: This case requires active hospital referral. Please contact Rajindra Hospital Patiala, the nearest Civil Hospital, or call 108 immediately.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between bg-muted/40 p-4 rounded-xl border border-border">
                    <span className="font-bold text-sm text-foreground">AI Risk Evaluation Score:</span>
                    <Badge className={`${
                      aiAssessment.overallRisk === "CRITICAL" ? "bg-red-600 animate-pulse text-white" :
                      aiAssessment.overallRisk === "HIGH" ? "bg-rose-500 text-white" :
                      aiAssessment.overallRisk === "MEDIUM" ? "bg-amber-500 text-white" :
                      "bg-emerald-500 text-white"
                    } font-black tracking-wider text-xs px-3 py-1`}>
                      {aiAssessment.overallRisk}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Immediate Actions */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400">Immediate Actions</h4>
                      <ul className="space-y-1">
                        {aiAssessment.immediateActions?.map((action, i) => (
                          <li key={i} className="text-xs font-semibold text-foreground flex gap-1.5">
                            <span className="text-sky-500 font-bold">&bull;</span> {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Warning Signs */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">Warning Signs to Watch For</h4>
                      <ul className="space-y-1">
                        {aiAssessment.watchFor?.map((sign, i) => (
                          <li key={i} className="text-xs font-semibold text-foreground flex gap-1.5">
                            <span className="text-rose-500 font-bold">&bull;</span> {sign}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Nutrition Tips */}
                  <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Maternal Nutritional Diet Tips</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {aiAssessment.nutritionTips?.map((tip, i) => (
                        <div key={i} className="bg-background/50 p-2.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps Guidance */}
                  <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-1.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Clinical Next Steps Guidance</h4>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                      {aiAssessment.nextSteps}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
